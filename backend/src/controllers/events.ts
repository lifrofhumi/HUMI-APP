import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, minPrice, maxPrice, type, organizer_id } = req.query;

    let whereClause: any = {};

    if (organizer_id) {
      whereClause.organizer_id = String(organizer_id);
    } else {
      whereClause.is_cancelled = false;
      whereClause.status = { in: ['Approved', 'Published'] };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { location: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'All') {
      whereClause.category = String(category);
    }

    if (type === 'Free') {
      whereClause.price = 0;
    } else if (type === 'Paid') {
      whereClause.price = { gt: 0 };
    }

    if (minPrice) {
      whereClause.price = { ...whereClause.price, gte: parseFloat(String(minPrice)) };
    }
    if (maxPrice) {
      whereClause.price = { ...whereClause.price, lte: parseFloat(String(maxPrice)) };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        organizer: { select: { name: true } },
        images: { orderBy: { position: 'asc' } }
      },
      orderBy: { date: 'asc' }
    });
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { 
        organizer: { select: { id: true, name: true } },
        _count: { select: { tickets: true } },
        images: { orderBy: { position: 'asc' } }
      },
    });
    
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    
    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, date, location, price, capacity, category } = req.body;
    
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    let uploadedImages: { secure_url: string, public_id: string }[] = [];

    if (files && files.length > 0) {
      if (files.length > 10) {
        res.status(400).json({ error: 'Maximum 10 images allowed' });
        return;
      }
      try {
        const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
        uploadedImages = await Promise.all(uploadPromises);
      } catch (uploadError: any) {
        res.status(500).json({ error: 'Cloudinary upload failed', details: uploadError.message || uploadError });
        return;
      }
    }

    const defaultUrl = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    const primaryImageUrl = uploadedImages.length > 0 ? uploadedImages[0].secure_url : defaultUrl;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        image_url: primaryImageUrl,
        price: parseFloat(price) || 0,
        capacity: parseInt(capacity) || 100,
        category: category || "General",
        organizer_id: req.user.userId,
        status: "Pending Approval",
        submittedAt: new Date(),
        images: {
          create: uploadedImages.map((img, index) => ({
            image_url: img.secure_url,
            public_id: img.public_id,
            is_cover: index === 0,
            position: index
          }))
        }
      },
      include: { images: true }
    });
    
    // Notify Admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          user_id: admin.id,
          message: `New event "${event.title}" submitted for approval.`,
          type: 'INFO'
        }))
      });
    }

    res.status(201).json({ message: 'Event submitted for review', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, date, location, image_url, price, capacity, category, is_cancelled } = req.body;
    
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check ownership
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    
    if (existingEvent.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    const updateData: any = {
      title: title || existingEvent.title,
      description: description || existingEvent.description,
      date: date ? new Date(date) : existingEvent.date,
      location: location || existingEvent.location,
      price: price !== undefined && price !== '' ? parseFloat(price) : existingEvent.price,
      capacity: capacity !== undefined && capacity !== '' ? parseInt(capacity) : existingEvent.capacity,
      category: category || existingEvent.category,
      is_cancelled: is_cancelled !== undefined ? (is_cancelled === 'true' || is_cancelled === true) : existingEvent.is_cancelled,
    };

    if (existingEvent.status === 'Rejected' && req.user.role === 'ORGANIZER') {
      updateData.status = 'Pending Approval';
      updateData.submittedAt = new Date();
      
      // Notify Admins of resubmission
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            user_id: admin.id,
            message: `Event "${existingEvent.title}" has been resubmitted for approval.`,
            type: 'INFO'
          }))
        });
      }
    }
    
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });
    
    res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    console.error('Unhandled Controller Exception:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existingEvent = await prisma.event.findUnique({ 
      where: { id },
      include: { images: true } 
    });
    
    if (!existingEvent) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    
    if (existingEvent.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Optional: Delete all images from Cloudinary before deleting event
    for (const image of existingEvent.images) {
      if (image.public_id) {
        await deleteFromCloudinary(image.public_id).catch(console.error);
      }
    }

    await prisma.event.delete({ where: { id } });
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

export const addEventImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const event = await prisma.event.findUnique({ where: { id }, include: { images: true } });
    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
    if (event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') { res.status(403).json({ error: 'Permission denied' }); return; }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ error: 'No images provided' }); return; }
    
    if (event.images.length + files.length > 10) {
      res.status(400).json({ error: `Maximum 10 images allowed. You already have ${event.images.length}.` });
      return;
    }

    let uploadedImages: { secure_url: string, public_id: string }[] = [];
    try {
      const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
      uploadedImages = await Promise.all(uploadPromises);
    } catch (error) {
      res.status(500).json({ error: 'Cloudinary upload failed' });
      return;
    }

    const startIndex = event.images.length;
    const newImages = await prisma.$transaction(
      uploadedImages.map((img, index) => 
        prisma.eventImage.create({
          data: {
            event_id: id,
            image_url: img.secure_url,
            public_id: img.public_id,
            is_cover: event.images.length === 0 && index === 0,
            position: startIndex + index
          }
        })
      )
    );

    // If this is the first image added, make it the cover
    if (event.images.length === 0 && newImages.length > 0) {
      await prisma.event.update({
        where: { id },
        data: { image_url: newImages[0].image_url }
      });
    }

    res.status(200).json({ message: 'Images added successfully', images: newImages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add images' });
  }
};

export const deleteEventImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, imageId } = req.params;
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const event = await prisma.event.findUnique({ where: { id }, include: { images: { orderBy: { position: 'asc' } } } });
    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
    if (event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') { res.status(403).json({ error: 'Permission denied' }); return; }

    const imageToDelete = event.images.find(img => img.id === imageId);
    if (!imageToDelete) { res.status(404).json({ error: 'Image not found' }); return; }

    // Delete from cloudinary
    if (imageToDelete.public_id) {
      await deleteFromCloudinary(imageToDelete.public_id).catch(console.error);
    }

    await prisma.eventImage.delete({ where: { id: imageId } });

    // If cover was deleted, assign a new cover
    if (imageToDelete.is_cover) {
      const remainingImages = event.images.filter(img => img.id !== imageId);
      if (remainingImages.length > 0) {
        const newCover = remainingImages[0];
        await prisma.eventImage.update({ where: { id: newCover.id }, data: { is_cover: true } });
        await prisma.event.update({ where: { id }, data: { image_url: newCover.image_url } });
      } else {
        await prisma.event.update({ where: { id }, data: { image_url: null } });
      }
    }

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

export const reorderEventImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { order } = req.body; // Array of { id, position }
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
    if (event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') { res.status(403).json({ error: 'Permission denied' }); return; }

    await prisma.$transaction(
      order.map((item: any) => 
        prisma.eventImage.update({
          where: { id: item.id },
          data: { position: item.position }
        })
      )
    );

    res.status(200).json({ message: 'Images reordered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
};

export const setEventCoverImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, imageId } = req.params;
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const event = await prisma.event.findUnique({ where: { id }, include: { images: true } });
    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
    if (event.organizer_id !== req.user.userId && req.user.role !== 'ADMIN') { res.status(403).json({ error: 'Permission denied' }); return; }

    const newCover = event.images.find(img => img.id === imageId);
    if (!newCover) { res.status(404).json({ error: 'Image not found' }); return; }

    await prisma.$transaction([
      prisma.eventImage.updateMany({ where: { event_id: id }, data: { is_cover: false } }),
      prisma.eventImage.update({ where: { id: imageId }, data: { is_cover: true } }),
      prisma.event.update({ where: { id }, data: { image_url: newCover.image_url } })
    ]);

    res.status(200).json({ message: 'Cover image updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to set cover image' });
  }
};

export const getAdminPendingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'Pending Approval', is_cancelled: false },
      include: {
        organizer: { select: { name: true, faculty: true, department: true } },
      },
      orderBy: { submittedAt: 'asc' }
    });
    res.status(200).json(events);
  } catch (error) {
    console.error('Failed to fetch pending events:', error);
    res.status(500).json({ error: 'Failed to fetch pending events' });
  }
};

