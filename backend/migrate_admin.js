// migrate_admin.js  –  Adds is_admin and is_verified columns + sets first user as admin
// Usage: node migrate_admin.js
require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  console.log('🔄 Running admin migration…');
  try {
    // Add is_admin column
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin    TINYINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_verified TINYINT DEFAULT 0
    `).catch(async () => {
      // MySQL < 8.0 doesn't support IF NOT EXISTS on ALTER ADD
      // Try adding each column separately, ignore duplicate errors
      await db.query('ALTER TABLE users ADD COLUMN is_admin TINYINT DEFAULT 0').catch(() => {});
      await db.query('ALTER TABLE users ADD COLUMN is_verified TINYINT DEFAULT 0').catch(() => {});
    });

    // Make the first user (id=1) an admin
    await db.query('UPDATE users SET is_admin = 1 WHERE id = 1');

    console.log('✅ is_admin + is_verified columns added.');
    console.log('✅ User id=1 is now admin.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}
migrate();
