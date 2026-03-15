// controllers/productController.js
// Handles all product (saree) related operations
// Supports MULTIPLE images per product via product_images table

const { db } = require("../config/db");
const fs = require("fs");
const path = require("path");

// Helper: get images array for a product
async function getProductImages(productId) {
  const [images] = await db.execute(
    "SELECT id, image_url, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC",
    [productId]
  );
  return images;
}

// Helper: delete image file from disk
function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  const filePath = path.join(__dirname, "../", imageUrl);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// GET /api/products — All products with images array
async function getAllProducts(req, res) {
  try {
    const [products] = await db.execute(`
      SELECT p.id, p.name, p.price, p.description, p.material,
        p.color, p.stock, p.image_url, p.created_at,
        c.id AS category_id, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);

    for (let product of products) {
      product.images = await getProductImages(product.id);
      // Fallback to legacy image_url if no images in product_images table
      if (product.images.length === 0 && product.image_url) {
        product.images = [{ id: null, image_url: product.image_url, is_primary: 1 }];
      }
    }

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ success: false, message: "Error fetching products" });
  }
}

// GET /api/products/category/:categoryId
async function getProductsByCategory(req, res) {
  try {
    const { categoryId } = req.params;
    const [products] = await db.execute(
      `SELECT p.id, p.name, p.price, p.description, p.material,
        p.color, p.stock, p.image_url, p.created_at,
        c.id AS category_id, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = ?
       ORDER BY p.created_at DESC`,
      [categoryId]
    );

    for (let product of products) {
      product.images = await getProductImages(product.id);
      if (product.images.length === 0 && product.image_url) {
        product.images = [{ id: null, image_url: product.image_url, is_primary: 1 }];
      }
    }

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Get by category error:", error);
    return res.status(500).json({ success: false, message: "Error fetching products" });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const [products] = await db.execute(
      `SELECT p.id, p.name, p.price, p.description, p.material,
        p.color, p.stock, p.image_url, p.created_at,
        c.id AS category_id, c.name AS category_name
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = products[0];
    product.images = await getProductImages(product.id);
    if (product.images.length === 0 && product.image_url) {
      product.images = [{ id: null, image_url: product.image_url, is_primary: 1 }];
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Get by id error:", error);
    return res.status(500).json({ success: false, message: "Error fetching product" });
  }
}

// POST /api/products — Create product with multiple images
async function createProduct(req, res) {
  try {
    const name        = (req.body.name || "").trim();
    const category_id = req.body.category_id || null;
    const price       = req.body.price;
    const description = (req.body.description || "").trim();
    const material    = (req.body.material || "").trim();
    const color       = (req.body.color || "").trim();
    const stock       = req.body.stock || 0;

    if (!name || !price) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ success: false, message: "Name and price are required" });
    }

    // First uploaded image becomes the legacy image_url (for backward compat)
    const primaryImageUrl = req.files && req.files.length > 0
      ? `/uploads/${req.files[0].filename}` : null;

    const [result] = await db.execute(
      `INSERT INTO products (name, category_id, price, description, material, color, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category_id, price, description, material, color, stock, primaryImageUrl]
    );

    const productId = result.insertId;

    // Save all uploaded images to product_images table
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await db.execute(
          "INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)",
          [productId, `/uploads/${req.files[i].filename}`, i === 0 ? 1 : 0, i]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { id: productId, name, price, imageCount: req.files ? req.files.length : 0 },
    });
  } catch (error) {
    console.error("Create product error:", error);
    if (req.files) req.files.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    return res.status(500).json({ success: false, message: "Error creating product" });
  }
}

// PUT /api/products/:id — Update product, add new images
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const name        = (req.body.name || "").trim();
    const category_id = req.body.category_id || null;
    const price       = req.body.price;
    const description = (req.body.description || "").trim();
    const material    = (req.body.material || "").trim();
    const color       = (req.body.color || "").trim();
    const stock       = req.body.stock || 0;
    // deleteImageIds: comma-separated IDs sent from frontend to remove specific images
    const deleteImageIds = req.body.deleteImageIds
      ? req.body.deleteImageIds.split(",").map((x) => x.trim()).filter(Boolean)
      : [];

    if (!name || !price) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ success: false, message: "Name and price are required" });
    }

    const [existing] = await db.execute("SELECT id, image_url FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete images the admin chose to remove
    for (const imgId of deleteImageIds) {
      const [imgRows] = await db.execute(
        "SELECT image_url FROM product_images WHERE id = ? AND product_id = ?",
        [imgId, id]
      );
      if (imgRows.length > 0) {
        deleteImageFile(imgRows[0].image_url);
        await db.execute("DELETE FROM product_images WHERE id = ?", [imgId]);
      }
    }

    // Add newly uploaded images
    const currentImages = await getProductImages(id);
    const nextOrder = currentImages.length;

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imageUrl = `/uploads/${req.files[i].filename}`;
        const isPrimary = currentImages.length === 0 && i === 0 ? 1 : 0;
        await db.execute(
          "INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)",
          [id, imageUrl, isPrimary, nextOrder + i]
        );
      }
    }

    // Determine new primary image for legacy column
    const allImages = await getProductImages(id);
    const primaryImg = allImages.find((img) => img.is_primary) || allImages[0];
    const finalImageUrl = primaryImg ? primaryImg.image_url : existing[0].image_url;

    await db.execute(
      `UPDATE products SET name=?, category_id=?, price=?, description=?, material=?, color=?, stock=?, image_url=? WHERE id=?`,
      [name, category_id, price, description, material, color, stock, finalImageUrl, id]
    );

    return res.status(200).json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update product error:", error);
    if (req.files) req.files.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    return res.status(500).json({ success: false, message: "Error updating product" });
  }
}

// DELETE /api/products/:id
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await db.execute("SELECT id FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const images = await getProductImages(id);
    images.forEach((img) => deleteImageFile(img.image_url));
    await db.execute("DELETE FROM products WHERE id = ?", [id]);

    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ success: false, message: "Error deleting product" });
  }
}

// DELETE /api/products/:id/images/:imageId — Delete one image
async function deleteProductImage(req, res) {
  try {
    const { id, imageId } = req.params;
    const [images] = await db.execute(
      "SELECT * FROM product_images WHERE id = ? AND product_id = ?",
      [imageId, id]
    );
    if (images.length === 0) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    deleteImageFile(images[0].image_url);
    await db.execute("DELETE FROM product_images WHERE id = ?", [imageId]);

    // Promote next image to primary if deleted was primary
    if (images[0].is_primary) {
      const remaining = await getProductImages(id);
      if (remaining.length > 0) {
        await db.execute("UPDATE product_images SET is_primary=1 WHERE id=?", [remaining[0].id]);
        await db.execute("UPDATE products SET image_url=? WHERE id=?", [remaining[0].image_url, id]);
      }
    }

    return res.status(200).json({ success: true, message: "Image deleted" });
  } catch (error) {
    console.error("Delete image error:", error);
    return res.status(500).json({ success: false, message: "Error deleting image" });
  }
}

module.exports = {
  getAllProducts, getProductsByCategory, getProductById,
  createProduct, updateProduct, deleteProduct, deleteProductImage,
};
