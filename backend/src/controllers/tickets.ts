import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { sendTicketEmail } from '../utils/email';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const purchaseTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { event_id, quantity = 1 } = req.body;
    
    if (quantity < 1) {
      res.status(400).json({ error: 'Quantity must be at least 1' });
      return;
    }
    
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: event_id },
      include: {
        _count: {
          select: { tickets: true }
        },
        organizer: true
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Check capacity
    if (event._count.tickets + quantity > event.capacity) {
      res.status(400).json({ error: `Not enough tickets available. Only ${event.capacity - event._count.tickets} left.` });
      return;
    }

    // Removed constraint limiting to one ticket per user

    const paymentReference = `TX_${uuidv4()}`;

    // If the event is free, generate the tickets immediately
    if (event.price === 0) {
      const createdTickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticketId = uuidv4();
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketId}`;
        const ticket = await prisma.ticket.create({
          data: {
            id: ticketId,
            user_id: req.user.userId,
            event_id,
            status: 'PAID',
            payment_reference: paymentReference,
            qr_code_url: qrCodeUrl,
          },
          include: {
            event: {
              include: {
                organizer: {
                  select: { name: true }
                }
              }
            }
          }
        });
        createdTickets.push(ticket);

        // Send Email asynchronously for each ticket
        sendTicketEmail(user.email, {
          eventName: event.title,
          date: event.date.toISOString(),
          location: event.location,
          ticketId: ticket.id,
          price: 0,
          qrCodeUrl,
          organizerName: event.organizer.name
        });
      }

      // Send in-app notification
      await prisma.notification.create({
        data: {
          user_id: req.user.userId,
          message: `Your free ticket for "${event.title}" on ${event.date.toLocaleDateString()} has been confirmed!`,
          type: 'SUCCESS'
        }
      });

      res.status(201).json({ message: 'Free tickets generated successfully', tickets: createdTickets });
      return;
    }

    // If it is a paid event, initialize Paystack transaction
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not configured in the environment');
      res.status(500).json({ error: 'Payment gateway configuration error' });
      return;
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY.trim();
    console.log(`[Initialize] Using Paystack Secret Key: ${secretKey.substring(0, 7)}...${secretKey.substring(secretKey.length - 4)}`);
    console.log(`[Initialize] Key Length: ${secretKey.length}`);

    try {
      const frontendUrl = req.headers.origin || 'http://localhost:3000';
      const paystackRes = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: user.email,
          amount: Math.round(event.price * quantity * 100), // convert to kobo, multiplied by quantity
          reference: paymentReference,
          callback_url: `${frontendUrl}/tickets/verify`,
          metadata: {
            event_id,
            user_id: req.user.userId,
            quantity
          }
        },
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      res.status(200).json({ 
        message: 'Payment initialized',
        authorization_url: paystackRes.data.data.authorization_url,
        reference: paymentReference
      });
    } catch (paystackError: any) {
      console.error('Paystack Initialization Error:', paystackError.response?.data || paystackError.message);
      
      const errorMessage = paystackError.response?.data?.message || 'Failed to initialize payment gateway';
      res.status(500).json({ error: errorMessage });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to purchase ticket' });
  }
};

export const verifyTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log("Verification request received");
    const { reference } = req.body;
    console.log("Payment reference:", reference);
    
    if (!reference) {
      res.status(400).json({ success: false, error: 'Payment reference is required' });
      return;
    }

    // Check if tickets already exist for this reference (prevents duplicates on re-verification)
    console.log("Checking for duplicate verification...");
    const existingTickets = await prisma.ticket.findMany({
      where: { payment_reference: reference },
      include: {
        event: {
          include: {
            organizer: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (existingTickets.length > 0) {
      console.log("Tickets already verified for reference:", reference);
      res.status(200).json({ success: true, message: 'Tickets already verified', tickets: existingTickets });
      return;
    }

    // Verify with Paystack
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not configured in the environment');
      res.status(500).json({ success: false, error: 'Payment gateway configuration error' });
      return;
    }

    let event_id: string;
    let user_id: string;
    let quantity = 1;

    const secretKey = process.env.PAYSTACK_SECRET_KEY.trim();
    console.log(`[Verify] Using Paystack Secret Key: ${secretKey.substring(0, 7)}...${secretKey.substring(secretKey.length - 4)}`);
    console.log("Calling Paystack...");

    let data;
    try {
      const paystackRes = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`
          }
        }
      );

      data = paystackRes.data.data;
      console.log("Paystack response status:", data.status);
      
      if (data.status !== 'success') {
        res.status(400).json({ success: false, error: 'Payment verification failed' });
        return;
      }

      // Safely parse metadata
      let metadata = data.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("Failed to parse metadata string from Paystack", e);
          metadata = {};
        }
      } else if (!metadata) {
        metadata = {};
      }

      event_id = metadata.event_id;
      user_id = metadata.user_id;
      
      if (metadata.quantity) {
        const parsedQty = parseInt(metadata.quantity, 10);
        if (!isNaN(parsedQty) && parsedQty > 0) {
          quantity = parsedQty;
        }
      }

      if (!event_id || !user_id) {
        console.error("Missing event_id or user_id in Paystack metadata:", metadata);
        res.status(400).json({ 
          success: false, 
          error: 'Verification metadata incomplete. Contact support.' 
        });
        return;
      }
      
    } catch (paystackError: any) {
      console.error('Paystack Verification Error:', paystackError.response?.data || paystackError.message);
      const errorMessage = paystackError.response?.data?.message || 'Failed to verify payment with gateway';
      res.status(500).json({ success: false, error: errorMessage });
      return;
    }

    console.log("Verifying Event and User in Database...");
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      include: { organizer: true }
    });

    const user = await prisma.user.findUnique({ where: { id: user_id } });

    if (!event || !user) {
      console.error(`Database validation failed: Event(${!!event}) User(${!!user})`);
      res.status(404).json({ success: false, error: 'Event or User not found' });
      return;
    }

    // Determine the email that purchased the ticket (from Paystack customer data)
    const purchaserEmail = data.customer?.email || user.email;

    console.log(`Updating database... Generating ${quantity} tickets for ${purchaserEmail}.`);

    // Use a transaction to ensure all tickets are created safely
    const createdTickets = await prisma.$transaction(async (tx) => {
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticketId = uuidv4();
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketId}`;

        const ticket = await tx.ticket.create({
          data: {
            id: ticketId,
            user_id,
            event_id,
            status: 'PAID',
            payment_reference: reference,
            qr_code_url: qrCodeUrl,
          },
          include: {
            event: {
              include: {
                organizer: {
                  select: { name: true }
                }
              }
            }
          }
        });
        tickets.push(ticket);
      }
      return tickets;
    });

    console.log("Verification completed. Database updated.");

    // Send Emails asynchronously (after transaction is successful)
    createdTickets.forEach(ticket => {
      sendTicketEmail(purchaserEmail, {
        eventName: event.title,
        date: event.date.toISOString(),
        location: event.location,
        ticketId: ticket.id,
        price: event.price,
        qrCodeUrl: ticket.qr_code_url || '',
        organizerName: event.organizer.name
      });
    });

    // Send in-app notification
    await prisma.notification.create({
      data: {
        user_id,
        message: `Your payment was successful! ${quantity} ticket(s) for "${event.title}" on ${event.date.toLocaleDateString()} have been issued.`,
        type: 'SUCCESS'
      }
    });

    res.status(201).json({ success: true, message: 'Tickets verified and created successfully', tickets: createdTickets });
  } catch (error: any) {
    console.error("Internal Server Error during verifyTicket:", error);
    
    // Provide a detailed error structure in development mode
    const errorResponse = {
      success: false,
      message: 'Internal server error during verification',
      error: error.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    };
    
    res.status(500).json(errorResponse);
  }
};

export const getUserTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const tickets = await prisma.ticket.findMany({
      where: { user_id: req.user.userId },
      include: {
        event: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

export const getEventTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    const tickets = await prisma.ticket.findMany({
      where: { event_id: eventId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event tickets' });
  }
};

export const checkInTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { event: true }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (ticket.event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    if (ticket.is_used) {
      res.status(400).json({ error: 'Ticket has already been used' });
      return;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        is_used: true,
        check_in_time: new Date()
      }
    });

    res.status(200).json({ message: 'Checked in successfully', ticket: updatedTicket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to check in ticket' });
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (ticket.user_id !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    await prisma.ticket.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
};
