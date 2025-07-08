import express from 'express';
import db from '../utils/db.js';
import { isAdmin } from '../middleware/authMiddleware.js'; // Import the middleware

const router = express.Router();

// Create a review
router.post("/", async (req, res) => {
    const { productID, userID, comment, productQuality, performance, suitability, sellerService, deliveryService } = req.body;

    if (
      !productID || !userID || 
      productQuality < 1 || productQuality > 5 ||
      sellerService < 1 || sellerService > 5 ||
      deliveryService < 1 || deliveryService > 5 ||
      !performance || !suitability || !comment
    ) {
      return res.status(400).json({ error: "Invalid input data.." });
    }

    try {
        // Check if the user has already reviewed the item
        const [existingReview] = await db.query(`
            SELECT * FROM reviews WHERE productID = ? AND userID = ?
        `, [productID, userID]);

        if (existingReview.length > 0) {
            return res.status(400).json({ error: "You have already reviewed this item." });
        }

        // Insert the new review
        await db.query(`
            INSERT INTO reviews (productID, userID, comment, productQuality, performance, suitability, sellerService, deliveryService)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [productID, userID, comment, productQuality, performance, suitability, sellerService, deliveryService]);

        // Recalculate the average rating
        const [ratingRows] = await db.query(`
            SELECT 
                AVG((productQuality + sellerService + deliveryService) / 3) AS averageRating
            FROM reviews
            WHERE productID = ?
        `, [productID]);

        const averageRating = parseFloat(ratingRows[0].averageRating) || 0;

        // Update the product's rating
        await db.query(`
            UPDATE products
            SET rating = ?
            WHERE productID = ?
        `, [averageRating, productID]);

        res.status(201).json({ message: 'Review added successfully' });
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// Fetch a review by productID and userID
router.get("/:productID/:userID", async (req, res) => {
    const { productID, userID } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT * FROM reviews WHERE productID = ? AND userID = ?
        `, [productID, userID]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Review not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching review:", err);
        res.status(500).json({ error: "Failed to fetch review" });
    }
});

// Update a review
router.put("/:reviewID", async (req, res) => {
    const { reviewID } = req.params;
    const { comment, productQuality, performance, suitability, sellerService, deliveryService } = req.body;

    if (
      productQuality < 1 || productQuality > 5 ||
      sellerService < 1 || sellerService > 5 ||
      deliveryService < 1 || deliveryService > 5 ||
      !performance || !suitability || !comment
    ) {
      return res.status(400).json({ error: "Invalid input data." });
    }

    try {
        // Update the review
        await db.query(`
            UPDATE reviews
            SET comment = ?, productQuality = ?, performance = ?, suitability = ?, sellerService = ?, deliveryService = ?
            WHERE reviewID = ?
        `, [comment, productQuality, performance, suitability, sellerService, deliveryService, reviewID]);

        // Recalculate the average rating
        const [productIDRows] = await db.query('SELECT productID FROM reviews WHERE reviewID = ?', [reviewID]);
        const productID = productIDRows[0].productID;

        const [ratingRows] = await db.query(`
            SELECT 
                AVG((productQuality + sellerService + deliveryService) / 3) AS averageRating
            FROM reviews
            WHERE productID = ?
        `, [productID]);

        const averageRating = parseFloat(ratingRows[0].averageRating) || 0;

        // Update the product's rating
        await db.query(`
            UPDATE products
            SET rating = ?
            WHERE productID = ?
        `, [averageRating, productID]);

        res.json({ message: "Review updated successfully" });
    } catch (err) {
        console.error("Error updating review:", err);
        res.status(500).json({ error: "Failed to update review" });
    }
});

// Delete a review
router.delete("/:reviewID", async (req, res) => {
    const { reviewID } = req.params;
    const { userID } = req.body; // Pass the user ID of the currently logged-in user

    try {
        // Query for productID before deleting the review
        const [productIDRows] = await db.query('SELECT productID FROM reviews WHERE reviewID = ?', [reviewID]);
        if (productIDRows.length === 0) {
            return res.status(404).json({ error: "Review not found" });
        }
        const productID = productIDRows[0].productID;

        // Delete the review
        const q = "DELETE FROM reviews WHERE reviewID = ? AND userID = ?";
        const [result] = await db.query(q, [reviewID, userID]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ error: "Not authorized to delete this review" });
        }

        // Recalculate the average rating
        const [ratingRows] = await db.query(`
            SELECT 
                AVG((productQuality + sellerService + deliveryService) / 3) AS averageRating
            FROM reviews
            WHERE productID = ?
        `, [productID]);

        const averageRating = parseFloat(ratingRows[0]?.averageRating || 0);

        // Update the product's rating
        await db.query(`
            UPDATE products
            SET rating = ?
            WHERE productID = ?
        `, [averageRating, productID]);

        res.json({ message: "Review deleted successfully" });
    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({ error: "Failed to delete review" });
    }
});

