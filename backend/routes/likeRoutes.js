// routes/likeRoutes.js
const express     = require('express');
const router      = express.Router();
const verifyToken = require('../middleware/auth');
const likeCtrl    = require('../controllers/likeController');

router.use(verifyToken);
router.post('/:postId', likeCtrl.toggleLike);

module.exports = router;
