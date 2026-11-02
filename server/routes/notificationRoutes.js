const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationController');

const router = express.Router();
router.get('/', requireAuth, ctrl.myNotifications);
router.patch('/:id/read', requireAuth, ctrl.markAsRead);
router.patch('/read-all', requireAuth, ctrl.markAllAsRead);

module.exports = router;
