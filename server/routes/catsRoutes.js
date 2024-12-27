// routes/catsRoutes.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getCatSightings, createCatSighting } from '../controllers/catsController.js';

const router = Router();

/**
 * GET -> fetch all sightings
 * POST -> create a new sighting
 * Protect both with authenticateToken so only logged-in users can read/post.
 */
router.get('/', authenticateToken, getCatSightings);
router.post('/', authenticateToken, createCatSighting);

export default router;
