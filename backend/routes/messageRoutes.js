// routes/messageRoutes.js
const express     = require('express');
const router      = express.Router();
const verifyToken = require('../middleware/auth');
const msgCtrl     = require('../controllers/messageController');

router.use(verifyToken);

router.get('/conversations',      msgCtrl.getConversations);
router.get('/unread/count',       msgCtrl.getUnreadCount);
router.get('/:userId',            msgCtrl.getThread);
router.post('/:userId',           msgCtrl.sendMessage);
router.put('/:userId/read',       msgCtrl.markRead);
router.delete('/msg/:messageId',  msgCtrl.deleteMessage);

module.exports = router;
