const nodemailer = require('nodemailer');
const { sendPasswordResetEmail, sendNoticeToStudents } = require('../utils/email');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT) || 2525,
    secure: false,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS
    },
    connectionTimeout: 60000,
    socketTimeout: 60000,
  });
};

// Enhanced HTML email template
const createHTMLEmailTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-top: 5px; padding: 8px; background: white; border-radius: 4px; border-left: 4px solid #667eea; }
        .message { background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Name:</div>
            <div class="value">${data.name}</div>
          </div>
          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${data.email}</div>
          </div>
          <div class="field">
            <div class="label">Phone:</div>
            <div class="value">${data.phone}</div>
          </div>
          <div class="field">
            <div class="label">Subject:</div>
            <div class="value">${data.subject}</div>
          </div>
          <div class="field">
            <div class="label">Inquiry Type:</div>
            <div class="value">${data.inquiryType}</div>
          </div>
          <div class="field">
            <div class="label">Message:</div>
            <div class="message">${data.message.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="footer">
            <strong>Submitted at:</strong> ${new Date().toLocaleString('en-US', {
              timeZone: 'GMT',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })} UTC
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Enhanced auto-reply template
const createAutoReplyTemplate = (name, subject, inquiryType) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You - Elite Hostel</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; margin: 20px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏨 Elite Hostel</div>
          <h2 style="margin: 10px 0 0 0;">Thank You for Contacting Us!</h2>
        </div>
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          
          <p>Thank you for reaching out to Elite Hostel. We have successfully received your message and truly appreciate your interest in our services.</p>
          
          <div class="highlight">
            <strong>📋 Your Inquiry Details:</strong><br>
            <strong>Subject:</strong> ${subject}<br>
            <strong>Inquiry Type:</strong> ${inquiryType}<br>
            <strong>Submitted:</strong> ${new Date().toLocaleString()}
          </div>
          
          <p><strong>⏰ Response Time:</strong> Our team will review your message and get back to you within <strong>24-48 hours</strong> during business days.</p>
          
          <p><strong>📞 Urgent Inquiries:</strong> If your matter requires immediate attention, please don't hesitate to call us directly.</p>
          
          <p>We look forward to assisting you with your accommodation needs!</p>
          
          <div class="footer">
            <p><strong>Best regards,</strong><br>
            The Elite Hostel Team</p>
            <p>📧 admin@elitehostel.com | 📱 +233-XXX-XXXX</p>
            <p><em>This is an automated message. Please do not reply directly to this email.</em></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Submit contact form
const submitContactForm = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message, inquiryType } = req.body;

    // Validate required environment variables
    if (!process.env.MAILTRAP_SMTP_USER || !process.env.MAILTRAP_SMTP_PASS) {
      throw new Error('SMTP credentials not configured');
    }

    // Sanitize inputs (basic HTML escaping)
    const sanitizedData = {
      name: name ? name.replace(/[<>]/g, '') : '',
      email: email ? email.toLowerCase().trim() : '',
      phone: phone ? phone.replace(/[<>]/g, '') : null,
      subject: subject ? subject.replace(/[<>]/g, '') : '',
      message: message ? message.replace(/[<>]/g, '') : '',
      inquiryType: inquiryType ? inquiryType.replace(/[<>]/g, '') : ''
    };

    const transporter = createTransporter();

    // Verify transporter connection
    await transporter.verify();

    // Email options for admin notification
    const mailOptions = {
      from: `"Elite Hostel Contact Form" <noreply@elitehostel.com>`,
      to: process.env.ADMIN_EMAIL || 'admin@elitehostel.com',
      subject: `🔔 Contact Form: ${sanitizedData.subject}`,
      text: `
        New Contact Form Submission
        
        Name: ${sanitizedData.name}
        Email: ${sanitizedData.email}
        Phone: ${sanitizedData.phone || 'Not provided'}
        Subject: ${sanitizedData.subject}
        Inquiry Type: ${sanitizedData.inquiryType}
        
        Message:
        ${sanitizedData.message}
        
        Submitted at: ${new Date().toLocaleString()}
      `,
      html: createHTMLEmailTemplate(sanitizedData),
      replyTo: sanitizedData.email
    };

    // Send notification email to admin
    const adminEmailResult = await transporter.sendMail(mailOptions);

    // Send auto-reply to user
    const autoReplyOptions = {
      from: `"Elite Hostel" <noreply@elitehostel.com>`,
      to: sanitizedData.email,
      subject: 'Thank you for contacting Elite Hostel 🏨',
      text: `
        Dear ${sanitizedData.name},
        
        Thank you for contacting Elite Hostel. We have received your message and will get back to you within 24-48 hours.
        
        Your inquiry details:
        Subject: ${sanitizedData.subject}
        Inquiry Type: ${sanitizedData.inquiryType}
        Submitted: ${new Date().toLocaleString()}
        
        Best regards,
        Elite Hostel Team
        
        This is an automated message. Please do not reply directly to this email.
      `,
      html: createAutoReplyTemplate(sanitizedData.name, sanitizedData.subject, sanitizedData.inquiryType)
    };

    const autoReplyResult = await transporter.sendMail(autoReplyOptions);

    // Success response
    res.status(200).json({
      success: true,
      data: {
        submissionId: adminEmailResult.messageId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);

    // Determine error type and send appropriate response
    let statusCode = 500;
    let errorMessage = 'Failed to submit contact form. Please try again later.';

    if (error.code === 'EAUTH') {
      statusCode = 503;
      errorMessage = 'Email service temporarily unavailable. Please try again later.';
    } else if (error.code === 'ECONNECTION') {
      statusCode = 503;
      errorMessage = 'Unable to connect to email service. Please try again later.';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        stack: error.stack
      } : undefined
    });
  }
};

// Optional: Health check endpoint for email service
const checkEmailService = async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    res.status(200).json({
      success: true,
      message: 'Email service is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Email service is unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  submitContactForm,
  checkEmailService
};