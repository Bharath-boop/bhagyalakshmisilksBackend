// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// GET /api/categories - Get all categories (public)
router.get("/", getAllCategories);

// POST /api/categories - Create new category (admin only)
router.post("/", adminAuth, createCategory);

// PUT /api/categories/:id - Update category (admin only)
router.put("/:id", adminAuth, updateCategory);

// DELETE /api/categories/:id - Delete category (admin only)
router.delete("/:id", adminAuth, deleteCategory);

module.exports = router;
