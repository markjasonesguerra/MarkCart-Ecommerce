import express from "express";
import multer from "multer";
import db from "../utils/db.js";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Increase max file size to 5 MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extname && mimeType) {
            cb(null, true);
        } else {
            cb(new Error("Only .JPEG, .JPG, or .PNG files are allowed"));
        }
    }
});

// Update user profile (name, email, phone number, profile picture, gender, birthday)
router.put("/:userID", upload.single("profilePicture"), async (req, res) => {
    const { userID } = req.params;
    const { name, email, phoneNumber, gender, birthday } = req.body;

    //console.log("Received data:", { userID, name, email, phoneNumber, gender, birthday });
    //console.log("Received file:", req.file);

    // Check required fields
    if (!name || !email || !phoneNumber || !gender || !birthday) {
        return res.status(400).json({ error: "All fields are required" });
    }

    let profilePicture = null;

    // Convert file to Base64 if provided
    if (req.file) {
        profilePicture = {
            data: req.file.buffer.toString("base64"),
            contentType: req.file.mimetype
        };
    }

    let q = `
        UPDATE users
        SET name = ?, email = ?, phoneNumber = ?, gender = ?, birthday = ?
    `;
    const params = [name, email, phoneNumber, gender, birthday];

    if (profilePicture) {
        q += `, profilePicture = ?`;
        params.push(JSON.stringify(profilePicture));
    }

    q += ` WHERE userID = ?`;
    params.push(userID);

    try {
        const [result] = await db.query(q, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User profile updated successfully", profilePicture });
    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// Fetch user data by userID
router.get("/:userID", async (req, res) => {
    const { userID } = req.params;

    if (!userID) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const q = `
        SELECT name, email, phoneNumber, profilePicture, gender, birthday
        FROM users
        WHERE userID = ?
    `;

    try {
        const [rows] = await db.query(q, [userID]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = rows[0];
        if (user.profilePicture) {
            try {
                if (typeof user.profilePicture === "string") {
                    user.profilePicture = JSON.parse(user.profilePicture); // Parse only if it's a string
                }
            } catch (err) {
                console.error("Error parsing profilePicture:", err);
                user.profilePicture = null; // Fallback to null
            }
        }
        
        //console.log("Fetched user data:", user);
        res.json(user);
    } catch (err) {
        //console.error("Error fetching user data:", err);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

// Add a new address
router.post("/addresses/:userID", async (req, res) => {
    const { userID } = req.params;
    const { addressLine1, addressLine2, city, state, postalCode, isPrimary } = req.body;

    if (!addressLine1 || !city || !postalCode) {
        return res.status(400).json({ error: "Address Line 1, City, and Postal Code are required" });
    }

    try {
        // Insert new address into the database
        const insertQuery = `
            INSERT INTO addresses (userID, addressLine1, addressLine2, city, state, postalCode, isPrimary)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [userID, addressLine1, addressLine2 || null, city, state || null, postalCode, isPrimary || false];
        const [result] = await db.query(insertQuery, values);

        // Retrieve the newly added address
        const [newAddress] = await db.query("SELECT * FROM addresses WHERE addressID = ?", [result.insertId]);

        res.json(newAddress[0]); // Return the newly added address
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add address" });
    }
});


// Update an existing address
router.put("/addresses/:addressID", async (req, res) => {
    const { addressID } = req.params;
    const { addressLine1, addressLine2, city, state, postalCode, isPrimary } = req.body;

    try {
        const q = `
            UPDATE addresses
            SET addressLine1 = ?, addressLine2 = ?, city = ?, state = ?, postalCode = ?, isPrimary = ?
            WHERE addressID = ?
        `;
        const values = [addressLine1, addressLine2 || null, city, state || null, postalCode, isPrimary || false, addressID];
        const [result] = await db.query(q, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Address not found" });
        }

        res.json({ message: "Address updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update address" });
    }
});


// Delete an address
router.delete("/addresses/:addressID", async (req, res) => {
    const { addressID } = req.params;

    try {
        const q = "DELETE FROM addresses WHERE addressID = ?";
        const [result] = await db.query(q, [addressID]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Address not found" });
        }

        res.json({ message: "Address deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete address" });
    }
});


// Set a default address
router.put("/addresses/set-primary/:addressID", async (req, res) => {
    const { addressID } = req.params;

    try {
        // Begin a transaction to ensure atomicity
        await db.query("START TRANSACTION");

        // Reset the previous default address for the user
        await db.query("UPDATE addresses SET isPrimary = false WHERE isPrimary = true");

        // Set the selected address as the default
        const [result] = await db.query("UPDATE addresses SET isPrimary = true WHERE addressID = ?", [addressID]);

        if (result.affectedRows === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({ error: "Address not found" });
        }

        await db.query("COMMIT");
        res.json({ message: "Address set as default" });
    } catch (err) {
        console.error(err);
        await db.query("ROLLBACK");
        res.status(500).json({ error: "Failed to set default address" });
    }
});

// Fetch addresses by userID
router.get("/addresses/:userID", async (req, res) => {
    const { userID } = req.params;

    if (!userID) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const q = `
        SELECT * FROM addresses
        WHERE userID = ?
    `;

    try {
        const [rows] = await db.query(q, [userID]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "No addresses found for this user" });
        }

        res.json(rows);  // Send the list of addresses as the response
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch addresses" });
    }
});



export default router;