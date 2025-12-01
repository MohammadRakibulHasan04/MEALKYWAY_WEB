require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const { Parser } = require("json2csv");
const fs = require("fs");
const supabase = require("./database/supabase");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files with no caching
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
    },
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mealkyway_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);

// ==================== CUSTOMER & ORDER APIs ====================

// Check if customer exists by contact number
app.get("/api/customer/:contactNumber", async (req, res) => {
  try {
    const { contactNumber } = req.params;

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("contact_number", contactNumber)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.json({ exists: false });
      }
      console.error("Database error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ exists: true, customer: data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new customer
app.post("/api/customer", async (req, res) => {
  try {
    const { contactNumber, name, hall, room } = req.body;

    if (!contactNumber || !name || !hall || !room) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("customers")
      .insert([
        {
          contact_number: contactNumber,
          name,
          hall,
          room,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to create customer" });
    }

    res.json({ success: true, customer: data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Place an order (supports both single-day and multi-day orders)
app.post("/api/order", async (req, res) => {
  try {
    const {
      contactNumber,
      name,
      hall,
      room,
      quantity,
      dates,
      orderType,
      date,
    } = req.body;

    if (!contactNumber || !quantity) {
      return res
        .status(400)
        .json({ error: "Contact number and quantity are required" });
    }

    // Handle backward compatibility for old single-date format
    let orderDates = dates;
    if (!orderDates && date) {
      orderDates = [date];
    }

    if (!orderDates || orderDates.length === 0) {
      return res.status(400).json({ error: "At least one date is required" });
    }

    // Check if customer exists
    const { data: existingCustomer, error: lookupError } = await supabase
      .from("customers")
      .select("*")
      .eq("contact_number", contactNumber)
      .single();

    let customer = existingCustomer;

    // If customer doesn't exist, create new customer
    if (lookupError && lookupError.code === "PGRST116") {
      if (!name || !hall || !room) {
        return res
          .status(400)
          .json({
            error: "Name, hall, and room are required for new customers",
          });
      }

      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert([
          {
            contact_number: contactNumber,
            name,
            hall,
            room,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("Customer creation error:", createError);
        return res.status(500).json({ error: "Failed to create customer" });
      }

      customer = newCustomer;
    } else if (lookupError) {
      console.error("Customer lookup error:", lookupError);
      return res.status(500).json({ error: "Database error" });
    } else {
      // Customer exists - check if information needs to be updated
      const infoChanged =
        customer.name !== name ||
        customer.hall !== hall ||
        customer.room !== room;

      if (infoChanged) {
        console.log("Customer info changed, updating...");
        const { data: updatedCustomer, error: updateError } = await supabase
          .from("customers")
          .update({
            name,
            hall,
            room,
          })
          .eq("id", customer.id)
          .select()
          .single();

        if (updateError) {
          console.error("Customer update error:", updateError);
          return res
            .status(500)
            .json({ error: "Failed to update customer information" });
        }

        customer = updatedCustomer;
      }
    }

    // Check for existing orders on the requested dates
    const { data: existingOrders, error: checkError } = await supabase
      .from("orders")
      .select("date")
      .eq("customer_id", customer.id)
      .in("date", orderDates);

    if (checkError) {
      console.error("Error checking existing orders:", checkError);
      return res.status(500).json({ error: "Database error" });
    }

    // Filter out dates that already have orders
    const existingDates = new Set(existingOrders.map((o) => o.date));
    const newDates = orderDates.filter((date) => !existingDates.has(date));

    if (newDates.length === 0) {
      return res.status(400).json({
        error: "আপনি ইতিমধ্যে এই তারিখের জন্য অর্ডার করেছেন",
        conflictDates: Array.from(existingDates),
      });
    }

    if (newDates.length < orderDates.length) {
      console.log(
        `Some dates already have orders. Creating orders for ${newDates.length} new dates.`
      );
    }

    // Create orders for all requested dates
    const ordersToInsert = newDates.map((orderDate) => ({
      customer_id: customer.id,
      quantity: parseInt(quantity),
      date: orderDate,
      order_type: orderType || "single",
    }));

    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .insert(ordersToInsert)
      .select();

    if (orderError) {
      console.error("Order creation error:", orderError);

      // Check if it's a unique constraint violation
      if (orderError.code === "23505") {
        return res.status(400).json({
          error: "এই তারিখে ইতিমধ্যে অর্ডার আছে। ভিন্ন তারিখ নির্বাচন করুন।",
        });
      }

      return res.status(500).json({ error: "Failed to place order" });
    }

    const totalOrders = orders.length;
    const totalAmount = totalOrders * parseInt(quantity) * 30;
    const skippedDates = orderDates.length - newDates.length;

    res.json({
      success: true,
      message: `${totalOrders} দিনের অর্ডার সফলভাবে সম্পন্ন হয়েছে`,
      orderId: orders[0].id,
      orderIds: orders.map((o) => o.id),
      totalOrders,
      totalAmount,
      skippedDates,
      conflictDates: skippedDates > 0 ? Array.from(existingDates) : [],
      orders: orders.map((order) => ({
        ...order,
        customer_name: customer.name,
      })),
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== ADMIN AUTHENTICATION ====================

// Admin login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Username received:", username);
    console.log(
      "Password received:",
      password ? "***" + password.slice(-3) : "EMPTY"
    );
    console.log("Request body:", req.body);

    if (!username || !password) {
      console.log("❌ Missing credentials");
      return res.status(400).json({ error: "Username and password required" });
    }

    // Get admin user
    console.log("Querying database for username:", username);
    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .single();

    if (error) {
      console.log("❌ Database error:", error.message);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!admin) {
      console.log("❌ No admin user found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Admin user found:", admin.username);
    console.log("Stored hash:", admin.password_hash);

    // Verify password
    console.log("Comparing password...");
    const isValid = await bcrypt.compare(password, admin.password_hash);
    console.log("Password match result:", isValid);

    if (!isValid) {
      console.log("❌ Password mismatch");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Login successful!");

    // Create a simple token with username:password encoded
    const token = Buffer.from(`${username}:${password}`).toString("base64");

    // Set session
    req.session.adminUser = {
      id: admin.id,
      username: admin.username,
    };

    res.json({
      success: true,
      message: "Login successful",
      token: token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin logout
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Check admin authentication
app.get("/api/admin/check", (req, res) => {
  console.log("=== AUTH CHECK ===");
  const authToken = req.headers["authorization"];
  console.log("Auth header:", authToken ? "Present" : "Missing");
  console.log("Session user:", req.session.adminUser ? "Present" : "Missing");

  if (authToken && authToken.startsWith("Bearer ")) {
    // Token-based auth (for compatibility with Netlify deployment)
    console.log("✅ Token-based auth successful");
    // Decode token to get username
    const token = authToken.substring(7);
    const decoded = Buffer.from(token, "base64").toString();
    const [username] = decoded.split(":");
    res.json({ authenticated: true, user: { username } });
  } else if (req.session.adminUser) {
    // Session-based auth (for local development)
    console.log("✅ Session-based auth successful");
    res.json({ authenticated: true, user: req.session.adminUser });
  } else {
    console.log("❌ No valid authentication found");
    res.json({ authenticated: false });
  }
});

// Authentication middleware
function isAuthenticated(req, res, next) {
  // Check token-based auth first (for compatibility)
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    // Simple validation - just check if token exists
    if (token) {
      return next();
    }
  }

  // Check session-based auth
  if (req.session.adminUser) {
    req.adminUser = req.session.adminUser;
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}

// ==================== ADMIN PANEL ROUTES ====================

// Admin panel page (with auth check)
app.get("/admin/panel", (req, res) => {
  if (!req.session.adminUser) {
    return res.redirect("/admin-login.html");
  }
  console.log("Admin panel accessed by:", req.session.adminUser.username);
  res.sendFile(path.join(__dirname, "public", "admin-panel.html"));
});

// ==================== ADMIN ORDERS API ====================

// Get all orders with customer details and filters
app.get("/api/admin/orders", isAuthenticated, async (req, res) => {
  try {
    const { date, institution, hall, customer } = req.query;

    // Build query with sorting by date and ID descending
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        customers (
          id,
          name,
          contact_number,
          hall,
          room
        )
      `
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (date) {
      query = query.eq("date", date);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Orders fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    // Apply additional filters in JavaScript (since Supabase doesn't support nested filters easily)
    let filteredOrders = orders;

    // Filter by institution
    if (institution) {
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.customers && order.customers.hall.startsWith(institution + " -")
      );
    }

    // Filter by hall
    if (hall) {
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.customers &&
          order.customers.hall.toLowerCase().includes(hall.toLowerCase())
      );
    }

    if (customer) {
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.customers &&
          order.customers.name.toLowerCase().includes(customer.toLowerCase())
      );
    }

    // Flatten the order data to include customer fields at the top level
    const flattenedOrders = filteredOrders.map((order) => ({
      id: order.id,
      customer_id: order.customer_id,
      quantity: order.quantity,
      date: order.date,
      created_at: order.created_at,
      name: order.customers?.name || "Unknown",
      contact_number: order.customers?.contact_number || "Unknown",
      hall: order.customers?.hall || "Unknown",
      room: order.customers?.room || "Unknown",
    }));

    console.log("Orders found:", flattenedOrders.length);
    res.json({ orders: flattenedOrders });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get order statistics
app.get("/api/admin/stats", async (req, res) => {
  try {
    if (!req.session.adminUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get today's orders
    const { data: todayOrders, error: todayError } = await supabase
      .from("orders")
      .select("quantity")
      .eq("date", today);

    if (todayError) {
      console.error("Today stats error:", todayError);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }

    // Get all orders
    const { data: allOrders, error: allError } = await supabase
      .from("orders")
      .select("quantity");

    if (allError) {
      console.error("All orders stats error:", allError);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }

    const todayOrdersCount = todayOrders.length;
    const todayQuantity = todayOrders.reduce(
      (sum, order) => sum + order.quantity,
      0
    );
    const totalOrders = allOrders.length;
    const totalQuantity = allOrders.reduce(
      (sum, order) => sum + order.quantity,
      0
    );

    const stats = {
      todayOrders: todayOrdersCount,
      todayQuantity: todayQuantity,
      totalOrders: totalOrders,
      totalQuantity: totalQuantity,
    };

    console.log("Stats:", stats);
    res.json(stats);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single order by ID
app.get("/api/admin/orders/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers (
          id,
          name,
          contact_number,
          hall,
          room
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Order fetch error:", error);
      return res.status(404).json({ error: "Order not found" });
    }

    // Flatten the order data
    const flattenedOrder = {
      id: order.id,
      customer_id: order.customer_id,
      quantity: order.quantity,
      date: order.date,
      created_at: order.created_at,
      name: order.customers?.name || "Unknown",
      contact_number: order.customers?.contact_number || "Unknown",
      hall: order.customers?.hall || "Unknown",
      room: order.customers?.room || "Unknown",
    };

    res.json({ order: flattenedOrder });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update order
app.put("/api/admin/orders/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, date } = req.body;

    if (!quantity || !date) {
      return res.status(400).json({ error: "Quantity and date are required" });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        quantity: parseInt(quantity),
        date,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return res.status(500).json({ error: "Failed to update order" });
    }

    res.json({
      success: true,
      message: "Order updated successfully",
      order: data,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete an order
app.delete("/api/admin/orders/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return res.status(500).json({ error: "Failed to delete order" });
    }

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== NOTICE APIs ====================

// Path to notice file
const NOTICE_FILE = path.join(__dirname, "data/notice.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize notice file if it doesn't exist
if (!fs.existsSync(NOTICE_FILE)) {
  fs.writeFileSync(
    NOTICE_FILE,
    JSON.stringify({
      content:
        "Welcome to Milky Way! 🥛 Fresh milk delivery available daily to all RU and RMC halls!",
      updated_at: new Date().toISOString(),
    })
  );
}

// Get current notice
app.get("/api/notice", (req, res) => {
  try {
    const data = fs.readFileSync(NOTICE_FILE, "utf8");
    const notice = JSON.parse(data);
    res.json({ notice: notice.content || "" });
  } catch (err) {
    console.error("Notice read error:", err);
    res.json({ notice: "" });
  }
});

// Update notice (admin only)
app.put("/api/admin/notice", isAuthenticated, (req, res) => {
  try {
    const { content } = req.body;

    console.log("Updating notice with content:", content);

    fs.writeFileSync(
      NOTICE_FILE,
      JSON.stringify(
        {
          content,
          updated_at: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log("Notice updated successfully");
    res.json({ success: true, message: "Notice updated successfully" });
  } catch (err) {
    console.error("Notice update error:", err);
    res.status(500).json({ error: "Failed to update notice" });
  }
});

// ==================== EXPORT APIs ====================

// Export orders as CSV
app.get("/api/admin/export", isAuthenticated, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers (
          id,
          name,
          contact_number,
          hall,
          room
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    // Flatten the data for CSV
    const flattenedOrders = orders.map((order) => ({
      "Order ID": order.id,
      "Customer Name": order.customers?.name || "N/A",
      "Contact Number": order.customers?.contact_number || "N/A",
      Hall: order.customers?.hall || "N/A",
      Room: order.customers?.room || "N/A",
      Quantity: order.quantity,
      "Delivery Date": order.delivery_date,
      "Order Date": new Date(order.created_at).toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }));

    const parser = new Parser();
    const csv = parser.parse(flattenedOrders);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=orders-${Date.now()}.csv`
    );
    res.send(csv);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== ROUTE HANDLERS ====================

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Order page
app.get("/order", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "order.html"));
});

// Confirmation page
app.get("/confirmation", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "confirmation.html"));
});

// Admin login page
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

// Admin route (redirect to login)
app.get("/admin", (req, res) => {
  if (req.session.adminUser) {
    res.redirect("/admin/panel");
  } else {
    res.redirect("/admin-login");
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Mealky Way server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin/panel`);
  console.log(`🔗 Using Supabase PostgreSQL database`);
});
