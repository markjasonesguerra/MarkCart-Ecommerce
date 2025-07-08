import express from "express";
import db from "../utils/db.js";

const router = express.Router();

// Add item to cart or increment quantity if it already exists
router.post("/", async (req, res) => {
    const { userID, productID, quantity } = req.body;

    try {
        // Check if the user already has a cart
        const cartQuery = "SELECT * FROM cart WHERE userID = ?";
        const [cart] = await db.query(cartQuery, [userID]);

        let cartID;
        if (cart.length === 0) {
            // Create a new cart for the user
            const createCartQuery = "INSERT INTO cart (userID) VALUES (?)";
            const [result] = await db.query(createCartQuery, [userID]);
            cartID = result.insertId;
        } else {
            cartID = cart[0].cartID;
        }

        // Check if the item is already in the cart
        const existingItemQuery = `
            SELECT * FROM cart_items WHERE cartID = ? AND productID = ?
        `;
        const [existingItem] = await db.query(existingItemQuery, [cartID, productID]);

        if (existingItem.length > 0) {
            // If item exists, increment the quantity
            const updateQuantityQuery = `
                UPDATE cart_items SET quantity = quantity + ?
                WHERE cartID = ? AND productID = ?
            `;
            await db.query(updateQuantityQuery, [quantity, cartID, productID]);
        } else {
            // Add item to the cart_items table
            const addItemQuery = `
                INSERT INTO cart_items (cartID, productID, quantity)
                VALUES (?, ?, ?)
            `;
            await db.query(addItemQuery, [cartID, productID, quantity]);
        }

        // Update totalCost in cart table
        const updateTotalCostQuery = `
            UPDATE cart
            SET totalCost = (
                SELECT SUM(p.price * ci.quantity)
                FROM cart_items ci
                JOIN products p ON ci.productID = p.productID
                WHERE ci.cartID = ?
            )
            WHERE cartID = ?
        `;
        await db.query(updateTotalCostQuery, [cartID, cartID]);

        res.json({ message: "Item added to cart" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to add item to cart", error: err });
    }
});

// Get Cart Items by User ID
router.get("/:userID", async (req, res) => {
    const userID = req.params.userID;

    try {
        // Get the cart ID for the user
        const cartQuery = "SELECT cartID FROM cart WHERE userID = ?";
        const [cart] = await db.query(cartQuery, [userID]);

        if (cart.length === 0) {
            return res.json([]); // If the user has no cart, return an empty array
        }

        const cartID = cart[0].cartID;

        // Get cart items including productID and other details
        const cartItemsQuery = `
            SELECT ci.cartItemID, ci.productID, p.title, p.price, p.images, ci.quantity
            FROM cart_items ci
            JOIN products p ON ci.productID = p.productID
            WHERE ci.cartID = ?
        `;

        const [cartItems] = await db.query(cartItemsQuery, [cartID]);

        res.json(cartItems); // Return the cart items including productID
    } catch (err) {
        console.error(err);
        res.status(500).json(err); // Send error response
    }
});

// Update Quantity of Cart Item
router.put("/:cartItemID", async (req, res) => {
    const { cartItemID } = req.params;
    const { quantity } = req.body;

    const q = "UPDATE cart_items SET quantity = ? WHERE cartItemID = ?";
    try {
        await db.query(q, [quantity, cartItemID]);
        res.json("Quantity updated successfully");
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// Delete a specific item from cart
router.delete("/:cartItemID", async (req, res) => {
    const { cartItemID } = req.params;

    const q = "DELETE FROM cart_items WHERE cartItemID = ?";
    try {
        await db.query(q, [cartItemID]);
        res.json("Item removed from cart successfully");
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// Clear all items from cart
router.delete("/clear/:userID", async (req, res) => {
    const { userID } = req.params;

    const q = "DELETE FROM cart_items WHERE cartID = (SELECT cartID FROM cart WHERE userID = ?)";
    try {
        await db.query(q, [userID]);
        res.json("Cart cleared successfully");
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

export default router;