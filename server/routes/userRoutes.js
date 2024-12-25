import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getUserInfo } from '../controllers/userController.js';

const router = Router();
router.get('/', authenticateToken, getUserInfo);

export default router;
