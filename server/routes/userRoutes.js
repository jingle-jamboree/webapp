const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getUserInfo } = require('../controllers/userController');
const router = express.Router();

router.get('/', authenticateToken, getUserInfo);

module.exports = router;
