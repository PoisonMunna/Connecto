require('dotenv').config();
const db = require('./config/db');

async function run() {
  const email = '123razz321@gmail.com';
  const [r] = await db.query("UPDATE users SET is_admin = 1 WHERE email = ?", [email]);
  console.log('Rows affected:', r.affectedRows);
  const [rows] = await db.query("SELECT id, username, email, is_admin FROM users WHERE email = ?", [email]);
  if (!rows.length) { console.log('❌ User not found with that email'); process.exit(1); }
  console.log(`✅ ${rows[0].username} (${rows[0].email}) → is_admin = ${rows[0].is_admin}`);
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
