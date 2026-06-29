import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendTicketEmail = async (
  to: string, 
  ticketDetails: {
    eventName: string;
    date: string;
    location: string;
    ticketId: string;
    price: number;
    qrCodeUrl: string;
    organizerName: string;
  }
) => {
  if (process.env.EMAIL_USER === 'mock_user@gmail.com') {
    console.log('Mock email user detected. Skipping actual email send to:', to);
    console.log('Mock Email Content:', ticketDetails);
    return;
  }

  const { eventName, date, location, ticketId, price, qrCodeUrl, organizerName } = ticketDetails;
  
  const formattedPrice = price > 0 ? `₦${price.toLocaleString()}` : 'Free';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #6d28d9; text-align: center;">HUMI Ticket Confirmation</h2>
      <p>Thank you for your purchase! Here are your ticket details for <strong>${eventName}</strong>.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date & Time:</strong> ${new Date(date).toLocaleString()}</p>
        <p><strong>Venue:</strong> ${location}</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Amount Paid:</strong> ${formattedPrice}</p>
        <p><strong>Organizer:</strong> ${organizerName}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="margin-bottom: 10px; color: #4b5563;">Present this QR code at the event entrance:</p>
        <img src="${qrCodeUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px; border: 2px solid #6d28d9; border-radius: 10px; padding: 10px;" />
      </div>

      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        If you have any questions, please contact the event organizer or reply to this email.<br/>
        &copy; ${new Date().getFullYear()} HUMI Campus Event Management. All rights reserved.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"HUMI Events" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Your Ticket for ${eventName}`,
      html,
    });
    console.log(`Ticket email sent to ${to}`);
  } catch (error) {
    console.error('Error sending ticket email:', error);
  }
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  if (process.env.EMAIL_USER === 'mock_user@gmail.com') return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #6d28d9; text-align: center;">Welcome to HUMI!</h2>
      <p>Hi ${name},</p>
      <p>We are excited to have you on board. Discover, register, and experience the best campus events with HUMI.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3000/events" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Browse Events</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        &copy; ${new Date().getFullYear()} HUMI Campus Event Management.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"HUMI Welcome" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Welcome to HUMI!',
      html,
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendEventAnnouncement = async (to: string[], eventName: string, message: string) => {
  if (process.env.EMAIL_USER === 'mock_user@gmail.com') return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #6d28d9; text-align: center;">Update for ${eventName}</h2>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p>${message}</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        &copy; ${new Date().getFullYear()} HUMI Campus Event Management.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"HUMI Updates" <${process.env.EMAIL_USER}>`,
      bcc: to, // Use BCC for mass emails to hide recipients
      subject: `Update regarding ${eventName}`,
      html,
    });
  } catch (error) {
    console.error('Error sending announcement email:', error);
  }
};
