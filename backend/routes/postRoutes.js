// ============================================================
//  routes/postRoutes.js
// ============================================================
const express     = require('express');
const router      = express.Router();
const multer      = require('multer');
const path        = require('path');
const verifyToken = require('../middleware/auth');
const postCtrl    = require('../controllers/postController');

// ── Multer config for image uploads ───────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
            && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only images are allowed.'));
  }
});

// All post routes require login
router.use(verifyToken);

router.post(  '/',         upload.single('image'), postCtrl.createPost);
router.get(   '/feed',     postCtrl.getAllPosts);
router.get(   '/myfeed',   postCtrl.getPersonalizedFeed);
router.get(   '/:id',      postCtrl.getPostById);
router.delete('/:id',      postCtrl.deletePost);

module.exports = router;
