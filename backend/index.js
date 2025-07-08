import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';  // Product-related routes
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import passwordResetRoutes from './routes/passwordReset.js';
import profileRoutes from './routes/profile.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js'; // Import user routes
import vouchersRoute from "./routes/vouchers.js";
import reviewRoutes from "./routes/reviews.js"; // Corrected import name

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());  // Parse incoming requests with JSON payloads

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS: Allow only your frontend domain in production
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));


// Routes
app.use('/auth', authRoutes);  // Authentication (login, register, 2FA, etc.)
app.use('/products', productRoutes);  // Product-related routes (filter, low-stock, etc.)
app.use('/categories', categoryRoutes);  // Category-related routes
app.use('/cart', cartRoutes);  // Cart-related routes
app.use('/password-reset', passwordResetRoutes);  // Password reset routes
app.use('/profile', profileRoutes);  // Profile picture upload routes
app.use('/orders', orderRoutes);  // Orders route
app.use('/users', userRoutes); // Register user routes
app.use("/vouchers", vouchersRoute); // Voucher routes
app.use("/reviews", reviewRoutes); // review routes

// Default route to check if server is running
app.get('/', (req, res) => {
  res.json('Hello, this is the backend API for the marketplace Mark Cart!');
});

// Start the server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log('ENV DB_HOST:', process.env.DB_HOST);
  console.log('ENV CORS_ORIGIN:', process.env.CORS_ORIGIN);
  console.log(`Server is running on port ${PORT}`);
});