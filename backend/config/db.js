// ============================================================
//  config/db.js  –  MySQL connection pool
// ============================================================
const mysql = require('mysql2');

// createPool keeps connections alive and reuses them,
// which is better than creating a new connection per request.
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'social_app',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// Wrap with promise so we can use async/await in controllers
const promisePool = pool.promise();

// Quick connectivity test on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

module.exports = promisePool;
