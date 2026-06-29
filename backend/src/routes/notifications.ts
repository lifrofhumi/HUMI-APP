import { Router } from 'express';
import { createAnnouncement, getMyNotifications, markNotificationsAsRead, deleteNotification } from '../controllers/notifications';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Used by organizers to broadcast
router.post('/announcements', authenticateToken, createAnnouncement);

// Used by any authenticated user
router.get('/', authenticateToken, getMyNotifications);
router.patch('/read', authenticateToken, markNotificationsAsRead);
router.delete('/:id', authenticateToken, deleteNotification);

export default router;
