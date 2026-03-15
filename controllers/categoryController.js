// controllers/categoryController.js
// Handles all category-related operations (Create, Read, Update, Delete)

const { db } = require("../config/db");

// Get all categories
// GET /api/categories
async function getAllCategories(req, res) {
  try {
    const [categories] = await db.execute(
      "SELECT * FROM categories ORDER BY created_at DESC"
    );

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
    });
  }
}

// Create a new category (Admin only)
// POST /api/categories
async function createCategory(req, res) {
  try {
    // Get and trim input values
    const name = (req.body.name || "").trim();
    const description = (req.body.description || "").trim();

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category with same name already exists
    const [existing] = await db.execute(
      "SELECT id FROM categories WHERE name = ?",
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Insert new category into database
    const [result] = await db.execute(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name, description]
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: {
        id: result.insertId,
        name,
        description,
      },
    });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating category",
    });
  }
}

// Update a category (Admin only)
// PUT /api/categories/:id
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const name = (req.body.name || "").trim();
    const description = (req.body.description || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category exists
    const [existing] = await db.execute(
      "SELECT id FROM categories WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await db.execute(
      "UPDATE categories SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating category",
    });
  }
}

// Delete a category (Admin only)
// DELETE /api/categories/:id
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    // Check if category exists
    const [existing] = await db.execute(
      "SELECT id FROM categories WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await db.execute("DELETE FROM categories WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting category",
    });
  }
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
