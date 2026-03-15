// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const {
  placeOrder,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
  getMyOrders,
} = require("../controllers/orderController");

// POST /api/orders        — Place order (public, after OTP verified)
router.post("/", placeOrder);

// GET /api/orders/stats   — Dashboard stats (admin only)
router.get("/stats", adminAuth, getDashboardStats);

// GET /api/orders/my?email=xxx — User's own order history (public, by email)
router.get("/my", getMyOrders);

// GET /api/orders         — All orders (admin only)
router.get("/", adminAuth, getAllOrders);

// PUT /api/orders/:id/status — Update status (admin only)
router.put("/:id/status", adminAuth, updateOrderStatus);

module.exports = router;
