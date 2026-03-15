// controllers/adminController.js
// Handles admin login and authentication

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Admin Login
// POST /api/admin/login
async function adminLogin(req, res) {
  try {
    // Get username and password from request body, and trim spaces
    const username = (req.body.username || "").trim();
    const password = (req.body.password || "").trim();

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Check against environment variables (simple approach for beginners)
    // In production, you'd store admin in database with hashed password
    const correctUsername = process.env.ADMIN_USERNAME;
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (username !== correctUsername || password !== correctPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Create a JWT token that expires in 24 hours
    const token = jwt.sign(
      {
        id: 1,
        username: username,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
}

module.exports = { adminLogin };
