const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireTokenOnly } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const ctrl = require('../controllers/userController');

const router = express.Router();

// Registration step 2: Uses requireTokenOnly so profile is created for verified Firebase account
router.post(
  '/register',
  requireTokenOnly,
  [body('fullName').trim().notEmpty().withMessage('Full name is required')],
  validateRequest,
  ctrl.registerProfile
);

router.post('/setup', requireAuth, ctrl.setupProfile);
router.get('/me', requireAuth, ctrl.getMe);
router.patch('/me', requireAuth, ctrl.updateMe);
router.get('/:id', requireAuth, ctrl.getPublicProfile);

// Direct Member Login endpoint (no external auth barrier)
router.post('/login', ctrl.loginUser);

// Demo testing endpoint
router.post('/demo-login', ctrl.demoLogin);

// FCM Web Push Token routes (authenticated)
router.post('/fcm-token', requireAuth, ctrl.saveFcmToken);
router.delete('/fcm-token', requireAuth, ctrl.removeFcmToken);

module.exports = router;
