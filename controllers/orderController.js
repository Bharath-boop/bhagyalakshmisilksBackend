// controllers/orderController.js
// Handles order placement and management

const { db } = require("../config/db");

// Place a new order (User action - after OTP verification)
// POST /api/orders
async function placeOrder(req, res) {
  try {
    // Get and trim all input values
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const phone = (req.body.phone || "").trim();
    const address = (req.body.address || "").trim();
    const city = (req.body.city || "").trim();
    const state = (req.body.state || "").trim();
    const pincode = (req.body.pincode || "").trim();
    const product_id = req.body.product_id;
    const quantity = req.body.quantity || 1;
    const notes = (req.body.notes || "").trim();

    // Validate required fields
    if (!name || !email || !phone || !address || !city || !pincode || !product_id) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, address, city, pincode and product are required",
      });
    }

    // Check if product exists and has stock
    const [products] = await db.execute(
      "SELECT id, name, price, stock FROM products WHERE id = ?",
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = products[0];

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // Check if user already exists with this email
    let userId;
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      // User exists - update their info
      userId = existingUsers[0].id;
      await db.execute(
        `UPDATE users SET name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ? 
         WHERE id = ?`,
        [name, phone, address, city, state, pincode, userId]
      );
    } else {
      // New user - create account
      const [newUser] = await db.execute(
        `INSERT INTO users (name, email, phone, address, city, state, pincode) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, address, city, state, pincode]
      );
      userId = newUser.insertId;
    }

    // Calculate total price
    const totalPrice = product.price * quantity;

    // Create the order
    const [orderResult] = await db.execute(
      `INSERT INTO orders (user_id, product_id, quantity, total_price, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, product_id, quantity, totalPrice, notes]
    );

    // Reduce stock count
    await db.execute(
      "UPDATE products SET stock = stock - ? WHERE id = ?",
      [quantity, product_id]
    );

    return res.status(201).json({
      success: true,
      message: "Order placed successfully! We will contact you soon.",
      data: {
        order_id: orderResult.insertId,
        product_name: product.name,
        quantity,
        total_price: totalPrice,
      },
    });
  } catch (error) {
    console.error("Place order error:", error);
    return res.status(500).json({
      success: false,
      message: "Error placing order. Please try again.",
    });
  }
}

// Get all orders (Admin only)
// GET /api/orders
async function getAllOrders(req, res) {
  try {
    const [orders] = await db.execute(`
      SELECT 
        o.id AS order_id,
        o.quantity,
        o.total_price,
        o.status,
        o.notes,
        o.created_at,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        u.address,
        u.city,
        u.state,
        u.pincode,
        p.name AS product_name,
        p.image_url AS product_image,
        p.price AS product_price
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
}

// Update order status (Admin only)
// PUT /api/orders/:id/status
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const status = (req.body.status || "").trim();

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: pending, confirmed, shipped, delivered, or cancelled",
      });
    }

    const [existing] = await db.execute(
      "SELECT id FROM orders WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await db.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating order status",
    });
  }
}

// Get dashboard statistics (Admin only)
// GET /api/orders/stats
async function getDashboardStats(req, res) {
  try {
    // Total orders
    const [[{ totalOrders }]] = await db.execute(
      "SELECT COUNT(*) AS totalOrders FROM orders"
    );

    // Total revenue
    const [[{ totalRevenue }]] = await db.execute(
      "SELECT COALESCE(SUM(total_price), 0) AS totalRevenue FROM orders WHERE status != 'cancelled'"
    );

    // Pending orders
    const [[{ pendingOrders }]] = await db.execute(
      "SELECT COUNT(*) AS pendingOrders FROM orders WHERE status = 'pending'"
    );

    // Total products
    const [[{ totalProducts }]] = await db.execute(
      "SELECT COUNT(*) AS totalProducts FROM products"
    );

    // Total customers
    const [[{ totalCustomers }]] = await db.execute(
      "SELECT COUNT(*) AS totalCustomers FROM users"
    );

    // Total categories
    const [[{ totalCategories }]] = await db.execute(
      "SELECT COUNT(*) AS totalCategories FROM categories"
    );

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        totalProducts,
        totalCustomers,
        totalCategories,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching stats",
    });
  }
}



// Get orders by user email (for user order history)
// GET /api/orders/my?email=user@example.com
async function getMyOrders(req, res) {
  try {
    const email = (req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const [orders] = await db.execute(`
      SELECT 
        o.id AS order_id,
        o.quantity,
        o.total_price,
        o.status,
        o.notes,
        o.created_at,
        p.name AS product_name,
        p.image_url AS product_image,
        p.price AS product_price,
        p.color AS product_color,
        p.material AS product_material,
        c.name AS category_name
      FROM orders o
      JOIN users u    ON o.user_id    = u.id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE u.email = ?
      ORDER BY o.created_at DESC
    `, [email]);

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Get my orders error:", error);
    return res.status(500).json({ success: false, message: "Error fetching orders" });
  }
}

module.exports = {
  placeOrder,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
  getMyOrders,
};
