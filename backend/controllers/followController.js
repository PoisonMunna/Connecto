// ============================================================
//  controllers/followController.js  –  Follow / Unfollow
// ============================================================
const db = require('../config/db');

// ── POST /api/follow/:userId  –  Toggle follow ────────────
exports.toggleFollow = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followedId = parseInt(req.params.userId);

    if (followerId === followedId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    // Check target user exists
    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [followedId]);
    if (user.length === 0) return res.status(404).json({ error: 'User not found.' });

    // Check if already following
    const [existing] = await db.query(
      'SELECT id FROM followers WHERE follower_id = ? AND followed_id = ?',
      [followerId, followedId]
    );

    if (existing.length > 0) {
      // ── Unfollow ────────────────────────────────────────
      await db.query(
        'DELETE FROM followers WHERE follower_id = ? AND followed_id = ?',
        [followerId, followedId]
      );
      return res.json({ message: 'Unfollowed.', following: false });
    } else {
      // ── Follow ──────────────────────────────────────────
      await db.query(
        'INSERT INTO followers (follower_id, followed_id) VALUES (?, ?)',
        [followerId, followedId]
      );

      // Notify the followed user
      await db.query(
        'INSERT INTO notifications (user_id, from_user, type) VALUES (?, ?, "follow")',
        [followedId, followerId]
      );

      return res.json({ message: 'Following!', following: true });
    }
  } catch (err) {
    console.error('Follow toggle error:', err);
    res.status(500).json({ error: 'Could not process follow.' });
  }
};

// ── GET /api/follow/:userId/followers  –  List followers ──
exports.getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.profile_pic
       FROM followers f
       JOIN users u ON f.follower_id = u.id
       WHERE f.followed_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not load followers.' });
  }
};

// ── GET /api/follow/:userId/following  –  List following ──
exports.getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.profile_pic
       FROM followers f
       JOIN users u ON f.followed_id = u.id
       WHERE f.follower_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not load following list.' });
  }
};
