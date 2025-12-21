import express from "express";
import bcrypt from 'bcryptjs';
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import axios from "axios";
import { sendEmail } from "../utils/emails.js";  // Use the new email utility
import db from "../utils/db.js"; // DB connection
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config(); // Load environment variables

const router = express.Router();
const saltRounds = 10;

// Register new user
router.post("/register", async (req, res) => {
    const { name, email, password, addressLine1, addressLine2, city, state, postalCode, phoneNumber, role } = req.body;

    try {
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the user into the users table
        const q = "INSERT INTO users (`name`, `email`, `password`, `phoneNumber`, `role`) VALUES (?)";
        const values = [name, email, hashedPassword, phoneNumber, role || 'Customer'];

        const [userResult] = await db.query(q, [values]);

        // Insert the address into the addresses table
        const addressQuery = "INSERT INTO addresses (userID, addressLine1, addressLine2, city, state, postalCode) VALUES (?)";
        const addressValues = [userResult.insertId, addressLine1, addressLine2 || null, city, state || null, postalCode];
        await db.query(addressQuery, [addressValues]);

        res.json("User Registered Successfully");
    } catch (err) {
        console.error("Error during registration:", err); // Log the error for debugging
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: "Registration failed. Please try again." });
    }
});

// Login and 2FA generation
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const q = "SELECT * FROM users WHERE email = ?";
    try {
        const [data] = await db.query(q, [email]);
        if (data.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = data[0];
        // Compare password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userID: user.userID, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Generate 2FA secret
        const secret = speakeasy.generateSecret({ length: 20 });
        const otpauthURL = speakeasy.otpauthURL({
            secret: secret.base32,
            label: `Mark Cart (${email})`,
            encoding: 'base32',
        });

        // Generate QR code URL
        qrcode.toDataURL(otpauthURL, (err, data_url) => {
            if (err) {
                return res.status(500).json({ error: 'Error generating QR code' });
            }

            try {
                // extract base64 payload from data URL
                const base64 = data_url.split(',')[1];
                const imgBuffer = Buffer.from(base64, 'base64');

                const html = `<p>Your 2FA secret is: ${secret.base32}</p><p>If you use an authenticator app you can scan the QR code below:</p><img src="cid:qrcode@markcart" alt="QR Code" />`;
                const attachments = [
                    {
                        filename: 'qrcode.png',
                        content: imgBuffer,
                        cid: 'qrcode@markcart',
                    },
                ];

                // Send email with 2FA secret and QR code as inline attachment
                sendEmail(email, "Your 2FA Secret", html, attachments)
                    .then(() => {
                        res.json({
                            message: "Login successful, 2FA required",
                            user: { id: user.userID, name: user.name, role: user.role },
                            token,
                            secret: secret.base32,
                            qrCode: data_url,
                        });
                    })
                    .catch((error) => {
                        console.error('Error sending email:', error);
                        res.status(500).json({ error: "Error sending 2FA email" });
                    });
            } catch (e) {
                console.error('Error preparing QR attachment:', e);
                return res.status(500).json({ error: 'Error preparing QR code attachment' });
            }
        });
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Verify 2FA token
router.post('/verify-2fa', (req, res) => {
    const { token, secret } = req.body;
    const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
    });
    if (verified) {
        res.status(200).send('2FA verified');
    } else {
        res.status(400).send('Invalid 2FA token');
    }
});

// Change Password Route
router.post("/change-password/:userID", async (req, res) => {
    const { userID } = req.params;
    const { oldPassword, newPassword } = req.body;
  
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old and new passwords are required." });
    }
  
    try {
      // Fetch user details
      const q = "SELECT password FROM users WHERE userID = ?";
      const [rows] = await db.query(q, [userID]);
  
      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found." });
      }
  
      const user = rows[0];
  
      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Old password is incorrect." });
      }
  
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      // Update the password in the database
      const updateQ = "UPDATE users SET password = ? WHERE userID = ?";
      await db.query(updateQ, [hashedPassword, userID]);
  
      res.json({ message: "Password changed successfully." });
    } catch (err) {
      console.error("Error changing password:", err);
      res.status(500).json({ error: "Failed to change password. Please try again later." });
    }
  });

  router.post("/verify-old-password/:userID", async (req, res) => {
    const { userID } = req.params;
    const { oldPassword } = req.body;
  
    if (!oldPassword) {
      return res.status(400).json({ error: "Old password is required." });
    }
  
    try {
      const query = "SELECT password FROM users WHERE userID = ?";
      const [rows] = await db.query(query, [userID]);
  
      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found." });
      }
  
      const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
      if (!isMatch) {
        return res.status(401).json({ error: "Old password is incorrect." });
      }
  
      res.json({ message: "Old password verified successfully." });
    } catch (err) {
      console.error("Error verifying old password:", err);
      res.status(500).json({ error: "Failed to verify old password." });
    }
  });

// Google Login
router.post("/google-login", async (req, res) => {
    const { token } = req.body;

    try {
        // Fetch user info from Google
        const googleRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const { email, name } = googleRes.data;

        // Check if user exists
        const q = "SELECT * FROM users WHERE email = ?";
        const [users] = await db.query(q, [email]);

        let user;
        let isNewUser = false;

        if (users.length > 0) {
            user = users[0];
        } else {
            isNewUser = true;
            // Create new user
            // We need a password for the DB constraint, so we generate a random one.
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

            const insertQ = "INSERT INTO users (`name`, `email`, `password`, `role`) VALUES (?, ?, ?, 'Customer')";
            const [result] = await db.query(insertQ, [name, email, hashedPassword]);
            
            user = {
                userID: result.insertId,
                name,
                email,
                role: 'Customer'
            };
        }

        // Generate 2FA secret
        const secret = speakeasy.generateSecret({ length: 20 });
        const otpauthURL = speakeasy.otpauthURL({
            secret: secret.base32,
            label: `Mark Cart (${email})`,
            encoding: 'base32',
        });

        // Generate QR code URL
            // Generate QR code URL
            qrcode.toDataURL(otpauthURL, (err, data_url) => {
                if (err) {
                    return res.status(500).json({ error: 'Error generating QR code' });
                }

                try {
                    const base64 = data_url.split(',')[1];
                    const imgBuffer = Buffer.from(base64, 'base64');

                    const html = `<p>Your 2FA secret is: ${secret.base32}</p><p>If you use an authenticator app you can scan the QR code below:</p><img src="cid:qrcode@markcart" alt="QR Code" />`;
                    const attachments = [
                        {
                            filename: 'qrcode.png',
                            content: imgBuffer,
                            cid: 'qrcode@markcart',
                        },
                    ];

                    sendEmail(email, "Your 2FA Secret", html, attachments)
                        .then(() => {
                            const jwtToken = jwt.sign(
                                { userID: user.userID, role: user.role, email: user.email },
                                process.env.JWT_SECRET,
                                { expiresIn: "7d" }
                            );

                            res.json({
                                message: "Google login successful, 2FA required",
                                user: { id: user.userID, name: user.name, role: user.role, email: user.email },
                                token: jwtToken,
                                secret: secret.base32,
                                qrCode: data_url,
                                isNewUser
                            });
                        })
                        .catch((error) => {
                            console.error("Error sending email:", error);
                            res.status(500).json({ error: "Error sending 2FA email" });
                        });
                } catch (e) {
                    console.error('Error preparing QR attachment:', e);
                    return res.status(500).json({ error: 'Error preparing QR code attachment' });
                }
            });

    } catch (err) {
        console.error("Google login error:", err);
        res.status(500).json({ error: "Google login failed" });
    }
});
  
export default router;