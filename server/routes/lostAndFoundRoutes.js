import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getItems, createItem } from '../controllers/lostAndFoundController.js';

const router = Router();

router.get('/items', getItems);
router.post('/items', authenticateToken, createItem);

export default router;