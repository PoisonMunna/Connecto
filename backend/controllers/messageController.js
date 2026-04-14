// ============================================================
//  controllers/messageController.js  –  Direct Messaging
// ============================================================
const db = require('../config/db');

// Helper: check if two users are mutual followers (or one follows the other)
async function canMessage(userA, userB) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM followers
     WHERE (follower_id = ? AND followed_id = ?)
        OR (follower_id = ? AND followed_id = ?)`,
    [userA, userB, userB, userA]
  );
  return rows[0].cnt > 0; // at least one follows the other
}

// ── GET /api/messages/conversations ──────────────────────────
// Returns all users the current user has exchanged messages with,
// along with the last message and unread count.
exports.getConversations = async (req, res) => {
  const me = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT
         u.id, u.username, u.profile_pic, u.bio,
         m.content   AS last_message,
         m.created_at AS last_at,
         m.sender_id  AS last_sender_id,
         (
           SELECT COUNT(*) FROM messages
           WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0
         ) AS unread
       FROM users u
       JOIN (
         SELECT
           CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id,
           MAX(id) AS max_id
         FROM messages
         WHERE sender_id = ? OR receiver_id = ?
         GROUP BY partner_id
       ) AS last ON last.partner_id = u.id
       JOIN messages m ON m.id = last.max_id
       ORDER BY m.created_at DESC`,
      [me, me, me, me]
    );
    res.json(rows);
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ error: 'Could not load conversations.' });
  }
};

// ── GET /api/messages/unread/count ───────────────────────────
exports.getUnreadCount = async (req, res) => {
  const me = req.user.id;
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = 0',
      [me]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: 'Could not get count.' });
  }
};

// ── GET /api/messages/:userId ─────────────────────────────────
// Get full thread between current user and target user
exports.getThread = async (req, res) => {
  const me     = req.user.id;
  const other  = parseInt(req.params.userId);
  try {
    const [rows] = await db.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
              u.username AS sender_username, u.profile_pic AS sender_pic
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [me, other, other, me]
    );
    res.json(rows);
  } catch (err) {
    console.error('getThread error:', err);
    res.status(500).json({ error: 'Could not load messages.' });
  }
};

// ── POST /api/messages/:userId ────────────────────────────────
// Send a message (must follow each other, or sender already follows receiver)
exports.sendMessage = async (req, res) => {
  const me      = req.user.id;
  const other   = parseInt(req.params.userId);
  const content = (req.body.content || '').trim();

  if (!content) return res.status(400).json({ error: 'Message cannot be empty.' });
  if (me === other) return res.status(400).json({ error: 'Cannot message yourself.' });

  try {
    // Only allow messaging if at least one party follows the other
    const allowed = await canMessage(me, other);
    if (!allowed) {
      return res.status(403).json({ error: 'You must follow each other to send messages.' });
    }

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [me, other, content]
    );

    // Return the inserted message with sender info
    const [rows] = await db.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
              u.username AS sender_username, u.profile_pic AS sender_pic
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Could not send message.' });
  }
};

// ── PUT /api/messages/:userId/read ───────────────────────────
// Mark all messages from :userId to current user as read
exports.markRead = async (req, res) => {
  const me    = req.user.id;
  const other = parseInt(req.params.userId);
  try {
    await db.query(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?',
      [other, me]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not mark as read.' });
  }
};

// ── DELETE /api/messages/msg/:messageId ──────────────────────
// Only the sender can delete their own message
exports.deleteMessage = async (req, res) => {
  const me        = req.user.id;
  const messageId = parseInt(req.params.messageId);
  try {
    const [rows] = await db.query('SELECT sender_id FROM messages WHERE id = ?', [messageId]);
    if (!rows.length) return res.status(404).json({ error: 'Message not found.' });
    if (rows[0].sender_id !== me) {
      return res.status(403).json({ error: 'You can only delete your own messages.' });
    }
    await db.query('DELETE FROM messages WHERE id = ?', [messageId]);
    res.json({ ok: true, id: messageId });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ error: 'Could not delete message.' });
  }
};

