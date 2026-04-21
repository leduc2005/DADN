const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-code', authController.verifyCode);       // ✅ Mới: Xác minh OTP với DB
router.post('/reset-password', authController.resetPassword);

module.exports = router;
