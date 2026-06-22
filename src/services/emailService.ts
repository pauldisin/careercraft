/**
 * Email Service
 * 
 * This service provides a standardized interface for sending transactional emails.
 * To use this, you must:
 * 1. Choose an email provider (e.g., Resend, SendGrid, Postmark).
 * 2. Set EMAIL_API_KEY and EMAIL_FROM in your environment variables.
 * 3. Implement the transport logic below.
 */

import { Resend } from 'resend';
import { escapeHtml } from '../lib/sanitizer.ts';

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) => {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn('[EmailService] Email not configured. Skipping send.', { to, subject });
    return;
  }

  const resend = new Resend(apiKey);
  
  try {
    await resend.emails.send({ from, to, subject, html, text });
    console.log(`[EmailService] Successfully sent email to ${to}: ${subject}`);
  } catch (error) {
    console.error('[EmailService] Error sending email:', error);
    throw error;
  }
};

// Generic transactional templates
export const sendWelcomeEmail = async (email: string, name: string) => {
  await sendEmail({
    to: email,
    subject: 'Welcome to CareerCraft!',
    html: `<p>Hi ${escapeHtml(name)},<br><br>Welcome to CareerCraft! We are excited to help you land your dream job.</p>`,
  });
};

export const sendPaymentConfirmation = async (email: string, amount: string) => {
  await sendEmail({
    to: email,
    subject: 'Payment Confirmation - CareerCraft',
    html: `<p>Thank you for your purchase of ${escapeHtml(amount)}. Your subscription is now active.</p>`,
  });
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  await sendEmail({
    to: email,
    subject: 'Reset your CareerCraft password',
    html: `<p>Hi,<br><br>We received a request to reset your password. Click the link below to set a new one:<br><br><a href="${resetLink}">Reset Password</a><br><br>If you did not make this request, please ignore this email.</p>`,
  });
};


