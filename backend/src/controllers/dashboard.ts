import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const getOrganizerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const organizerId = req.user.userId;

    // Get all events for this organizer
    const events = await prisma.event.findMany({
      where: { organizer_id: organizerId },
      include: {
        tickets: true
      }
    });

    const totalEvents = events.length;
    let totalRevenue = 0;
    let ticketsSold = 0;
    let checkIns = 0;
    const upcomingEvents = events.filter(e => e.date > new Date()).length;

    events.forEach(event => {
      event.tickets.forEach(ticket => {
        if (ticket.status === 'PAID') {
          ticketsSold += 1;
          totalRevenue += event.price;
          if (ticket.is_used) {
            checkIns += 1;
          }
        }
      });
    });

    // Recent ticket purchases
    const recentTickets = await prisma.ticket.findMany({
      where: {
        event: { organizer_id: organizerId },
        status: 'PAID'
      },
      include: {
        event: { select: { title: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    res.status(200).json({
      totalEvents,
      totalRevenue,
      ticketsSold,
      checkIns,
      upcomingEvents,
      recentTickets
    });
  } catch (error) {
    console.error('Failed to get organizer stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

export const getEventStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: { tickets: true }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    let ticketsSold = 0;
    let totalRevenue = 0;
    let checkIns = 0;
    const paymentReferences = new Set();

    event.tickets.forEach(ticket => {
      if (ticket.status === 'PAID') {
        ticketsSold += 1;
        totalRevenue += event.price;
        if (ticket.payment_reference) {
          paymentReferences.add(ticket.payment_reference);
        }
        if (ticket.is_used) {
          checkIns += 1;
        }
      }
    });

    const totalPurchases = paymentReferences.size;

    const recentTickets = await prisma.ticket.findMany({
      where: {
        event_id: id,
        status: 'PAID'
      },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    const ticketsRemaining = Math.max(0, event.capacity - ticketsSold);

    res.status(200).json({
      eventTitle: event.title,
      ticketsSold,
      totalPurchases,
      ticketsRemaining,
      totalRevenue,
      checkIns,
      capacity: event.capacity,
      recentTickets
    });
  } catch (error) {
    console.error('Failed to get event stats:', error);
    res.status(500).json({ error: 'Failed to fetch event statistics' });
  }
};
