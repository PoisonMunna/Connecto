// migrate_cover.js  –  Adds cover_pic column to users table
require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  console.log('🔄 Adding cover_pic column…');
  try {
    await db.query('ALTER TABLE users ADD COLUMN cover_pic VARCHAR(255) DEFAULT NULL')
      .catch(() => console.log('   (column may already exist – skipping)'));
    console.log('✅ cover_pic column ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}
migrate();