// Fetch reviews by productID
router.get('/product/review/:productID', async (req, res) => {
    const { productID } = req.params;

    // Log the incoming request
    console.log(`Received request to fetch reviews for productID: ${productID}`);

    try {
        const [reviews] = await db.query(`
            SELECT 
                r.*, 
                u.name AS userName 
            FROM 
                reviews r
            JOIN 
                users u ON r.userID = u.userID
            WHERE 
                r.productID = ?
        `, [productID]);

        if (reviews.length === 0) {
            console.log(`No reviews found for productID: ${productID}`);
            return res.status(404).json({ error: 'No reviews found for this product' });
        }

        // // Log the fetched reviews for debugging
        // console.log(`Fetched reviews for productID ${productID}:`, reviews);

        res.json(reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

router.get("/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 + 1 AS result");
        res.json({ message: "Database connected successfully!", result: rows });
    } catch (err) {
        console.error("Database connection failed:", err);
        res.status(500).json({ error: "Database connection failed" });
    }
});



// Fetch all reviews or filter by productID or userID (Admin only)
router.get("/admin/reviews", isAdmin, async (req, res) => {
    const { productID, userID } = req.query; // Optional filters
    let q = `
        SELECT 
            r.reviewID, 
            r.comment, 
            r.productQuality, 
            r.performance, 
            r.suitability, 
            r.sellerService, 
            r.deliveryService,
            u.name AS user, 
            p.title AS product
        FROM 
            reviews r
        JOIN 
            users u ON r.userID = u.userID
        JOIN 
            products p ON r.productID = p.productID
    `;

    const conditions = [];
    const values = [];

    if (productID) {
        conditions.push("r.productID = ?");
        values.push(productID);
    }
    if (userID) {
        conditions.push("r.userID = ?");
        values.push(userID);
    }

    if (conditions.length > 0) {
        q += ` WHERE ${conditions.join(" AND ")}`;
    }

    try {
        const [rows] = await db.query(q, values);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// Fetch product details by productID
router.get("/:productID", async (req, res) => {
    const { productID } = req.params;

    try {
        // Fetch product details
        const [productRows] = await db.query(`
            SELECT 
                p.productID, 
                p.title, 
                p.description, 
                p.price, 
                p.quantity, 
                p.images, 
                p.averageRating, 
                p.sold,
                p.categoryID
            FROM 
                products p
            WHERE 
                p.productID = ?
        `, [productID]);

        if (productRows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        const product = productRows[0];

        // Fetch rating count
        const [ratingCountRows] = await db.query(`
            SELECT COUNT(*) AS ratingCount
            FROM reviews
            WHERE productID = ?
        `, [productID]);

        const ratingCount = ratingCountRows[0].ratingCount;

        // Log the rating count for debugging
        // console.log(`Rating count for product ${productID}: ${ratingCount}`);

        // Include rating count in the product details
        product.ratingCount = ratingCount;

        res.json(product);
    } catch (err) {
        console.error("Error fetching product details:", err);
        res.status(500).json({ error: "Failed to fetch product details." });
    }
});

// Fetch review count by productID
router.get("/product/count/:productID", async (req, res) => {
    const { productID } = req.params;

    // Log the incoming request
    console.log(`Received request to fetch review count for productID: ${productID}`);

    try {
        // Fetch rating count
        const [ratingCountRows] = await db.query(`
            SELECT COUNT(*) AS ratingCount
            FROM reviews
            WHERE productID = ?
        `, [productID]);

        const ratingCount = ratingCountRows[0].ratingCount;

        // Log the rating count for debugging
        // console.log(`Rating count for product ${productID}: ${ratingCount}`);

        res.json({ ratingCount });
    } catch (err) {
        console.error("Error fetching review count:", err);
        res.status(500).json({ error: "Failed to fetch review count" });
    }
});

export default router;
