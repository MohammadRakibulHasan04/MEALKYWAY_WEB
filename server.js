require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { getDb } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files with no caching
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mealkyway_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// ==================== CUSTOMER & ORDER APIs ====================

// Check if customer exists by contact number
app.get('/api/customer/:contactNumber', (req, res) => {
  const db = getDb();
  const { contactNumber } = req.params;

  db.get(
    'SELECT * FROM customers WHERE contact_number = ?',
    [contactNumber],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ exists: !!row, customer: row || null });
      db.close();
    }
  );
});

// Create or get customer and place order
app.post('/api/order', (req, res) => {
  const { contactNumber, name, hall, room, quantity, date } = req.body;

  // Validation
  if (!contactNumber || !name || !hall || !room || !quantity || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  const db = getDb();

  // Check if customer exists
  db.get(
    'SELECT id FROM customers WHERE contact_number = ?',
    [contactNumber],
    (err, customer) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      if (customer) {
        // Customer exists, create order
        db.run(
          'INSERT INTO orders (customer_id, quantity, date) VALUES (?, ?, ?)',
          [customer.id, quantity, date],
          function(err) {
            if (err) {
              db.close();
              return res.status(500).json({ error: 'Failed to create order' });
            }
            res.json({ 
              success: true, 
              orderId: this.lastID,
              message: 'Order placed successfully!' 
            });
            db.close();
          }
        );
      } else {
        // New customer, create customer first
        db.run(
          'INSERT INTO customers (contact_number, name, hall, room) VALUES (?, ?, ?, ?)',
          [contactNumber, name, hall, room],
          function(err) {
            if (err) {
              db.close();
              return res.status(500).json({ error: 'Failed to create customer' });
            }

            const customerId = this.lastID;

            // Now create the order
            db.run(
              'INSERT INTO orders (customer_id, quantity, date) VALUES (?, ?, ?)',
              [customerId, quantity, date],
              function(err) {
                if (err) {
                  db.close();
                  return res.status(500).json({ error: 'Failed to create order' });
                }
                res.json({ 
                  success: true, 
                  orderId: this.lastID,
                  message: 'Customer registered and order placed successfully!' 
                });
                db.close();
              }
            );
          }
        );
      }
    }
  );
});

// ==================== ADMIN APIs ====================

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = getDb();

  db.get(
    'SELECT * FROM admin_users WHERE username = ?',
    [username],
    (err, admin) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      if (!admin) {
        db.close();
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare password
      bcrypt.compare(password, admin.password_hash, (err, isMatch) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ error: 'Authentication error' });
        }

        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session
        req.session.adminId = admin.id;
        req.session.adminUsername = admin.username;

        res.json({ 
          success: true, 
          message: 'Login successful',
          username: admin.username 
        });
      });
    }
  );
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check admin authentication
app.get('/api/admin/check', (req, res) => {
  if (req.session.adminId) {
    res.json({ authenticated: true, username: req.session.adminUsername });
  } else {
    res.json({ authenticated: false });
  }
});

// Middleware to protect admin routes
function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get all orders with filters
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const { hall, contactNumber, dateFrom, dateTo } = req.query;
  const db = getDb();

  let query = `
    SELECT 
      orders.id,
      orders.quantity,
      orders.date,
      orders.created_at,
      customers.contact_number,
      customers.name,
      customers.hall,
      customers.room
    FROM orders
    INNER JOIN customers ON orders.customer_id = customers.id
    WHERE 1=1
  `;

  const params = [];

  if (hall) {
    query += ' AND customers.hall LIKE ?';
    params.push(`%${hall}%`);
  }

  if (contactNumber) {
    query += ' AND customers.contact_number = ?';
    params.push(contactNumber);
  }

  if (dateFrom) {
    query += ' AND orders.date >= ?';
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ' AND orders.date <= ?';
    params.push(dateTo);
  }

  query += ' ORDER BY orders.date DESC, orders.created_at DESC';

  console.log('Orders query:', query);
  console.log('Orders params:', params);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error in orders query:', err);
      db.close();
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    console.log('Orders found:', rows ? rows.length : 0);
    res.json({ orders: rows || [] });
    db.close();
  });
});

// Get single order
app.get('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const { id } = req.params;

  db.get(
    `
    SELECT 
      orders.id,
      orders.quantity,
      orders.date,
      orders.created_at,
      orders.customer_id,
      customers.contact_number,
      customers.name,
      customers.hall,
      customers.room
    FROM orders
    INNER JOIN customers ON orders.customer_id = customers.id
    WHERE orders.id = ?
    `,
    [id],
    (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        db.close();
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ order: row });
      db.close();
    }
  );
});

// Update order
app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { quantity, date } = req.body;

  if (!quantity || !date) {
    return res.status(400).json({ error: 'Quantity and date are required' });
  }

  const db = getDb();

  db.run(
    'UPDATE orders SET quantity = ?, date = ? WHERE id = ?',
    [quantity, date, id],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Failed to update order' });
      }
      if (this.changes === 0) {
        db.close();
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ success: true, message: 'Order updated successfully' });
      db.close();
    }
  );
});

// Delete order
app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to delete order' });
    }
    if (this.changes === 0) {
      db.close();
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
    db.close();
  });
});

// Get statistics for dashboard
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  console.log('Stats request - checking for today:', today);

  db.get(
    `SELECT 
      COUNT(*) as todayOrders,
      SUM(quantity) as todayQuantity
    FROM orders 
    WHERE date = ?`,
    [today],
    (err, todayStats) => {
      if (err) {
        console.error('Stats query error:', err);
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Today stats:', todayStats);

      db.get(
        'SELECT COUNT(*) as totalCustomers FROM customers',
        (err, customerStats) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
          }

          db.get(
            'SELECT COUNT(*) as totalOrders FROM orders',
            (err, orderStats) => {
              db.close();
              
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                todayOrders: todayStats.todayOrders || 0,
                todayQuantity: todayStats.todayQuantity || 0,
                totalCustomers: customerStats.totalCustomers || 0,
                totalOrders: orderStats.totalOrders || 0
              });
            }
          );
        }
      );
    }
  );
});

// ==================== SERVE HTML PAGES ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

app.get('/confirmation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin/panel', (req, res) => {
  // Check if user is logged in
  if (!req.session.adminId) {
    console.log('Unauthorized access to admin panel, redirecting to login');
    return res.redirect('/admin');
  }
  console.log('Admin panel accessed by:', req.session.adminUsername);
  res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║          🥛 Mealky Way Server Running 🥛          ║
║                                                   ║
║  📍 Local:    http://localhost:${PORT}            ║
║  🔧 API:      http://localhost:${PORT}/api        ║
║  👤 Admin:    http://localhost:${PORT}/admin      ║
║                                                   ║
║  Default Admin Credentials:                       ║
║  Username: admin                                  ║
║  Password: admin123                               ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});
