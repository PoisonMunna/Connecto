// routes/userRoutes.js
const express     = require('express');
const router      = express.Router();
const multer      = require('multer');
const path        = require('path');
const verifyToken = require('../middleware/auth');
const userCtrl    = require('../controllers/userController');

// Store uploads with unique filenames keyed by user id + field name
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => {
    const prefix = file.fieldname === 'cover_pic' ? 'cover' : 'pfp';
    cb(null, `${prefix}-${req.user.id}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  },
});

router.use(verifyToken);
router.get('/search',    userCtrl.searchUsers);
router.get('/:username', userCtrl.getProfile);

// Update profile: bio + optional profile_pic + optional cover_pic
router.put('/update',
  upload.fields([
    { name: 'profile_pic', maxCount: 1 },
    { name: 'cover_pic',   maxCount: 1 },
  ]),
  userCtrl.updateProfile
);

// Remove just the profile picture (set to null)
router.delete('/remove-profile-pic', userCtrl.removeProfilePic);

// Remove just the cover picture (set to null)
router.delete('/remove-cover-pic',   userCtrl.removeCoverPic);

module.exports = router;
