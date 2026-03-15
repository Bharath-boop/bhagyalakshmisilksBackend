// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { sendOTP, verifyOTP } = require("../controllers/authController");

// POST /api/auth/send-otp - Send OTP to email
router.post("/send-otp", sendOTP);

// POST /api/auth/verify-otp - Verify the OTP
router.post("/verify-otp", verifyOTP);

module.exports = router;
