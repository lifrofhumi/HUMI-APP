import { Router } from 'express';
import { getAdminStats, suspendUser, deleteEventByAdmin } from '../controllers/admin';
import { authenticateToken } from '../middlewares/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Middleware to enforce ADMIN role
const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

router.use(authenticateToken, requireAdmin);

router.get('/stats', getAdminStats);
router.patch('/users/:id/suspend', suspendUser);
router.delete('/events/:id', deleteEventByAdmin);

export default router;
