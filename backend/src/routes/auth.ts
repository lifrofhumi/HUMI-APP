import { Router } from 'express';
import { register, login, updateProfile, googleAuth, completeProfile, updatePassword } from '../controllers/auth';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, updatePassword);

// Google Auth
router.post('/google', googleAuth);
router.post('/complete-profile', authenticateToken, completeProfile);

export default router;
