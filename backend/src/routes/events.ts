import { Router } from 'express';
import { 
  getEvents, getEventById, createEvent, updateEvent, deleteEvent, 
  addEventImages, deleteEventImage, reorderEventImages, setEventCoverImage,
  getAdminPendingEvents, approveEvent, rejectEvent
} from '../controllers/events';
import { authenticateToken, requireOrganizerOrAdmin, requireAdmin } from '../middlewares/auth';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes (Organizers and Admins)
router.post('/', authenticateToken, requireOrganizerOrAdmin, upload.array('images', 10), createEvent);
router.put('/:id', authenticateToken, requireOrganizerOrAdmin, updateEvent);
router.delete('/:id', authenticateToken, requireOrganizerOrAdmin, deleteEvent);

// Admin Approval Routes
router.get('/admin/pending', authenticateToken, requireAdmin, getAdminPendingEvents);
router.put('/:id/approve', authenticateToken, requireAdmin, approveEvent);
router.put('/:id/reject', authenticateToken, requireAdmin, rejectEvent);

// Image management routes
router.post('/:id/images', authenticateToken, requireOrganizerOrAdmin, upload.array('images', 10), addEventImages);
router.delete('/:id/images/:imageId', authenticateToken, requireOrganizerOrAdmin, deleteEventImage);
router.put('/:id/images/reorder', authenticateToken, requireOrganizerOrAdmin, reorderEventImages);
router.put('/:id/images/:imageId/cover', authenticateToken, requireOrganizerOrAdmin, setEventCoverImage);

export default router;
