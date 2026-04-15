// ============================================================
//  controllers/commentController.js  –  Comments on posts
// ============================================================
const db = require('../config/db');

// ── POST /api/comments/:postId  –  Add comment ────────────
exports.addComment = async (req, res) => {
  try {
    const userId  = req.user.id;
    const postId  = req.params.postId;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    // Check post exists
    const [post] = await db.query('SELECT id, user_id FROM posts WHERE id = ?', [postId]);
    if (post.length === 0) return res.status(404).json({ error: 'Post not found.' });

    const [result] = await db.query(
      'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
      [userId, postId, content.trim()]
    );

    // Notify post owner
    if (post[0].user_id !== userId) {
      await db.query(
        'INSERT INTO notifications (user_id, from_user, type, post_id) VALUES (?, ?, ?, ?)',
        [post[0].user_id, userId, 'comment', postId]
      );
    }

    // Return the new comment with username
    const [newComment] = await db.query(
      `SELECT c.id, c.content, c.created_at, u.username, u.profile_pic
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Comment added!', comment: newComment[0] });
  } catch (err) {
    console.error('Add comment error:', err.message);
    res.status(500).json({ error: 'Could not add comment.' });
  }
};

// ── GET /api/comments/:postId  –  Get all comments ────────
exports.getComments = async (req, res) => {
  try {
    const postId = req.params.postId;

    const [comments] = await db.query(
      `SELECT c.id, c.content, c.created_at, c.user_id,
              u.username, u.profile_pic
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Could not load comments.' });
  }
};

// ── DELETE /api/comments/:commentId  –  Delete own comment ─
exports.deleteComment = async (req, res) => {
  try {
    const userId    = req.user.id;
    const commentId = req.params.commentId;

    const [rows] = await db.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Comment not found.' });
    if (rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments.' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete comment.' });
  }
};
