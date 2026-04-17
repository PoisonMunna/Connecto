// migrate_notifications.js  –  Run once to ensure notifications table exists
require('dotenv').config();
const db = require('./config/db');

async function migrateNotifications() {
  console.log('🔄 Running migration: creating notifications table...');
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        from_user   INT NOT NULL,
        type        VARCHAR(50) NOT NULL,
        post_id     INT DEFAULT NULL,
        is_read     TINYINT DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ notifications table created (or already exists).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrateNotifications();
