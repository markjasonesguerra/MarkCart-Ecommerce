import express from 'express';
import multer from "multer";
import db from '../utils/db.js';

const router = express.Router();

// Update order status to Delivered (User)
router.put("/mark-received/:orderID", async (req, res) => {
    const { orderID } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update order status to 'Delivered'
        await connection.query(
            "UPDATE orders SET status = 'Delivered' WHERE orderID = ?",
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

// Fetch all products
router.get("/", async (req, res) => {
    const { page = 1, limit = 40 } = req.query; // Default page 1, limit 40
    const offset = (page - 1) * limit;
    const q = "SELECT * FROM products LIMIT ? OFFSET ?";
    try {
        const [data] = await db.query(q, [limit, offset]);
        // Parse the images field before returning
        data.forEach((product) => {
            if (typeof product.images === 'string') {
                try {
                    product.images = JSON.parse(product.images.replace(/\\/g, "/"));
                } catch (err) {
                    console.warn("Invalid JSON in product.images:", product.images);
                    product.images = []; // or null
                }
            }
        });
        res.json(data);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"), // Files stored in /uploads
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Add a new product
router.post("/", upload.array('images', 10), async (req, res) => {
    const { title, description, price, quantity, categoryID, discount } = req.body;
    const images = req.files.map(file => file.path.replace(/\\/g, "/")); // Replace backslashes with forward slashes

    const q = "INSERT INTO products (`title`, `description`, `price`, `quantity`, `categoryID`, `discount`, `images`) VALUES (?)";
    const values = [
        title,
        description,
        price,
        quantity || 0, // Default to 0 if not provided
        categoryID || null,
        discount !== undefined ? discount : 0.0, // Default to 0.0 if not provided
        JSON.stringify(images),
    ];

    try {
        await db.query(q, [values]);
        res.json({ message: "Product inserted successfully" });
    } catch (err) {
        console.error("Error inserting product:", err);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
});

// Update a product
router.put("/:id", upload.array('images', 10), async (req, res) => {
    const productId = req.params.id;
    const { title, description, price, quantity, categoryID, discount, existingImages } = req.body;

    let images = [];

    try {
        const existingImagesArray = existingImages ? JSON.parse(existingImages) : [];
        const newImages = req.files?.map(file => file.path.replace(/\\/g, "/")) || [];

        images = [...existingImagesArray, ...newImages];
    } catch (err) {
        console.error("Error parsing images:", err);
        return res.status(400).json({ error: "Invalid image data" });
    }

    try {
        const q = `
            UPDATE products
            SET title = ?, description = ?, price = ?, quantity = ?, categoryID = ?, discount = ?, images = ?
            WHERE productID = ?
        `;

        const values = [
            title || null,
            description || null,
            price || 0,
            quantity || 0,
            categoryID || null,
            discount !== undefined ? discount : 0.0,
            JSON.stringify(images),
            productId,
        ];

        await db.query(q, values);
        res.json({ message: "Product updated successfully" });

    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ error: "Failed to update product" });
    }
});

// Delete a product
router.delete("/:id", async (req, res) => {
    const productId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Log the deletion request
        console.log(`Attempting to delete product with ID: ${productId}`);

        // Delete related rows in reviews table
        await connection.query("DELETE FROM reviews WHERE productID = ?", [productId]);

        // Delete related rows in cart_items table
        await connection.query("DELETE FROM cart_items WHERE productID = ?", [productId]);

        // Delete related rows in order_items table
        await connection.query("DELETE FROM order_items WHERE productID = ?", [productId]);

        // Delete the product
        await connection.query("DELETE FROM products WHERE productID = ?", [productId]);

        await connection.commit();
        res.json({ message: "Product deleted successfully" });

        // Optionally, notify users about the product deletion (e.g., via email or in-app notification)
        // notifyUsersAboutProductDeletion(productId);

    } catch (err) {
        await connection.rollback();
        console.error("Error deleting product:", err);
        res.status(500).json({ error: "Failed to delete product" });
    } finally {
        connection.release();
    }
});

// Get main categories (higher categories only)
router.get("/main-categories", async (req, res) => {
    const q = "SELECT * FROM categories WHERE parentCategoryID IS NULL"; // Higher categories only
    try {
        const [data] = await db.query(q);
        res.json(data);
    } catch (err) {
        console.error("Error fetching main categories:", err);
        res.status(500).json({ error: "Failed to fetch main categories" });
    }
});

// Get subcategories for a given category
router.get("/subcategories/:categoryID", async (req, res) => {
    const { categoryID } = req.params;
    const q = "SELECT * FROM categories WHERE parentCategoryID = ?";
    try {
        const [data] = await db.query(q, [categoryID]);
        res.json(data);
    } catch (err) {
        console.error("Error fetching subcategories:", err);
        res.status(500).json({ error: "Failed to fetch subcategories" });
    }
});

// Get popular categories based on product count
router.get("/categories/popular", async (req, res) => {
    const q = `
        SELECT c.*, COUNT(p.productID) as productCount
        FROM categories c
        LEFT JOIN products p ON c.categoryID = p.categoryID
        GROUP BY c.categoryID
        ORDER BY productCount DESC
        LIMIT 15
    `;

    try {
        const [data] = await db.query(q);
        res.json(data);
    } catch (err) {
        console.error("Error fetching popular categories:", err);
        res.status(500).json({ error: "Failed to load popular categories" });
    }
});

// Filtering Products by Category and Price (with category hierarchy support)
router.get("/filter", async (req, res) => {
    const { categoryID, searchQuery, minPrice, maxPrice, minRating } = req.query;
    const conditions = [];
    const values = [];

    if (categoryID) {
        const categoryHierarchyQuery = `
            WITH RECURSIVE CategoryHierarchy AS (
                SELECT categoryID FROM categories WHERE categoryID = ?
                UNION ALL
                SELECT c.categoryID FROM categories c
                INNER JOIN CategoryHierarchy ch ON c.parentCategoryID = ch.categoryID
            )
            SELECT categoryID FROM CategoryHierarchy;
        `;
        try {
            const [categories] = await db.query(categoryHierarchyQuery, [categoryID]);
            const categoryIDs = categories.map(cat => cat.categoryID);
            conditions.push(`categoryID IN (${categoryIDs.join(",")})`);
        } catch (err) {
            console.error("Error fetching category hierarchy:", err);
            return res.status(500).json({ error: "Failed to fetch category hierarchy." });
        }
    }

    if (searchQuery) {
        conditions.push("title LIKE ?");
        values.push(`%${searchQuery}%`);
    }

    if (minPrice) {
        conditions.push("price >= ?");
        values.push(minPrice);
    }

    if (maxPrice) {
        conditions.push("price <= ?");
        values.push(maxPrice);
    }

    if (minRating) {
        conditions.push("rating >= ?");
        values.push(minRating);
    }

    const q = `
        SELECT * FROM products
        ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
    `;

    try {
        const [data] = await db.query(q, values);
        res.json(data);
    } catch (err) {
        console.error("Error filtering products:", err);
        res.status(500).json({ error: "Failed to filter products" });
    }
});

// Helper function to update usageCount in categories
const updateCategoryUsage = async (categoryID, soldDifference) => {
    const q = "UPDATE categories SET usageCount = GREATEST(usageCount + ?, 0) WHERE categoryID = ?";
    try {
        await db.query(q, [soldDifference, categoryID]);
    } catch (err) {
        console.error("Error updating category usageCount:", err);
        throw new Error("Failed to update category usage.");
    }
};

// Increment category usage count
router.put("/increment/:id", async (req, res) => {
    const categoryID = req.params.id;
    const q = "UPDATE categories SET usageCount = usageCount + 1 WHERE categoryID = ?";
    try {
        await db.query(q, [categoryID]);
        res.json({ message: "Category usage incremented" });
    } catch (err) {
        console.error("Error incrementing category usage:", err);
        res.status(500).json({ error: "Failed to update category usage." });
    }
});

// Fetch hierarchical categories
router.get("/hierarchy", async (req, res) => {
    const q = `
        WITH RECURSIVE CategoryHierarchy AS (
            SELECT categoryID, name, description, parentCategoryID FROM categories WHERE parentCategoryID IS NULL
            UNION ALL
            SELECT c.categoryID, c.name, c.description, c.parentCategoryID
            FROM categories c
            INNER JOIN CategoryHierarchy ch ON c.parentCategoryID = ch.categoryID
        )
        SELECT * FROM CategoryHierarchy;
    `;
    try {
        const [data] = await db.query(q);
        const buildHierarchy = (categories, parent = null) => {
            return categories
                .filter(category => category.parentCategoryID === parent)
                .map(category => ({
                    ...category,
                    subcategories: buildHierarchy(categories, category.categoryID),
                }));
        };
        res.json(buildHierarchy(data));
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: "Failed to fetch categories." });
    }
});

// Low Stock Alert
router.get('/low-stock', async (req, res) => {
    const q = "SELECT * FROM products WHERE quantity < ?";
    const threshold = req.query.threshold || 10;
    try {
        const [data] = await db.query(q, [threshold]);
        res.json(data);
    } catch (err) {
        console.error("Error fetching low stock products:", err);
        res.status500().json(err);
    }
});

// Fetch product by productID
router.get('/:productID', async (req, res) => {
    const { productID } = req.params;

    try {
        const [productRows] = await db.query(`
            SELECT 
                p.productID, 
                p.title, 
                p.description, 
                p.price, 
                p.quantity, 
                p.images, 
                p.rating, 
                p.sold,
                p.categoryID,
                c.name AS categoryName
            FROM 
                products p
            LEFT JOIN 
                categories c ON p.categoryID = c.categoryID
            WHERE 
                p.productID = ?
        `, [productID]);

        if (productRows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productRows[0];

        // Parse images safely
        try {
            if (typeof product.images === 'string') {
                product.images = JSON.parse(product.images.replace(/\\/g, '/'));
            } else if (Array.isArray(product.images)) {
                // Already an array, do nothing
            } else {
                product.images = [];
            }
        } catch (parseErr) {
            console.error('Error parsing images:', parseErr);
            product.images = [];
        }

        // Fetch average rating and sold count
        const [ratingRows] = await db.query(`
            SELECT 
                AVG((productQuality + sellerService + deliveryService) / 3) AS averageRating,
                COUNT(*) AS soldCount
            FROM reviews
            WHERE productID = ?
        `, [productID]);

        const averageRating = parseFloat(ratingRows[0]?.averageRating) || 0;
        const soldCount = ratingRows[0]?.soldCount || 0;

        res.json({ ...product, averageRating, soldCount });

    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

router.get("/filter", async (req, res) => {
    const { categoryID, searchQuery, minPrice, maxPrice, minRating, sortOption } = req.query;
    let q = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (categoryID) {
        q += " AND categoryID = ?";
        params.push(categoryID);
    }

    if (searchQuery) {
        q += " AND title LIKE ?";
        params.push(`%${searchQuery}%`);
    }

    if (minPrice) {
        q += " AND price >= ?";
        params.push(minPrice);
    }

    if (maxPrice) {
        q += " AND price <= ?";
        params.push(maxPrice);
    }

    if (minRating) {
        q += " AND rating >= ?";
        params.push(minRating);
    }

    // Add sorting logic
    switch (sortOption) {
        case "priceLowToHigh":
            q += " ORDER BY price ASC";
            break;
        case "priceHighToLow":
            q += " ORDER BY price DESC";
            break;
        case "latest":
            q += " ORDER BY createdAt DESC";
            break;
        case "topSales":
            q += " ORDER BY sold DESC";
            break;
        default:
            q += " ORDER BY sold DESC"; // Default to popularity
            break;
    }

    try {
        const [data] = await db.query(q, params);
        res.json(data);
    } catch (err) {
        console.error("Error filtering products:", err);
        res.status(500).json({ error: "Failed to filter products." });
    }

    // // Debugging logs
    // console.log("Generated Query:", q);
    // console.log("Query Parameters:", params);
});

export default router;