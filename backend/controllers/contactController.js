const nodemailer = require('nodemailer');
const { sendPasswordResetEmail, sendNoticeToStudents } = require('../utils/email');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE  === 'true', // true for 465, false for 587 (STARTTLS)
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
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
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.5; 
      color: #374151; 
      background-color: #f9fafb;
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .header { 
      background: #f8fafc; 
      padding: 24px; 
      border-bottom: 1px solid #e5e7eb;
    }
    .header h2 { 
      margin: 0; 
      font-size: 20px; 
      font-weight: 600; 
      color: #1f2937;
    }
    .content { 
      padding: 24px; 
    }
    .field { 
      margin-bottom: 20px; 
    }
    .label { 
      font-weight: 500; 
      color: #6b7280; 
      font-size: 14px;
      margin-bottom: 4px;
      display: block;
    }
    .value { 
      font-size: 16px;
      color: #1f2937;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
    .message-field .value { 
      min-height: 80px;
      white-space: pre-wrap;
    }
    .footer { 
      margin-top: 32px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
      font-size: 14px; 
      color: #6b7280;
    }
    .footer strong {
      color: #374151;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Name</span>
        <div class="value">${data.name}</div>
      </div>
      
      <div class="field">
        <span class="label">Email</span>
        <div class="value">${data.email}</div>
      </div>
      
      <div class="field">
        <span class="label">Phone</span>
        <div class="value">${data.phone || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <span class="label">Subject</span>
        <div class="value">${data.subject}</div>
      </div>
      
      <div class="field">
        <span class="label">Inquiry Type</span>
        <div class="value">${data.inquiryType}</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="field message-field">
        <span class="label">Message</span>
        <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
      </div>
      
      <div class="footer">
        <strong>Submitted:</strong> ${new Date().toLocaleString('en-US', {
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
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.5; 
      color: #374151; 
      background-color: #f9fafb;
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .header { 
      background: #f8fafc; 
      padding: 32px 24px; 
      border-bottom: 1px solid #e5e7eb;
      text-align: center;
    }
    .header .logo { 
      font-size: 18px; 
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .header h2 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 600; 
      color: #1f2937;
    }
    .content { 
      padding: 32px 24px; 
    }
    .content p {
      margin-bottom: 16px;
    }
    .highlight { 
      background: #f9fafb; 
      padding: 20px; 
      border: 1px solid #e5e7eb;
      border-radius: 6px; 
      margin: 24px 0;
    }
    .highlight strong {
      color: #1f2937;
    }
    .response-time {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
    }
    .urgent-info {
      background: #fef2f2;
      border: 1px solid #f87171;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
    }
    .footer { 
      margin-top: 32px; 
      padding-top: 24px; 
      border-top: 1px solid #e5e7eb; 
      text-align: center;
    }
    .footer p {
      margin: 8px 0;
    }
    .footer .team {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .footer .contact {
      color: #6b7280;
      font-size: 14px;
    }
    .footer .disclaimer {
      font-size: 12px;
      color: #9ca3af;
      font-style: italic;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Elite Hostel Management System</div>
      <h2>Thank You for Contacting Us!</h2>
    </div>
    <div class="content">
      <p>Dear <strong>${name}</strong>,</p>
      
      <p>Thank you for reaching out to Elite Hostel. We have successfully received your message and truly appreciate your interest in our services.</p>
      
      <div class="highlight">
        <strong>Your Inquiry Details:</strong><br><br>
        <strong>Subject:</strong> ${subject}<br>
        <strong>Inquiry Type:</strong> ${inquiryType}<br>
        <strong>Submitted:</strong> ${new Date().toLocaleString()}
      </div>
      
      <div class="response-time">
        <p style="margin: 0;"><strong>Response Time:</strong> Our team will review your message and get back to you within <strong>24-48 hours</strong> during business days.</p>
      </div>
      
      <div class="urgent-info">
        <p style="margin: 0;"><strong>Urgent Inquiries:</strong> If your matter requires immediate attention, please don't hesitate to call us directly.</p>
      </div>
      
      <p>We look forward to assisting you with your accommodation needs!</p>
      
      <div class="footer">
        <p class="team">Best regards,<br>
        The Elite Hostel Team</p>
        <p class="contact">info@elitehostel.com | +233-555-0000</p>
        <p class="disclaimer">This is an automated message. Please do not reply directly to this email.</p>
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
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
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
      to: process.env.ADMIN_EMAIL || 'adetielorm91@gmail.com',
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