import express from "express";
import db from "../utils/db.js";

const router = express.Router();

const parseProfilePicture = (value) => {
    if (!value || typeof value !== "string") return value;
    const trimmed = value.trim();
    const firstChar = trimmed[0];
    if (firstChar !== "{" && firstChar !== "[") return null; // Skip non-JSON strings
    try {
        return JSON.parse(trimmed);
    } catch (err) {
        // Return null silently to avoid noisy logs when bad data is stored
        return null;
    }
};

// Get all users
router.get("/", async (req, res) => {
    try {
        const usersQuery = "SELECT userID, name, email, phoneNumber, profilePicture, gender, birthday, role FROM users";
        const [users] = await db.query(usersQuery);

        const usersWithProfilePictures = users.map((user) => ({
            ...user,
            profilePicture: parseProfilePicture(user.profilePicture),
        }));

        res.json(usersWithProfilePictures);
    } catch (err) {
        console.error("Failed to fetch users:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get user by ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const userQuery = "SELECT * FROM users WHERE userID = ?"; // Use the correct column name
        const [user] = await db.query(userQuery, [id]);

        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userRecord = {
            ...user[0],
            profilePicture: parseProfilePicture(user[0].profilePicture),
        };

        res.json(userRecord);
    } catch (err) {
        console.error("Failed to fetch user data:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete a user and related records
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const connection = await db.getConnection(); // Get a connection from the pool

    try {
        await connection.beginTransaction(); // Start a transaction

        // Delete related records in the addresses table
        const deleteAddressesQuery = "DELETE FROM addresses WHERE userID = ?";
        await connection.query(deleteAddressesQuery, [id]);

        // Delete related records in the cart_items table
        const deleteCartItemsQuery = `
            DELETE cart_items FROM cart_items
            JOIN cart ON cart_items.cartID = cart.cartID
            WHERE cart.userID = ?
        `;
        await connection.query(deleteCartItemsQuery, [id]);

        // Delete related records in the cart table
        const deleteCartQuery = "DELETE FROM cart WHERE userID = ?";
        await connection.query(deleteCartQuery, [id]);

        // Delete related records in the order_items table
        const deleteOrderItemsQuery = `
            DELETE order_items FROM order_items
            JOIN orders ON order_items.orderID = orders.orderID
            WHERE orders.userID = ?
        `;
        await connection.query(deleteOrderItemsQuery, [id]);

        // Delete related records in the orders table
        const deleteOrdersQuery = "DELETE FROM orders WHERE userID = ?";
        await connection.query(deleteOrdersQuery, [id]);

        // Delete related records in the user_vouchers table
        const deleteUserVouchersQuery = "DELETE FROM user_vouchers WHERE userID = ?";
        await connection.query(deleteUserVouchersQuery, [id]);

        // Add similar queries for other related tables if necessary

        // Delete the user
        const deleteUserQuery = "DELETE FROM users WHERE userID = ?";
        const [result] = await connection.query(deleteUserQuery, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Rollback the transaction if no rows were affected
            return res.status(404).json({ message: "User not found" });
        }

        await connection.commit(); // Commit the transaction
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        await connection.rollback(); // Rollback the transaction in case of error
        console.error("Failed to delete user:", err);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        connection.release(); // Release the connection back to the pool
    }
});


router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, phoneNumber, role, gender, birthday } = req.body;

    const updateUserQuery = `
        UPDATE users
        SET name = ?, email = ?, phoneNumber = ?, role = ?, gender = ?, birthday = ?
        WHERE userID = ?
    `;
    const values = [name, email, phoneNumber, role, gender, birthday, id];

    try {
        const [result] = await db.query(updateUserQuery, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User updated successfully" });
    } catch (err) {
        console.error("Failed to update user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;