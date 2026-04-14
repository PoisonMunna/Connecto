// ============================================================
//  controllers/likeController.js  –  Like / Unlike a post
// ============================================================
const db = require('../config/db');

// ── POST /api/likes/:postId  –  Toggle like ───────────────
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    // Check if post exists
    const [post] = await db.query('SELECT id, user_id FROM posts WHERE id = ?', [postId]);
    if (post.length === 0) return res.status(404).json({ error: 'Post not found.' });

    // Check if already liked
    const [existing] = await db.query(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existing.length > 0) {
      // ── Unlike ─────────────────────────────────────────
      await db.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);

      const [[{ count }]] = await db.query(
        'SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [postId]
      );
      return res.json({ message: 'Post unliked.', liked: false, like_count: count });
    } else {
      // ── Like ───────────────────────────────────────────
      await db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);

      // Create notification for post owner (skip if user likes own post)
      if (post[0].user_id !== userId) {
        await db.query(
          'INSERT INTO notifications (user_id, from_user, type, post_id) VALUES (?, ?, "like", ?)',
          [post[0].user_id, userId, postId]
        );
      }

      const [[{ count }]] = await db.query(
        'SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [postId]
      );
      return res.json({ message: 'Post liked!', liked: true, like_count: count });
    }
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Could not process like.' });
  }
};
