// ============================================================
//  controllers/postController.js  –  Post CRUD + Feed
// ============================================================
const db = require('../config/db');

// ── POST /api/posts  –  Create a new post ─────────────────
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    // If an image was uploaded via multer-storage-cloudinary, req.file.path holds the Cloudinary URL
    const imageUrl = req.file ? req.file.path : null;

    const [result] = await db.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [userId, content.trim(), imageUrl]
    );

    res.status(201).json({
      message: 'Post created!',
      postId: result.insertId
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Could not create post.' });
  }
};

// ── GET /api/posts/feed  –  All posts (public feed) ───────
exports.getAllPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all posts with author info + like count + comment count
    // Also checks if the current user has liked each post
    const [posts] = await db.query(
      `SELECT
         p.id,
         p.content,
         p.image_url,
         p.created_at,
         u.id          AS user_id,
         u.username,
         u.profile_pic,
         u.is_verified,
         (SELECT COUNT(*) FROM likes   WHERE post_id = p.id)  AS like_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(posts);
  } catch (err) {
    console.error('Get feed error:', err);
    res.status(500).json({ error: 'Could not load feed.' });
  }
};

// ── GET /api/posts/myfeed  –  Posts from followed users ───
exports.getPersonalizedFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    const [posts] = await db.query(
      `SELECT
         p.id,
         p.content,
         p.image_url,
         p.created_at,
         u.id          AS user_id,
         u.username,
         u.profile_pic,
         u.is_verified,
         (SELECT COUNT(*) FROM likes    WHERE post_id = p.id) AS like_count,
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id IN (
         SELECT followed_id FROM followers WHERE follower_id = ?
       )
       OR p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId, userId, userId]
    );

    res.json(posts);
  } catch (err) {
    console.error('Personalized feed error:', err);
    res.status(500).json({ error: 'Could not load feed.' });
  }
};

// ── GET /api/posts/:id  –  Single post detail ─────────────
exports.getPostById = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const [rows] = await db.query(
      `SELECT
         p.*,
         u.username,
         u.profile_pic,
         (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
         (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [userId, postId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Post not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not load post.' });
  }
};

// ── DELETE /api/posts/:id  –  Delete own post ─────────────
exports.deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    // Make sure user owns this post
    const [rows] = await db.query(
      'SELECT user_id FROM posts WHERE id = ?',
      [postId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found.' });
    if (rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    await db.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Could not delete post.' });
  }
};
