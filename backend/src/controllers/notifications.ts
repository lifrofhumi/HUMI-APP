import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendEventAnnouncement } from '../utils/email';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Organizer sends an announcement to all attendees of an event
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { event_id, message } = req.body;

    if (!event_id || !message) {
      res.status(400).json({ error: 'event_id and message are required' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: event_id },
      include: {
        tickets: {
          where: { status: 'PAID' },
          include: { user: true }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'You do not own this event' });
      return;
    }

    // Save announcement
    const announcement = await prisma.announcement.create({
      data: {
        event_id,
        message
      }
    });

    // Create in-app notifications for each attendee
    const notificationData = event.tickets.map(ticket => ({
      user_id: ticket.user.id,
      message: `Announcement for ${event.title}: ${message}`,
      type: 'INFO'
    }));

    if (notificationData.length > 0) {
      await prisma.notification.createMany({
        data: notificationData
      });

      // Send emails
      const emails = event.tickets.map(ticket => ticket.user.email);
      sendEventAnnouncement(emails, event.title, message).catch(console.error);
    }

    res.status(201).json({ message: 'Announcement sent successfully', announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

// User gets their own in-app notifications
export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.userId },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.notification.updateMany({
      where: { user_id: req.user.userId, is_read: false },
      data: { is_read: true }
    });

    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

// Delete a notification
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    if (notification.user_id !== req.user.userId) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    await prisma.notification.delete({ where: { id } });
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
