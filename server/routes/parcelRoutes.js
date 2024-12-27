import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getUserCredits,
  getOpenDeliveries,
  requestDelivery,
  cancelDelivery,
  acceptDelivery,
  completeDelivery,
  getUserDeliveries,
  getChatRoom,
  getChatMessages,
} from '../controllers/parcelController.js';

const router = Router();

router.get('/credits', authenticateToken, getUserCredits);
router.get('/deliveries', authenticateToken, getOpenDeliveries);
router.post('/deliveries', authenticateToken, requestDelivery);
router.post('/deliveries/cancel', authenticateToken, cancelDelivery);
router.post('/deliveries/:id/accept', authenticateToken, acceptDelivery);

// New endpoints
router.get('/deliveries/user', authenticateToken, getUserDeliveries);
router.get('/deliveries/:id/chat', authenticateToken, getChatRoom);
router.post('/deliveries/:id/complete', authenticateToken, completeDelivery);

// Add new endpoint for chat history
router.get('/deliveries/chat/:chatRoomId/messages', authenticateToken, getChatMessages);

export default router;
