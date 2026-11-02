const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/reportController');

const router = express.Router();

router.post('/', requireAuth, ctrl.createReport);
router.get('/', requireAuth, requireRole('admin'), ctrl.getReports);
router.patch('/:id', requireAuth, requireRole('admin'), ctrl.updateReport);

module.exports = router;
