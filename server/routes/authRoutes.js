const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Khai báo các đường dẫn URL API cho điện thoại gọi tới
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
