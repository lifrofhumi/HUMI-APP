import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  // Check if organizer exists
  let organizer = await prisma.user.findUnique({ where: { email: 'organizer@humi.edu' } });
  
  if (!organizer) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('password123', salt);
    
    organizer = await prisma.user.create({
      data: {
        name: 'University Events Team',
        email: 'organizer@humi.edu',
        password_hash,
        role: 'ORGANIZER',
      }
    });
    console.log('Created organizer user.');
  }

  // Create sample events
  const eventsCount = await prisma.event.count();
  
  if (eventsCount === 0) {
    await prisma.event.createMany({
      data: [
        {
          title: 'Annual Tech Symposium 2026',
          description: 'Join the brightest minds in technology for a full day of keynotes, workshops, and networking.',
          date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
          location: 'Main Auditorium',
          image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          price: 15.0,
          capacity: 500,
          organizer_id: organizer.id,
        },
        {
          title: 'Campus Music Festival',
          description: 'A night of incredible live performances from top university bands and guest artists.',
          date: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // In 2 weeks
          location: 'University Stadium',
          image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          price: 0,
          capacity: 2000,
          organizer_id: organizer.id,
        },
        {
          title: 'Startup Pitch Night',
          description: 'Watch student entrepreneurs pitch their innovative startup ideas to a panel of investors.',
          date: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // In 3 days
          location: 'Innovation Hub',
          image_url: 'https://images.unsplash.com/photo-1559136555-9ce7b5fda016?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          price: 5.0,
          capacity: 150,
          organizer_id: organizer.id,
        }
      ]
    });
    console.log('Created sample events.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
