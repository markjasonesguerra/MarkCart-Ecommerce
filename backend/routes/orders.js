import express from 'express';
import db from '../utils/db.js';

const router = express.Router();

// Fetch all orders (Admin)
router.get("/", async (req, res) => {
    let q = `
        SELECT 
            o.*, 
            u.name AS customerName,  /* Assuming the user table has a 'name' column */
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'productID', oi.productID,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'name', p.title,
                    'image', JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) 
                )
            ) AS products,
            o.totalAmount AS total,
            pm.name AS paymentMethod,
            o.shippingMethod AS shippingChannel
        FROM 
            orders o
        JOIN 
            order_items oi ON o.orderID = oi.orderID
        JOIN 
            products p ON oi.productID = p.productID
        JOIN 
            payment_methods pm ON o.paymentMethodID = pm.paymentMethodID
        JOIN 
            users u ON o.userID = u.userID  /* Join with users table to get customer name */
        GROUP BY 
            o.orderID
    `;

    try {
        const [rows] = await db.query(q);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Fetch orders by userID with optional status filtering
router.get("/:userID", async (req, res) => {
    const { userID } = req.params;
    const { category } = req.query;

    let q = `
        SELECT 
            o.*, 
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'productID', oi.productID,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'productName', p.title,
                    'productImage', JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) 
                )
            ) AS orderItems
        FROM 
            orders o
        JOIN 
            order_items oi ON o.orderID = oi.orderID
        JOIN 
            products p ON oi.productID = p.productID
        WHERE 
            o.userID = ?
    `;

    if (category === "toPay") {
        q += " AND o.paymentStatus = 'Pending' AND o.status = 'Pending'";
    } else if (category === "toShip") {
        q += " AND o.status = 'Pending' AND (o.paymentStatus = 'Pending' OR o.paymentStatus = 'Completed')";
    } else if (category === "toReceive") {
        q += " AND ((o.paymentStatus = 'Completed' AND o.status = 'Shipped') OR (o.paymentMethodID = 1 AND o.status = 'Shipped'))";
    } else if (category === "completed") {
        q += " AND o.paymentStatus = 'Completed' AND o.status = 'Delivered'";
    } else if (category === "cancelled") {
        q += " AND o.status = 'Cancelled'";
    }

    q += " GROUP BY o.orderID";

    try {
        const [rows] = await db.query(q, [userID]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Place an order
router.post("/", async (req, res) => {
    const { userID, items, totalAmount, shippingAddress, shippingOption, paymentMethodID, discountAmount, voucherID } = req.body;

    console.log("Order data received:", req.body); // Add logging

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Insert into orders table
        const [orderResult] = await connection.query(
            "INSERT INTO orders (userID, totalAmount, shippingAddress, status, paymentStatus, shippingMethod, paymentMethodID, discountAmount, voucherID) VALUES (?, ?, ?, 'Pending', 'Pending', ?, ?, ?, ?)",
            [userID, totalAmount, JSON.stringify(shippingAddress), shippingOption, paymentMethodID, discountAmount, voucherID]
        );

        const orderID = orderResult.insertId;
        console.log("Order Items being processed:", items);

        // Validate productID and insert order items
        const orderItemsQueries = items.map(async (item) => {
            if (!item.productID) {
                throw new Error(`Invalid productID for item: ${JSON.stringify(item)}`);
            }
            const [product] = await connection.query("SELECT * FROM products WHERE productID = ?", [item.productID]);
            if (product.length === 0) {
                throw new Error(`Invalid productID for item: ${JSON.stringify(item)}`);
            }
            return connection.query(
                "INSERT INTO order_items (orderID, productID, quantity, price) VALUES (?, ?, ?, ?)",
                [orderID, item.productID, item.quantity, item.price]
            );
        });

        await Promise.all(orderItemsQueries);

        // Update stock quantity
        const updateStockQueries = items.map((item) =>
            connection.query(
                "UPDATE products SET quantity = quantity - ? WHERE productID = ?",
                [item.quantity, item.productID]
            )
        );

        await Promise.all(updateStockQueries);

        await connection.commit();
        res.status(201).json({ orderID });
    } catch (err) {
        await connection.rollback();
        console.error("Error placing order:", err); // Add logging
        res.status(500).json({ error: "Failed to place order", details: err.message });
    } finally {
        connection.release();
    }
});

// Update order status (Admin)
router.put("/update-status/:orderID", async (req, res) => {
    const { orderID } = req.params;
    const { status, paymentStatus } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update order status and payment status
        await connection.query(
            "UPDATE orders SET status = ?, paymentStatus = ? WHERE orderID = ?",
            [status, paymentStatus, orderID]
        );

        // If the order is marked as Delivered and payment is Completed, update the sold count
        if (status === 'Delivered' && paymentStatus === 'Completed') {
            // Fetch the order items
            const [orderItems] = await connection.query(
                "SELECT productID, quantity FROM order_items WHERE orderID = ?",
                [orderID]
            );

            // Update the sold count for each product
            const updateSoldQueries = orderItems.map((item) =>
                connection.query(
                    "UPDATE products SET sold = sold + ? WHERE productID = ?",
                    [item.quantity, item.productID]
                )
            );

            await Promise.all(updateSoldQueries);
        }

        await connection.commit();
        res.json({ message: "Order status updated successfully." });
    } catch (err) {
        await connection.rollback();
        console.error("Error updating order status:", err);
        res.status(500).json({ error: "Failed to update order status." });
    } finally {
        connection.release();
    }
});

// Update order status to Delivered (User)
router.put("/mark-received/:orderID", async (req, res) => {
    const { orderID } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update order status to 'Delivered' and payment status to 'Completed'
        await connection.query(
            "UPDATE orders SET status = 'Delivered', paymentStatus = 'Completed' WHERE orderID = ?",
            [orderID]
        );

        // Fetch the order items
        const [orderItems] = await connection.query(
            "SELECT productID, quantity FROM order_items WHERE orderID = ?",
            [orderID]
        );

        // Update the sold count for each product
        const updateSoldQueries = orderItems.map((item) =>
            connection.query(
                "UPDATE products SET sold = sold + ? WHERE productID = ?",
                [item.quantity, item.productID]
            )
        );

        await Promise.all(updateSoldQueries);

        await connection.commit();
        res.json({ message: "Order marked as received successfully." });
    } catch (err) {
        await connection.rollback();
        console.error("Error marking order as received:", err);
        res.status(500).json({ error: "Failed to mark order as received." });
    } finally {
        connection.release();
    }
});

export default router;