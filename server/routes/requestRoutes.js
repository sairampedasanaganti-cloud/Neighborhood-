const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const ctrl = require('../controllers/requestController');
const reviewCtrl = require('../controllers/reviewController');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  validateRequest,
  ctrl.createRequest
);

router.get('/', requireAuth, ctrl.browseRequests);
router.get('/emergency/active', requireAuth, ctrl.getActiveEmergencies);
router.get('/activities/mine', requireAuth, ctrl.myActivities);

// Legacy route aliases
router.get('/mine', requireAuth, async (req, res, next) => {
  req.url = '/activities/mine';
  next();
}, ctrl.myActivities);
router.get('/recommended', requireAuth, ctrl.browseRequests);
router.get('/accepted', requireAuth, ctrl.myActivities);

router.get('/:id', requireAuth, ctrl.getRequestById);
router.get('/:id/location', requireAuth, ctrl.getRequestLocation);
router.post('/:id/accept', requireAuth, ctrl.acceptRequest);
router.patch('/:id/status', requireAuth, [body('status').notEmpty()], validateRequest, ctrl.updateStatus);
router.post('/:id/cancel', requireAuth, ctrl.cancelRequest);

router.post(
  '/:id/reviews',
  requireAuth,
  [body('rating').isInt({ min: 1, max: 5 })],
  validateRequest,
  reviewCtrl.createReview
);

module.exports = router;
