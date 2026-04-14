// ============================================================
//  server.js  –  Entry point for the Social App backend
// ============================================================
require('dotenv').config();               // Load .env variables
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors());                          // Allow cross-origin requests
app.use(express.json());                  // Parse incoming JSON bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files at /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// NOTE: Frontend is now served by Vite dev server (port 5173).
// For production, build the Vite app and serve its dist/ folder here.

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/posts',         require('./routes/postRoutes'));
app.use('/api/likes',         require('./routes/likeRoutes'));
app.use('/api/comments',      require('./routes/commentRoutes'));
app.use('/api/follow',        require('./routes/followRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));

// ── Health check ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '✅ Social App API is running!' });
});

// ── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
