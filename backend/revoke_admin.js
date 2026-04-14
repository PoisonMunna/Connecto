require('dotenv').config();
const db = require('./config/db');

async function run() {
  const [r] = await db.query("UPDATE users SET is_admin = 0 WHERE username = 'alice'");
  console.log('Rows affected:', r.affectedRows);
  const [rows] = await db.query("SELECT id, username, email, is_admin FROM users WHERE username = 'alice'");
  if (rows.length === 0) {
    console.log('❌ No user found with username "alice"');
  } else {
    const u = rows[0];
    console.log(`✅ alice (id=${u.id}) is_admin is now: ${u.is_admin}`);
  }
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
