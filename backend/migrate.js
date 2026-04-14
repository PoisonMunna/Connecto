// migrate.js  –  Run once to add the messages table
// Usage: node migrate.js
require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  console.log('🔄 Running migration: creating messages table...');
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        sender_id   INT NOT NULL,
        receiver_id INT NOT NULL,
        content     TEXT NOT NULL,
        is_read     TINYINT DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ messages table created (or already exists).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
