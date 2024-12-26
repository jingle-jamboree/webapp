import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getUserCredits,
  getOpenDeliveries,
  requestDelivery,
  cancelDelivery,
  acceptDelivery
} from '../controllers/parcelController.js';

const router = Router();

router.get('/credits', authenticateToken, getUserCredits);
router.get('/deliveries', authenticateToken, getOpenDeliveries);
router.post('/deliveries', authenticateToken, requestDelivery);
router.post('/deliveries/cancel', authenticateToken, cancelDelivery);
router.post('/deliveries/:id/accept', authenticateToken, acceptDelivery);

export default router;
