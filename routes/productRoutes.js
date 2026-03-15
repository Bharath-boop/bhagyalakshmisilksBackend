// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload");
const {
  getAllProducts, getProductsByCategory, getProductById,
  createProduct, updateProduct, deleteProduct, deleteProductImage,
} = require("../controllers/productController");

// Public routes (no auth needed)
router.get("/",                    getAllProducts);
router.get("/category/:categoryId",getProductsByCategory);
router.get("/:id",                 getProductById);

// Admin routes — upload.array("images", 10) allows up to 10 images at once
router.post("/",    adminAuth, upload.array("images", 10), createProduct);
router.put("/:id",  adminAuth, upload.array("images", 10), updateProduct);
router.delete("/:id",              adminAuth, deleteProduct);
router.delete("/:id/images/:imageId", adminAuth, deleteProductImage);

module.exports = router;
