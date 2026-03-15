// middleware/adminAuth.js
// This middleware checks if the request has a valid admin JWT token

const jwt = require("jsonwebtoken");
require("dotenv").config();

function adminAuth(req, res, next) {
  // Get token from request headers
  const authHeader = req.headers.authorization;

  // Check if token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  // Extract the token (remove "Bearer " prefix)
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the decoded token has admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    // Attach admin info to request object for use in controllers
    req.admin = decoded;

    // Continue to the next middleware/controller
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
}

module.exports = adminAuth;
