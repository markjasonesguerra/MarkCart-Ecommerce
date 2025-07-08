import express from 'express';
import db from '../utils/db.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const router = express.Router();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Request Password Reset
router.post('/request-password-reset', async (req, res) => {
    const { email } = req.body;

    const q = "SELECT * FROM users WHERE email = ?";
    try {
        console.log("Password reset request received for email:", email); // Log the email
        const [data] = await db.query(q, [email]);
        if (data.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = data[0];
        const token = crypto.randomBytes(20).toString('hex');
        const tokenExpiration = Date.now() + 1800000; // 30 minutes

        const updateTokenQuery = "UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?";
        await db.query(updateTokenQuery, [token, tokenExpiration, email]);

        const resetURL = `http://localhost:3000/reset-password/${token}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f5f5f5;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            text-align: center;
                            padding: 20px 0;
                        }
                        .header img {
                            height: 50px;
                        }
                        .content {
                            padding: 20px;
                        }
                        .content h2 {
                            color: #333333;
                        }
                        .content p {
                            color: #555555;
                            line-height: 1.6;
                        }
                        .content a {
                            color: #FC5E32;
                            text-decoration: none;
                        }
                        .footer {
                            text-align: center;
                            padding: 20px;
                            color: #888888;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="cid:logo" alt="Logo">
                        </div>
                        <div class="content">
                            <h2>Hello ${user.name},</h2>
                            <p>We've received your request to reset your Mark Cart password.</p>
                            <p>Please click the link below to set a new password for your account:</p>
                            <p><a href="${resetURL}">${resetURL}</a></p>
                            <p>If you did not initiate this request, please contact our Customer Service Team immediately <a href="https://MarkCart.ph/contact">here</a>.</p>
                            <p>Cheers,<br>Mark Cart Team</p>
                        </div>
                        <div class="footer">
                            <p>Need help? <a href="https://MarkCart.ph/contact">Contact us here</a>.</p>
                            <p>Come Shop With Us</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Error sending email", error);
                return res.status(500).json({ error: 'Error sending email' });
            }
            console.log("Password reset email sent:", info.response); // Log the email response
            res.json({ message: 'Password reset email sent' });
        });
    } catch (err) {
        console.log("Error during password reset request", err);
        return res.status(500).json(err);
    }
});

// Reset Password
router.post('/reset/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const q = "SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > ?";
    try {
        console.log("Password reset request received for token:", token); // Log the token
        const [data] = await db.query(q, [token, Date.now()]);
        if (data.length === 0) {
            return res.status(400).json({ error: "Token is invalid or has expired" });
        }

        const user = data[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        const updatePasswordQuery = "UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE email = ?";
        await db.query(updatePasswordQuery, [hashedPassword, user.email]);

        console.log("Password has been reset for user:", user.email); // Log the user email
        res.json({ message: 'Password has been reset' });
    } catch (err) {
        console.error("Error during password reset:", err);
        res.status(500).json(err);
    }
});

export default router;