import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("Using credentials:");
console.log("USER:", process.env.EMAIL_USER);
console.log("PASS:", process.env.EMAIL_PASS?.substring(0, 4) + "****");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  try {
    console.log("Attempting to send email...");
    await transporter.sendMail({
      from: '"HUMI Events Test" <' + process.env.EMAIL_USER + '>',
      to: process.env.EMAIL_USER,
      subject: 'Test Email Validation',
      text: 'This is a test email to verify credentials.',
    });
    console.log("Email sent successfully! Your App Password is correct.");
  } catch (error) {
    console.error("Failed to send email. Error details:", error);
  }
}

testEmail();
