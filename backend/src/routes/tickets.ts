import { Router } from 'express';
import { purchaseTicket, getUserTickets, getEventTickets, verifyTicket, checkInTicket, deleteTicket } from '../controllers/tickets';
import { authenticateToken, requireOrganizerOrAdmin } from '../middlewares/auth';

const router = Router();

// Student routes
router.post('/purchase', authenticateToken, purchaseTicket);
router.post('/verify', authenticateToken, verifyTicket);
router.get('/my-tickets', authenticateToken, getUserTickets);
router.delete('/:id', authenticateToken, deleteTicket);

// Organizer routes
router.get('/event/:eventId', authenticateToken, requireOrganizerOrAdmin, getEventTickets);
router.post('/:id/check-in', authenticateToken, requireOrganizerOrAdmin, checkInTicket);

export default router;
