// routes/notificationRoutes.js
const express        = require('express');
const router         = express.Router();
const verifyToken    = require('../middleware/auth');
const notifCtrl      = require('../controllers/notificationController');

router.use(verifyToken);
router.get( '/',        notifCtrl.getNotifications);
router.get( '/count',   notifCtrl.getUnreadCount);
router.put( '/read',    notifCtrl.markAllRead);

module.exports = router;
