const express = require('express');
const { login, refreshToken } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken)

module.exports = router;
