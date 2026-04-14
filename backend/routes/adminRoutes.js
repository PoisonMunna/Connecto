// routes/adminRoutes.js
const express      = require('express');
const router       = express.Router();
const verifyToken  = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');
const adminCtrl    = require('../controllers/adminController');

router.use(verifyToken, requireAdmin);

router.get('/users',              adminCtrl.getUsers);
router.get('/users/:id/dashboard', adminCtrl.getUserDashboard);
router.post('/users/:id/promote', adminCtrl.promoteUser);
router.delete('/users/:id',       adminCtrl.deleteUser);
router.get('/analytics',          adminCtrl.getAnalytics);

module.exports = router;
