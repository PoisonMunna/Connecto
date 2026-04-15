// ============================================================
//  controllers/userController.js  –  User Profiles & Search
// ============================================================
const db   = require('../config/db');
const path = require('path');
const fs   = require('fs');

// ── GET /api/users/:username  –  Public profile ───────────
exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const viewerId     = req.user.id;

    const [users] = await db.query(
      `SELECT id, username, email, bio, profile_pic, cover_pic, is_verified, is_admin, created_at
       FROM users WHERE username = ?`,
      [username]
    );
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = users[0];

    const [[{ followers }]] = await db.query(
      'SELECT COUNT(*) AS followers FROM followers WHERE followed_id = ?', [user.id]
    );
    const [[{ following }]] = await db.query(
      'SELECT COUNT(*) AS following FROM followers WHERE follower_id = ?', [user.id]
    );
    const [[{ isFollowing }]] = await db.query(
      'SELECT COUNT(*) AS isFollowing FROM followers WHERE follower_id = ? AND followed_id = ?',
      [viewerId, user.id]
    );
    const [[{ followsMe }]] = await db.query(
      'SELECT COUNT(*) AS followsMe FROM followers WHERE follower_id = ? AND followed_id = ?',
      [user.id, viewerId]
    );

    const [posts] = await db.query(
      `SELECT p.id, p.content, p.image_url, p.created_at,
              (SELECT COUNT(*) FROM likes    WHERE post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked_by_me
       FROM posts p WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [viewerId, user.id]
    );

    res.json({
      ...user,
      followers_count: followers,
      following_count: following,
      is_following:    isFollowing > 0,
      follows_me:      followsMe   > 0,
      posts,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Could not load profile.' });
  }
};

// ── PUT /api/users/update  –  Update bio + images ────────
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, username } = req.body;

    const profilePicFile = req.files?.['profile_pic']?.[0];
    const coverPicFile   = req.files?.['cover_pic']?.[0];

    // ── Validate username if provided ──────────────────────
    if (username !== undefined) {
      const trimmed = username.trim();
      if (trimmed.length < 3)  return res.status(400).json({ error: 'Username must be at least 3 characters.' });
      if (trimmed.length > 50) return res.status(400).json({ error: 'Username must be under 50 characters.' });
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
      }

      // Check uniqueness (exclude current user)
      const [existing] = await db.query(
        'SELECT id FROM users WHERE username = ? AND id != ?', [trimmed, userId]
      );
      if (existing.length > 0) return res.status(409).json({ error: 'Username is already taken.' });
    }

    let query  = 'UPDATE users SET bio = ?';
    let params = [bio ?? ''];

    if (username !== undefined) { query += ', username = ?'; params.push(username.trim()); }
    if (profilePicFile)         { query += ', profile_pic = ?'; params.push(profilePicFile.path); }
    if (coverPicFile)           { query += ', cover_pic = ?';   params.push(coverPicFile.path);   }

    query += ' WHERE id = ?';
    params.push(userId);

    await db.query(query, params);

    const [[updated]] = await db.query(
      'SELECT id, username, email, bio, profile_pic, cover_pic, is_admin, is_verified FROM users WHERE id = ?',
      [userId]
    );
    res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Could not update profile.' });
  }
};

// ── DELETE /api/users/remove-profile-pic ─────────────────
exports.removeProfilePic = async (req, res) => {
  try {
    const userId = req.user.id;
    const [[row]] = await db.query('SELECT profile_pic FROM users WHERE id = ?', [userId]);

    // Delete physical file if not default
    if (row?.profile_pic && !row.profile_pic.includes('default.png')) {
      // With Cloudinary, we skip local fs deletion. You could optionally use cloudinary.uploader.destroy here.
    }

    await db.query('UPDATE users SET profile_pic = "default.png" WHERE id = ?', [userId]);
    res.json({ message: 'Profile picture removed.' });
  } catch (err) {
    console.error('Remove profile pic error:', err);
    res.status(500).json({ error: 'Could not remove profile picture.' });
  }
};

// ── DELETE /api/users/remove-cover-pic ───────────────────
exports.removeCoverPic = async (req, res) => {
  try {
    const userId = req.user.id;
    const [[row]] = await db.query('SELECT cover_pic FROM users WHERE id = ?', [userId]);

    if (row?.cover_pic) {
      // Skip local fs deletion for Cloudinary.
    }

    await db.query('UPDATE users SET cover_pic = NULL WHERE id = ?', [userId]);
    res.json({ message: 'Cover picture removed.' });
  } catch (err) {
    console.error('Remove cover pic error:', err);
    res.status(500).json({ error: 'Could not remove cover picture.' });
  }
};

// ── GET /api/users/search?q=<term> ────────────────────────
exports.searchUsers = async (req, res) => {
  try {
    const q = req.query.q || '';
    const [users] = await db.query(
      `SELECT id, username, bio, profile_pic
       FROM users WHERE username LIKE ? LIMIT 20`,
      [`%${q}%`]
    );
    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed.' });
  }
};
