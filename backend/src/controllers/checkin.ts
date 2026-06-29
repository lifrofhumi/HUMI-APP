import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const verifyCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { reference } = req.params; // This is the payment_reference which acts as the unique QR code payload

    if (!reference) {
      res.status(400).json({ error: 'Ticket reference is required' });
      return;
    }

    // Find the ticket by reference
    const ticket = await prisma.ticket.findFirst({
      where: { payment_reference: reference },
      include: {
        event: {
          select: { organizer_id: true, title: true, date: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    // Only the event organizer or an Admin can verify the ticket
    if (ticket.event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'You are not authorized to scan tickets for this event' });
      return;
    }

    // Check if the event is cancelled
    // (Assuming we added is_cancelled to Event. Let's make sure typescript knows about it, though prisma client is generated)
    // Actually, typescript types might need an editor refresh, but it should work.

    // Check if ticket is already used
    if (ticket.is_used) {
      res.status(400).json({ 
        error: 'Ticket has already been used',
        check_in_time: ticket.check_in_time,
        attendee: ticket.user
      });
      return;
    }

    // Check if ticket status is PAID
    if (ticket.status !== 'PAID') {
      res.status(400).json({ error: 'Ticket payment is not confirmed' });
      return;
    }

    // Mark as used
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        is_used: true,
        check_in_time: new Date()
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.status(200).json({
      message: 'Ticket successfully verified',
      attendee: updatedTicket.user,
      check_in_time: updatedTicket.check_in_time
    });
  } catch (error) {
    console.error('Check-in Error:', error);
    res.status(500).json({ error: 'Failed to process check-in' });
  }
};
