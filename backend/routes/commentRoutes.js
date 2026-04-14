// routes/commentRoutes.js
const express     = require('express');
const router      = express.Router();
const verifyToken = require('../middleware/auth');
const commentCtrl = require('../controllers/commentController');

router.use(verifyToken);
router.post(  '/:postId',      commentCtrl.addComment);
router.get(   '/:postId',      commentCtrl.getComments);
router.delete('/:commentId',   commentCtrl.deleteComment);

module.exports = router;