export const getAdminAllEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: { select: { name: true, faculty: true, department: true } },
      },
      orderBy: { submittedAt: 'desc' }
    });
    res.status(200).json(events);
  } catch (error) {
    console.error('Failed to fetch all events:', error);
    res.status(500).json({ error: 'Failed to fetch all events' });
  }
};

export const approveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedBy: req.user.userId,
        approvedAt: new Date(),
        publishedAt: new Date(),
      }
    });

    await prisma.notification.create({
      data: {
        user_id: event.organizer_id,
        message: `Congratulations! Your event "${event.title}" has been approved and is now visible to students.`,
        type: 'SUCCESS'
      }
    });

    res.status(200).json({ message: 'Event approved successfully', event });
  } catch (error) {
    console.error('Failed to approve event:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
};

export const rejectEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    if (!rejectionReason) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        status: 'Rejected',
        rejectedBy: req.user.userId,
        rejectedAt: new Date(),
        rejectionReason
      }
    });

    await prisma.notification.create({
      data: {
        user_id: event.organizer_id,
        message: `Your event "${event.title}" was rejected. Reason: ${rejectionReason}`,
        type: 'ERROR'
      }
    });

    res.status(200).json({ message: 'Event rejected successfully', event });
  } catch (error) {
    console.error('Failed to reject event:', error);
    res.status(500).json({ error: 'Failed to reject event' });
  }
};
