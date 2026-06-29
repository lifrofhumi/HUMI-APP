import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    const totalTickets = await prisma.ticket.count();
    
    // Calculate total revenue from all PAID tickets
    const tickets = await prisma.ticket.findMany({
      where: { status: 'PAID' },
      include: { event: { select: { price: true } } }
    });

    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.event.price, 0);

    const pendingEventsCount = await prisma.event.count({
      where: { status: 'Pending Approval', is_cancelled: false }
    });

    const recentUsers = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, role: true, is_suspended: true, created_at: true }
    });

    res.status(200).json({
      totalUsers,
      totalEvents,
      totalTickets,
      totalRevenue,
      pendingEventsCount,
      recentUsers
    });
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Prevent self-suspension
    if (id === req.user?.userId) {
      res.status(400).json({ error: 'You cannot suspend yourself' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { is_suspended: !user.is_suspended }
    });

    res.status(200).json({ 
      message: `User ${updatedUser.is_suspended ? 'suspended' : 'unsuspended'} successfully`,
      user: { id: updatedUser.id, is_suspended: updatedUser.is_suspended }
    });
  } catch (error) {
    console.error('Failed to toggle suspension:', error);
    res.status(500).json({ error: 'Failed to toggle user suspension' });
  }
};

export const deleteEventByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    await prisma.event.delete({ where: { id } });

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Failed to delete event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
