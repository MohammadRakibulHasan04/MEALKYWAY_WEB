const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'mealkyway.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create customers table
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      hall TEXT NOT NULL,
      room TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // Create admin_users table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default admin user (username: admin, password: admin123)
  const defaultPassword = 'admin123';
  bcrypt.hash(defaultPassword, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err);
      db.close();
      return;
    }
    
    db.run(
      `INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)`,
      ['admin', hash],
      (err) => {
        if (err) {
          console.error('Error creating admin user:', err);
        } else {
          console.log('✓ Admin user created (username: admin, password: admin123)');
        }
        
        console.log('✓ Database initialized successfully');
        console.log('✓ Tables created: customers, orders, admin_users');
        db.close();
      }
    );
  });
});

module.exports = db;
