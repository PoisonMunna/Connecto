// ============================================================
//  middleware/adminAuth.js  –  Verify admin access
// ============================================================
const db = require('../config/db');

const requireAdmin = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT is_admin FROM users WHERE id = ?', [req.user.id]
    );
    if (!rows.length || !rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Could not verify admin.' });
  }
};

module.exports = requireAdmin;
