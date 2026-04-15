// ============================================================
//  routes/postRoutes.js
// ============================================================
const express     = require('express');
const router      = express.Router();
const multer      = require('multer');
const path        = require('path');
const verifyToken = require('../middleware/auth');
const postCtrl    = require('../controllers/postController');

const { CloudinaryStorage, cloudinary } = require('../config/cloudinary');

// ── Multer config for image uploads ───────────────────────
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'SocialApp/Posts',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    public_id: (req, file) => {
      return Date.now() + '-' + Math.round(Math.random() * 1e9);
    }
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
