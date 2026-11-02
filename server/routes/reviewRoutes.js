const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/reviewController');

const router = express.Router();
router.get('/user/:userId', requireAuth, ctrl.getReviewsForUser);

module.exports = router;
