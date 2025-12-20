import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = (to, subject, html, attachments = []) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  };

  return transporter.sendMail(mailOptions);
};