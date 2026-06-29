import { Router } from 'express';
import { getOrganizerStats, getEventStats } from '../controllers/dashboard';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticateToken, getOrganizerStats);
router.get('/event/:id/stats', authenticateToken, getEventStats);

export default router;
