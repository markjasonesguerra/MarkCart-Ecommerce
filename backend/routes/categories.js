import express from "express";
import db from "../utils/db.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // Add this line

const router = express.Router();

const __filename = fileURLToPath(import.meta.url); // Add this line
const __dirname = path.dirname(__filename); // Add this line

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Get all categories with product count
router.get("/", async (req, res) => {
    const q = `
        SELECT c.*, COUNT(p.productID) AS productCount
        FROM categories c
        LEFT JOIN products p ON c.categoryID = p.categoryID
        GROUP BY c.categoryID
    `;
    try {
        const [data] = await db.query(q);
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Add a new category with image upload
router.post("/", upload.single("image"), async (req, res) => {
    const { name, description, parentCategoryID } = req.body;
    const image = req.file ? req.file.path : null;

    if (!name) {
        return res.status(400).json({ error: "Category Name is required" });
    }

    const q = "INSERT INTO categories (`name`, `description`, `parentCategoryID`, `image`) VALUES (?, ?, ?, ?)";
    const values = [name, description, parentCategoryID || null, image];

    try {
        await db.query(q, values);
        res.json("Category Inserted Successfully");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Update a category with image upload
router.put("/:id", upload.single("image"), async (req, res) => {
    const categoryID = req.params.id;
    const { name, description, parentCategoryID, existingImage } = req.body;
    const image = req.file ? req.file.path : existingImage;

    if (!name) {
        return res.status(400).json({ error: "Category Name is required" });
    }

    const q = "UPDATE categories SET `name`=?, `description`=?, `parentCategoryID`=?, `image`=? WHERE `categoryID`=?";
    const values = [name, description, parentCategoryID || null, image, categoryID];

    try {
        await db.query(q, values);
        res.json("Category Updated Successfully");
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Delete a category
router.delete("/:id", async (req, res) => {
    const categoryId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get the category image filename
        const [category] = await connection.query("SELECT image FROM categories WHERE categoryID = ?", [categoryId]);
        const imagePath = category[0]?.image ? path.join(__dirname, "../uploads", category[0].image) : null;

        // Delete related rows in products table
        await connection.query("DELETE FROM products WHERE categoryID = ?", [categoryId]);

        // Delete the category
        await connection.query("DELETE FROM categories WHERE categoryID = ?", [categoryId]);

        // Delete the image file if it exists
        if (imagePath && fs.existsSync(imagePath)) {
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error("Failed to delete image file:", err);
                }
            });
        }

        await connection.commit();
        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        await connection.rollback();
        console.error("Error deleting category:", err);
        res.status(500).json({ error: "Failed to delete category" });
    } finally {
        connection.release();
    }
});

// Get popular subcategories based on usageCount
router.get("/popular", async (req, res) => {
    const q = "SELECT categoryID, name, usageCount, image FROM categories WHERE parentCategoryID IS NOT NULL ORDER BY usageCount DESC LIMIT 15";
    try {
        const [data] = await db.query(q);
        res.json(data);
    } catch (err) {
        console.error("Error fetching popular subcategories:", err);
        res.status(500).json({ error: "Failed to fetch popular subcategories." });
    }
});

// Get subcategories based on categoryID
router.get("/:categoryID/subcategories", async (req, res) => {
    const { categoryID } = req.params;
    const q = "SELECT categoryID, name, image FROM categories WHERE parentCategoryID = ?";
    try {
        const [data] = await db.query(q, [categoryID]);
        res.json(data);
    } catch (err) {
        console.error("Error fetching subcategories:", err);
        res.status(500).json({ error: "Failed to fetch subcategories." });
    }
});

export default router;