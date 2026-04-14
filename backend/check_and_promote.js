// check_and_promote.js  –  Lists all users and promotes a user to admin
// Usage: node check_and_promote.js
// Usage: node check_and_promote.js your@email.com
require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, is_admin, is_verified FROM users ORDER BY id ASC'
    );

    if (users.length === 0) {
      console.log('❌ No users found in the database!');
      console.log('   → Register an account at http://localhost:5173 first, then run this script again.');
      process.exit(0);
    }

    console.log('\n📋 All users in your database:');
    console.log('─'.repeat(70));
    users.forEach((u) => {
      const adminBadge    = u.is_admin    ? ' 👑 ADMIN'    : '';
      const verifiedBadge = u.is_verified ? ' 🔵 VERIFIED'  : '';
      console.log(`  ID: ${u.id}  |  ${u.username}  |  ${u.email}${adminBadge}${verifiedBadge}`);
    });
    console.log('─'.repeat(70));

    const targetEmail = process.argv[2];

    if (targetEmail) {
      // Promote specific user by email
      const target = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
      if (!target) {
        console.log(`\n❌ No user found with email: ${targetEmail}`);
        process.exit(1);
      }
      await db.query('UPDATE users SET is_admin = 1 WHERE id = ?', [target.id]);
      console.log(`\n✅ @${target.username} (${target.email}) is now an admin!`);
      console.log('   → Log out and log back in to see the 🛡️ Admin button.\n');
    } else {
      // Auto-promote the first user (lowest id)
      const first = users[0];
      await db.query('UPDATE users SET is_admin = 1 WHERE id = ?', [first.id]);
      console.log(`\n✅ Auto-promoted @${first.username} (${first.email}) to admin.`);
      console.log('   → Log in with this account to access the Admin Panel.');
      console.log('   → Or run:  node check_and_promote.js <your-email>  to promote a specific account.\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
