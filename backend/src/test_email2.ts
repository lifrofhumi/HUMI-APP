import { sendTicketEmail } from './utils/email';

async function test() {
  console.log("Starting test...");
  try {
    await sendTicketEmail('quijadacarlos759@gmail.com', {
      eventName: 'Test Event',
      ticketId: 'TCK-12345',
      date: '2026-06-28',
      location: 'Lagos, Nigeria',
      price: 0,
      organizerName: 'Test Organizer',
      qrCodeUrl: 'https://example.com/qr.png'
    });
    console.log("Test completely finished!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
