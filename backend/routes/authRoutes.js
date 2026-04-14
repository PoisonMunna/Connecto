// ============================================================
//  routes/authRoutes.js
// ============================================================
const express    = require('express');
const router     = express.Router();
const auth       = require('../controllers/authController');
const verifyToken = require('../middleware/auth');

router.post('/signup', auth.signup);
router.post('/login',  auth.login);
router.post('/google', auth.googleAuth);       // Firebase Google Sign-In
router.get('/me',      verifyToken, auth.getMe);

module.exports = router;
