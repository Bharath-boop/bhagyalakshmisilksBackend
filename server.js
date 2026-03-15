// server.js
// Main entry point of the backend application

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();



// Import all routes
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE ==========

// Allow frontend to communicate with backend (CORS)
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://bhagyalakshmisilks.com"
    ],
    credentials: true,
  })
);

app.options('*', cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files
// Example: http://localhost:5000/uploads/image.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== ROUTES ==========

// All routes are prefixed with /api
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Silk Saga Sarees API is running!",
    version: "1.0.0",
  });
});

// Handle routes that don't exist
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ========== START SERVER ==========

async function startServer() {
  try {
    // Start listening on port
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Uploads served at http://localhost:${PORT}/uploads`);
      console.log(`\n Available API Routes:`);
      console.log(`  POST   /api/admin/login`);
      console.log(`  GET    /api/categories`);
      console.log(`  POST   /api/categories`);
      console.log(`  GET    /api/products`);
      console.log(`  POST   /api/products`);
      console.log(`  POST   /api/auth/send-otp`);
      console.log(`  POST   /api/auth/verify-otp`);
      console.log(`  POST   /api/orders`);
      console.log(`  GET    /api/orders`);
      console.log(`  GET    /api/orders/stats\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
