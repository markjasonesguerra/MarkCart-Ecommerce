import express from "express";
import db from "../utils/db.js";
import { format } from "date-fns"; // Import date-fns for date formatting

const router = express.Router();

// Add a new voucher
router.post("/", async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    startDate,
    endDate,
    usageLimit,
  } = req.body;

  const adjustedMaxDiscount = discountType === "fixed" ? 0 : maxDiscount;

  const q = `
    INSERT INTO vouchers (code, description, discountType, discountValue, minPurchase, maxDiscount, startDate, endDate, usageLimit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    adjustedMaxDiscount,
    startDate,
    endDate,
    usageLimit,
  ];

  try {
    await db.query(q, values);
    res.json({ message: "Voucher added successfully" });
  } catch (err) {
    console.error("Error adding voucher:", err);
    res.status(500).json({ error: "Failed to add voucher" });
  }
});

// Update a voucher
router.put("/:voucherID", async (req, res) => {
  const { voucherID } = req.params;
  const {
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    startDate,
    endDate,
    usageLimit,
  } = req.body;

  const adjustedMaxDiscount = discountType === "fixed" ? 0 : maxDiscount;

  const q = `
    UPDATE vouchers
    SET code = ?, description = ?, discountType = ?, discountValue = ?, minPurchase = ?, maxDiscount = ?, startDate = ?, endDate = ?, usageLimit = ?
    WHERE voucherID = ?
  `;
  const values = [
    code,
    description,
    discountType,
    discountValue,
    minPurchase,
    adjustedMaxDiscount,
    startDate,
    endDate,
    usageLimit,
    voucherID,
  ];

  try {
    await db.query(q, values);
    res.json({ message: "Voucher updated successfully" });
  } catch (err) {
    console.error("Error updating voucher:", err);
    res.status(500).json({ error: "Failed to update voucher" });
  }
});

// End a voucher
router.put("/end/:voucherID", async (req, res) => {
  const { voucherID } = req.params;

  const formattedDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");

  const q = `
    UPDATE vouchers
    SET endDate = ?
    WHERE voucherID = ?
  `;
  const values = [formattedDate, voucherID];

  try {
    await db.query(q, values);
    res.json({ message: "Voucher ended successfully" });
  } catch (err) {
    console.error("Error ending voucher:", err);
    res.status(500).json({ error: "Failed to end voucher" });
  }
});

// Delete a voucher
router.delete("/:voucherID", async (req, res) => {
  const { voucherID } = req.params;

  const q = "DELETE FROM vouchers WHERE voucherID = ?";

  try {
    await db.query(q, [voucherID]);
    res.json({ message: "Voucher deleted successfully" });
  } catch (err) {
    console.error("Error deleting voucher:", err);
    res.status(500).json({ error: "Failed to delete voucher" });
  }
});

// Fetch usage of a voucher across different users
router.get("/usage/:voucherID", async (req, res) => {
  const { voucherID } = req.params;

  const q = `
    SELECT v.voucherID, v.code, SUM(uv.usageCount) as totalUsage
    FROM vouchers v
    JOIN user_vouchers uv ON v.voucherID = uv.voucherID
    WHERE v.voucherID = ?
    GROUP BY v.voucherID, v.code
  `;
  try {
    const [usage] = await db.query(q, [voucherID]);
    res.json(usage);
  } catch (err) {
    console.error("Error fetching voucher usage:", err);
    res.status(500).json({ error: "Failed to fetch voucher usage" });
  }
});

// Validate a voucher
router.post("/validate", async (req, res) => {
  const { code, userID, merchandiseTotal } = req.body;

  const q = `
    SELECT v.*, uv.usageCount FROM vouchers v
    LEFT JOIN user_vouchers uv ON v.voucherID = uv.voucherID AND uv.userID = ?
    WHERE v.code = ? AND v.startDate <= CURDATE() AND v.endDate >= CURDATE()
  `;
  try {
    const [vouchers] = await db.query(q, [userID, code]);

    if (!vouchers || vouchers.length === 0) {
      // Send 404 if voucher does not exist
      return res.status(404).json({
        message: "Voucher not found or expired",
      });
    }

    const voucher = vouchers[0];

    // Check if the merchandise total meets the minimum purchase requirement
    if (merchandiseTotal < voucher.minPurchase) {
      return res.status(400).json({
        message: `Minimum purchase of ₱${voucher.minPurchase} is required to use this voucher.`,
      });
    }

    // Check if the usage limit has been reached
    if (voucher.usageCount >= voucher.usageLimit) {
      return res.status(400).json({
        message: "Voucher usage limit reached",
      });
    }

    // Insert the voucher into the user_vouchers table if not already present
    if (!voucher.usageCount) {
      const addVoucherQuery = `
        INSERT INTO user_vouchers (userID, voucherID, usageCount)
        VALUES (?, ?, 0)
      `;
      await db.query(addVoucherQuery, [userID, voucher.voucherID]);
    }

    res.json(voucher);
  } catch (err) {
    console.error("Error validating voucher:", err);
    res.status(500).json({ error: "Failed to validate voucher" });
  }
});

// Increment voucher usage count when order is placed
router.post("/increment-usage", async (req, res) => {
  const { userID, voucherID } = req.body;

  const usageCountQuery = `
    SELECT usageCount FROM user_vouchers
    WHERE userID = ? AND voucherID = ?
  `;
  try {
    const [usageCountResult] = await db.query(usageCountQuery, [userID, voucherID]);

    if (usageCountResult.length > 0) {
      const incrementUsageCountQuery = `
        UPDATE user_vouchers
        SET usageCount = usageCount + 1
        WHERE userID = ? AND voucherID = ?
      `;
      await db.query(incrementUsageCountQuery, [userID, voucherID]);
    } else {
      const addVoucherQuery = `
        INSERT INTO user_vouchers (userID, voucherID, usageCount)
        VALUES (?, ?, 1)
      `;
      await db.query(addVoucherQuery, [userID, voucherID]);
    }

    res.json({ message: "Voucher usage count incremented successfully" });
  } catch (err) {
    console.error("Error incrementing voucher usage count:", err);
    res.status(500).json({ error: "Failed to increment voucher usage count" });
  }
});

// Get all vouchers for a user
router.get("/user/:userID", async (req, res) => {
  const { userID } = req.params;

  const q = `
    SELECT v.* FROM vouchers v 
    JOIN user_vouchers uv ON v.voucherID = uv.voucherID
    WHERE uv.userID = ? AND v.startDate <= CURDATE() AND v.endDate >= CURDATE()
    AND uv.usageCount < v.usageLimit
  `;
  try {
    const [vouchers] = await db.query(q, [userID]);
    res.json(vouchers);
  } catch (err) {
    console.error("Error fetching user's vouchers:", err);
    res.status(500).json({ error: "Failed to fetch user's vouchers" });
  }
});

// Get all vouchers
router.get("/", async (req, res) => {
  const q = "SELECT * FROM vouchers";
  try {
    const [vouchers] = await db.query(q);
    res.json(vouchers);
  } catch (err) {
    console.error("Error fetching vouchers:", err);
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
});

export default router;