// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { adminLogin } = require("../controllers/adminController");

// POST /api/admin/login - Admin login
router.post("/login", adminLogin);

module.exports = router;
