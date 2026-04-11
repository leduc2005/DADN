const express = require('express');
const router = express.Router();
const motorController = require('../controllers/motorController');


router.post('/search', motorController.searchMotorData);

module.exports = router;