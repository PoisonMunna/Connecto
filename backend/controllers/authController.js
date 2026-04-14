// ============================================================
//  controllers/authController.js  –  Signup / Login / Me
// ============================================================
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const https  = require('https');
const db     = require('../config/db');

// ── Helper: create a signed JWT ──────────────────────────
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email, is_admin: !!user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }   // token valid for 7 days
  );

// ── POST /api/auth/signup ─────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { username, email, password, bio } = req.body;

    // --- Basic validation ---
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // --- Check duplicates ---
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use.' });
    }

    // --- Hash password (salt rounds = 10) ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Insert new user ---
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, bio || '']
    );

    const user = { id: result.insertId, username, email };
    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // --- Find user ---
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];

    // --- Compare password with bcrypt hash ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id:          user.id,
        username:    user.username,
        email:       user.email,
        bio:         user.bio,
        profile_pic: user.profile_pic,
        is_admin:    !!user.is_admin,
        is_verified: !!user.is_verified
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ── GET /api/auth/me  (requires token) ───────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, bio, profile_pic, is_admin, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user.' });
  }
};

// ── Helper: verify Firebase ID token using Firebase Identity Toolkit REST API ──
// Docs: https://firebase.google.com/docs/reference/rest/auth#section-get-account-info
function verifyFirebaseToken(idToken) {
  return new Promise((resolve, reject) => {
    const apiKey   = process.env.FIREBASE_API_KEY;
    if (!apiKey) return reject(new Error('FIREBASE_API_KEY not set in .env'));

    const postData = JSON.stringify({ idToken });
    const options  = {
      hostname: 'identitytoolkit.googleapis.com',
      path:     `/v1/accounts:lookup?key=${apiKey}`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || 'Token verification failed'));
          const firebaseUser = parsed.users?.[0];
          if (!firebaseUser) return reject(new Error('No user returned from Firebase'));
          resolve(firebaseUser); // { localId, email, displayName, photoUrl, ... }
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ── POST /api/auth/google  –  Firebase Google Sign-In ─────
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'ID token is required.' });

    // Verify token with Google
    let payload;
    try {
      payload = await verifyFirebaseToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid Google token. Please try again.' });
    }

    const { email, displayName, photoUrl, localId: googleId } = payload;
    if (!email) return res.status(400).json({ error: 'No email found in Google account.' });

    // Check if user already exists
    let [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (rows.length > 0) {
      // Existing user — update profile_pic if they have a Google photo and no custom pic
      user = rows[0];
      if (photoUrl && (!user.profile_pic || user.profile_pic === 'default.png')) {
        await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [photoUrl, user.id]);
        user.profile_pic = photoUrl;
      }
    } else {
      // New user — create account from Google data
      // Generate a clean username from display name (fallback to email prefix)
      let baseUsername = (displayName || email.split('@')[0])
        .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 40);
      if (!baseUsername) baseUsername = 'user';

      // Ensure username is unique
      let username = baseUsername;
      let suffix   = 1;
      while (true) {
        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length === 0) break;
        username = `${baseUsername}_${suffix++}`;
      }

      // Random strong password — account uses Google auth, password not needed for login
      const randomPwd = await bcrypt.hash(Math.random().toString(36) + googleId, 10);

      const [result] = await db.query(
        'INSERT INTO users (username, email, password, bio, profile_pic) VALUES (?, ?, ?, ?, ?)',
        [username, email, randomPwd, 'Google account', photoUrl || 'default.png']
      );

      const [newRows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newRows[0];
    }

    // Generate app JWT
    const token = generateToken(user);
    res.json({
      message: 'Google sign-in successful!',
      token,
      user: {
        id:          user.id,
        username:    user.username,
        email:       user.email,
        bio:         user.bio,
        profile_pic: user.profile_pic,
        is_admin:    !!user.is_admin,
        is_verified: !!user.is_verified,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google sign-in failed. Please try again.' });
  }
};

