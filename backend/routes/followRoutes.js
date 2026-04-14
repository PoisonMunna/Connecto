// routes/followRoutes.js
const express     = require('express');
const router      = express.Router();
const verifyToken = require('../middleware/auth');
const followCtrl  = require('../controllers/followController');

router.use(verifyToken);
router.post('/:userId',             followCtrl.toggleFollow);
router.get( '/:userId/followers',   followCtrl.getFollowers);
router.get( '/:userId/following',   followCtrl.getFollowing);

module.exports = router;
