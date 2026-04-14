// ============================================================
//  controllers/adminController.js  –  Admin Panel API
// ============================================================
const db = require('../config/db');

// ── GET /api/admin/users ─────────────────────────────────────
// All users with stats
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id, u.username, u.email, u.bio, u.profile_pic,
        u.is_admin, u.is_verified, u.created_at,
        (SELECT COUNT(*) FROM posts    WHERE user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM likes    WHERE user_id = u.id) AS like_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id) AS comment_count,
        (SELECT COUNT(*) FROM followers WHERE followed_id = u.id) AS followers_count
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: 'Could not load users.' });
  }
};

// ── POST /api/admin/users/:id/promote ────────────────────────
// Toggle blue-tick (is_verified)
exports.promoteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT is_verified FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    const newVal = rows[0].is_verified ? 0 : 1;
    await db.query('UPDATE users SET is_verified = ? WHERE id = ?', [newVal, id]);
    res.json({ verified: !!newVal, message: newVal ? '✅ User verified (blue tick granted).' : 'Blue tick removed.' });
  } catch (err) {
    console.error('promoteUser error:', err);
    res.status(500).json({ error: 'Could not promote user.' });
  }
};

// ── DELETE /api/admin/users/:id ──────────────────────────────
// Permanently delete a user (cascades to posts, likes, etc.)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    if (rows[0].is_admin) return res.status(403).json({ error: 'Cannot delete an admin account.' });

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User permanently deleted.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 'Could not delete user.' });
  }
};

// ── GET /api/admin/users/:id/dashboard ───────────────────────
// Individual user dashboard stats for admin view
exports.getUserDashboard = async (req, res) => {
  const { id } = req.params;
  try {
    // Basic user info
    const [[user]] = await db.query(
      'SELECT id, username, email, bio, profile_pic, is_admin, is_verified, created_at FROM users WHERE id = ?',
      [id]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Aggregate counts
    const [[counts]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM posts     WHERE user_id = ?)   AS total_posts,
        (SELECT COUNT(*) FROM likes     WHERE user_id = ?)   AS total_likes_given,
        (SELECT COUNT(*) FROM likes     JOIN posts p ON likes.post_id = p.id WHERE p.user_id = ?) AS total_likes_received,
        (SELECT COUNT(*) FROM comments  WHERE user_id = ?)   AS total_comments,
        (SELECT COUNT(*) FROM followers WHERE followed_id = ?) AS followers,
        (SELECT COUNT(*) FROM followers WHERE follower_id = ?) AS following,
        (SELECT COUNT(*) FROM messages  WHERE sender_id = ?)  AS messages_sent
    `, [id, id, id, id, id, id, id]);

    // Posts over last 30 days (by day)
    const [postTrend] = await db.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM posts
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY date ORDER BY date ASC
    `, [id]);

    // Likes received over last 30 days
    const [likeTrend] = await db.query(`
      SELECT DATE(l.created_at) AS date, COUNT(*) AS count
      FROM likes l
      JOIN posts p ON l.post_id = p.id
      WHERE p.user_id = ? AND l.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY date ORDER BY date ASC
    `, [id]);

    // Last 5 posts
    const [recentPosts] = await db.query(`
      SELECT p.id, p.content, p.created_at,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
      FROM posts p WHERE p.user_id = ?
      ORDER BY p.created_at DESC LIMIT 5
    `, [id]);

    const fmt = (rows) => rows.map((r) => ({ date: String(r.date).slice(0, 10), count: Number(r.count) }));

    res.json({ user, counts, postTrend: fmt(postTrend), likeTrend: fmt(likeTrend), recentPosts });
  } catch (err) {
    console.error('getUserDashboard error:', err);
    res.status(500).json({ error: 'Could not load user dashboard.' });
  }
};


// ── GET /api/admin/analytics?period=week ─────────────────────
exports.getAnalytics = async (req, res) => {
  const period = req.query.period || 'week';

  // Interval SQL for grouping
  const intervalMap = {
    day:   'DATE(created_at)',
    week:  'DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY))',
    month: 'DATE_FORMAT(created_at, "%Y-%m-01")',
    year:  'YEAR(created_at)',
  };
  // How far back to look
  const rangeMap = {
    day:   'INTERVAL 30 DAY',
    week:  'INTERVAL 12 WEEK',
    month: 'INTERVAL 12 MONTH',
    year:  'INTERVAL 5 YEAR',
  };

  const grp   = intervalMap[period]  || intervalMap.week;
  const range = rangeMap[period]     || rangeMap.week;

  try {
    // ── Summary counts ────────────────────────────────────────
    const [[summary]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users)    AS total_users,
        (SELECT COUNT(*) FROM posts)    AS total_posts,
        (SELECT COUNT(*) FROM likes)    AS total_likes,
        (SELECT COUNT(*) FROM comments) AS total_comments,
        (SELECT COUNT(*) FROM followers) AS total_follows
    `);

    // ── New users over time ────────────────────────────────────
    const [userGrowth] = await db.query(`
      SELECT ${grp} AS date, COUNT(*) AS count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), ${range})
      GROUP BY date ORDER BY date ASC
    `);

    // ── Posts over time ───────────────────────────────────────
    const [postTrend] = await db.query(`
      SELECT ${grp} AS date, COUNT(*) AS count
      FROM posts
      WHERE created_at >= DATE_SUB(NOW(), ${range})
      GROUP BY date ORDER BY date ASC
    `);

    // ── Likes over time ───────────────────────────────────────
    const [likeTrend] = await db.query(`
      SELECT ${grp} AS date, COUNT(*) AS count
      FROM likes
      WHERE created_at >= DATE_SUB(NOW(), ${range})
      GROUP BY date ORDER BY date ASC
    `);

    // ── Comments over time ────────────────────────────────────
    const [commentTrend] = await db.query(`
      SELECT ${grp} AS date, COUNT(*) AS count
      FROM comments
      WHERE created_at >= DATE_SUB(NOW(), ${range})
      GROUP BY date ORDER BY date ASC
    `);

    // ── Most active users (by combined activity) ──────────────
    const [topUsers] = await db.query(`
      SELECT
        u.id, u.username, u.profile_pic, u.is_verified,
        (SELECT COUNT(*) FROM posts    WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), ${range})) AS posts,
        (SELECT COUNT(*) FROM likes    WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), ${range})) AS likes,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), ${range})) AS comments
      FROM users u
      HAVING (posts + likes + comments) > 0
      ORDER BY (posts + likes + comments) DESC
      LIMIT 10
    `);

    // ── Format dates nicely ───────────────────────────────────
    const fmt = (rows) => rows.map((r) => ({
      date:  String(r.date).slice(0, 10),
      count: Number(r.count),
    }));

    res.json({
      summary,
      userGrowth:   fmt(userGrowth),
      postTrend:    fmt(postTrend),
      likeTrend:    fmt(likeTrend),
      commentTrend: fmt(commentTrend),
      topUsers,
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: 'Could not load analytics.' });
  }
};
