import { Router } from 'express';
import { verifyCheckIn } from '../controllers/checkin';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Verify a ticket using its reference
router.post('/:reference', authenticateToken, verifyCheckIn);

export default router;
