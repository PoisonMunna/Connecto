// ============================================================
//  controllers/notificationController.js
// ============================================================
const db = require('../config/db');

// ── GET /api/notifications  –  My notifications ───────────
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT n.id, n.type, n.is_read, n.created_at, n.post_id,
              u.username AS from_username, u.profile_pic AS from_pic
       FROM notifications n
       JOIN users u ON n.from_user = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not load notifications.' });
  }
};

// ── PUT /api/notifications/read  –  Mark all as read ──────
exports.markAllRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update notifications.' });
  }
};

// ── GET /api/notifications/count  –  Unread count ─────────
exports.getUnreadCount = async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch count.' });
  }
};
