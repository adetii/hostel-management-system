const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const validator = require('validator');

// Use SMTP (Zoho or other SMTP) exclusively

const BRAND_CONFIG = {
  name: process.env.BRAND_NAME,
  tagline: process.env.BRAND_TAGLINE,
  email: process.env.FROM_EMAIL,
  displayName: process.env.FROM_NAME,
  supportEmail: process.env.SUPPORT_EMAIL,
  phone: process.env.SUPPORT_PHONE,
  websiteUrl: process.env.WEBSITE_URL
};

const BATCH_CONFIG = {
  size: Number(process.env.EMAIL_BATCH_SIZE),
  delayMs: Number(process.env.EMAIL_BATCH_DELAY),
  maxRetries: Number(process.env.EMAIL_MAX_RETRIES),
  retryDelay: Number(process.env.EMAIL_RETRY_DELAY)
};

// SMTP env validation
{
  const missing = [];
  if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
  if (!process.env.SMTP_PORT) missing.push('SMTP_PORT');
  if (!process.env.SMTP_USER) missing.push('SMTP_USER');
  if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
  if (!process.env.FROM_EMAIL) missing.push('FROM_EMAIL');
  if (!process.env.FROM_NAME) missing.push('FROM_NAME');
  if (missing.length) {
    throw new Error(`Missing required SMTP environment variables: ${missing.join(', ')}`);
  }
}

// =============================================================================
// PRODUCTION LOGGER
// =============================================================================
class Logger {
  static info(message, meta = {}) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      service: 'email-service',
      ...meta
    }));
  }

  static error(message, error = null, meta = {}) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      service: 'email-service',
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null,
      ...meta
    }));
  }

  static warn(message, meta = {}) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      service: 'email-service',
      ...meta
    }));
  }
}

// =============================================================================
// INPUT VALIDATION & SANITIZATION
// =============================================================================
class EmailValidator {
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email address is required');
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!validator.isEmail(trimmedEmail)) {
      throw new Error('Invalid email address format');
    }
    
    // Additional security checks
    if (trimmedEmail.length > 254) {
      throw new Error('Email address too long');
    }
    
    return trimmedEmail;
  }

  static validateEmailArray(emails) {
    if (!Array.isArray(emails)) {
      emails = [emails];
    }
    
    if (emails.length === 0) {
      throw new Error('At least one email address is required');
    }
    
    if (emails.length > 1000) {
      throw new Error('Too many recipients (max 1000)');
    }
    
    return emails.map(email => this.validateEmail(email));
  }

  static sanitizeText(text) {
    if (!text) return '';
    
    // Basic HTML sanitization for template variables
    return String(text)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static validateSubject(subject) {
    if (!subject || typeof subject !== 'string') {
      throw new Error('Subject is required');
    }
    
    const trimmed = subject.trim();
    if (trimmed.length === 0) {
      throw new Error('Subject cannot be empty');
    }
    
    if (trimmed.length > 200) {
      throw new Error('Subject too long (max 200 characters)');
    }
    
    return trimmed;
  }
}

// =============================================================================
// TRANSPORTER WITH RETRY LOGIC
// =============================================================================
class ProductionEmailTransporter {
  constructor() {
    this.isReady = false;
    this.lastError = null;
    this.retryCount = 0;
    this.smtpTransport = null;
  }

  async initialize() {
    if (this.isReady) return this.transporter;

    try {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT, 10);
      const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
      this.smtpTransport = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: { minVersion: 'TLSv1.2', rejectUnauthorized: process.env.NODE_ENV === 'production' }
      });
      await this.smtpTransport.verify();
      this.isReady = true;
      this.retryCount = 0;
      this.lastError = null;
      Logger.info('Email transporter initialized via SMTP', { host, port, secure });
      return this.smtpTransport;
    } catch (error) {
      this.lastError = error;
      Logger.error('Email transporter initialization failed', error, {
        retryCount: this.retryCount
      });
      throw new Error(`Failed to initialize email service: ${error.message}`);
    }
  }

  async sendWithRetry(mailOptions, retries = BATCH_CONFIG.maxRetries) {
    if (!this.isReady) {
      await this.initialize();
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const info = await this.smtpTransport.sendMail(mailOptions);
        Logger.info('Email sent successfully (SMTP)', {
          messageId: info && info.messageId,
          to: mailOptions.to,
          subject: mailOptions.subject,
          attempt
        });
        return info;
      } catch (error) {
        Logger.error(`Email send attempt ${attempt} failed`, error, {
          to: mailOptions.to,
          subject: mailOptions.subject,
          attempt,
          retriesLeft: retries - attempt
        });

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        const delay = BATCH_CONFIG.retryDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// SECURE TEMPLATE SYSTEM
// =============================================================================
class SecureEmailTemplate {
  static getBaseStyles() {
    return `
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
      .brand { 
        font-size: 20px; 
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
        letter-spacing: -0.025em;
      }
      .brand-subtitle {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 16px;
      }
      .header h1 { 
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
        font-size: 16px;
      }
      .button-container {
        text-align: center;
        margin: 32px 0;
      }
      .btn {
        display: inline-block;
        color: white;
        padding: 14px 32px;
        text-decoration: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        transition: all 0.2s ease;
      }
      .btn-primary {
        background-color: #16a34a;
      }
      .btn-primary:hover {
        background-color: #15803d;
      }
      .alert {
        border-radius: 6px;
        padding: 16px;
        margin: 24px 0;
      }
      .alert-warning {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
      }
      .alert-info {
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        color: #0c4a6e;
      }
      .footer { 
        background: #f8fafc;
        margin-top: 32px; 
        padding: 24px;
        border-top: 1px solid #e5e7eb; 
        text-align: center;
      }
      .footer .brand-footer {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
      }
      .footer .tagline {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 16px;
        font-style: italic;
      }
      .footer .contact {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 16px;
      }
      .footer .disclaimer {
        font-size: 12px;
        color: #9ca3af;
      }
    `;
  }

  static getHeader(title) {
    const safeTitle = EmailValidator.sanitizeText(title);
    const safeBrandName = EmailValidator.sanitizeText(BRAND_CONFIG.name);
    const safeTagline = EmailValidator.sanitizeText(BRAND_CONFIG.tagline);
    
    return `
      <div class="header">
        <div class="brand">${safeBrandName}</div>
        <div class="brand-subtitle">${safeTagline}</div>
        <h1>${safeTitle}</h1>
      </div>
    `;
  }

  static getFooter(disclaimer = null) {
    const safeBrandName = EmailValidator.sanitizeText(BRAND_CONFIG.name);
    const safeTagline = EmailValidator.sanitizeText(BRAND_CONFIG.tagline);
    const safeSupportEmail = EmailValidator.sanitizeText(BRAND_CONFIG.supportEmail);
    const safePhone = EmailValidator.sanitizeText(BRAND_CONFIG.phone);
    const websiteUrlRaw = BRAND_CONFIG.websiteUrl || '';
    const safeWebsiteUrl = EmailValidator.sanitizeText(websiteUrlRaw);
    const telHref = (BRAND_CONFIG.phone || '').replace(/[^+\d]/g, '');
    const safeDisclaimer = disclaimer ? EmailValidator.sanitizeText(disclaimer) : '';

    const linkStyle = 'color:#0b74c3;text-decoration:none;';
    
    return `
      <div class="footer">
        <div class="brand-footer">${safeBrandName}</div>
        <div class="tagline">"${safeTagline}"</div>
        <div class="contact">
          ${safeSupportEmail ? `<a href="mailto:${safeSupportEmail}" style="${linkStyle}">${safeSupportEmail}</a>` : ''}
          ${(safeSupportEmail && safePhone) ? ' | ' : ''}
          ${safePhone ? `<a href="tel:${telHref}" style="${linkStyle}">${safePhone}</a>` : ''}
          ${((safeSupportEmail || safePhone) && safeWebsiteUrl) ? ' | ' : ''}
          ${safeWebsiteUrl ? `<a href="${safeWebsiteUrl}" style="${linkStyle}">${safeWebsiteUrl}</a>` : ''}
        </div>
        ${safeDisclaimer ? `<div class="disclaimer">${safeDisclaimer}</div>` : ''}
      </div>
    `;
  }

  static createBase(title, content, disclaimer = null) {
    const safeTitle = EmailValidator.sanitizeText(title);
    const safeBrandName = EmailValidator.sanitizeText(BRAND_CONFIG.name);
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <title>${safeTitle} - ${safeBrandName}</title>
        <style>${this.getBaseStyles()}</style>
      </head>
      <body>
        <div class="container">
          ${this.getHeader(title)}
          <div class="content">
            ${content}
          </div>
          ${this.getFooter(disclaimer)}
        </div>
      </body>
      </html>
    `;
  }

  static passwordReset(resetUrl) {
    // Validate URL format
    if (!resetUrl || typeof resetUrl !== 'string') {
      throw new Error('Reset URL is required');
    }
    
    // Basic URL validation
    try {
      new URL(resetUrl);
    } catch {
      throw new Error('Invalid reset URL format');
    }

    const content = `
      <p>You requested a password reset for your ${EmailValidator.sanitizeText(BRAND_CONFIG.name)} account.</p>
      <p>Click the button below to create a new password and regain access to your account:</p>
      <div class="button-container">
        <a href="${resetUrl}" class="btn btn-primary">Reset My Password</a>
      </div>
      <div class="alert alert-warning">
        <strong>Time Sensitive:</strong> This link will expire in <strong>10 minutes</strong> for security purposes.
      </div>
      <div class="alert alert-info">
        <strong>Security Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account stays secure.
      </div>
      <p>For any assistance with your account, please contact our support team.</p>
    `;
    
    const disclaimer = "This is an automated security email. Please do not reply directly to this message.";
    return this.createBase('Password Reset Request', content, disclaimer);
  }

  static emailVerification(displayName, verifyUrl) {
    // Validate inputs
    if (!verifyUrl || typeof verifyUrl !== 'string') {
      throw new Error('Verification URL is required');
    }
    
    try {
      new URL(verifyUrl);
    } catch {
      throw new Error('Invalid verification URL format');
    }

    const safeDisplayName = EmailValidator.sanitizeText(displayName || 'User');
    const safeBrandName = EmailValidator.sanitizeText(BRAND_CONFIG.name);
    
    const content = `
      <p>Hello <strong>${safeDisplayName}</strong>,</p>
      <p>Welcome to ${safeBrandName}! Thanks for registering with us.</p>
      <p>To complete your registration and access your account, please confirm this is your email address by clicking the button below:</p>
      <div class="button-container">
        <a href="${verifyUrl}" class="btn btn-primary">Verify My Email</a>
      </div>
      <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <div style="font-size: 12px; color: #16a34a; word-break: break-all; font-family: 'Courier New', monospace; background: white; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">
          ${verifyUrl}
        </div>
      </div>
      <div class="alert alert-warning">
        <p style="margin: 0;"><strong>Important:</strong> This verification link will expire in 24 hours for security purposes.</p>
      </div>
      <p>Once verified, you'll be able to log in and start using all the features of our hostel management system.</p>
    `;
    const disclaimer = "This is an automated security email. Please do not reply directly to this message.";
    return this.createBase('Verify Your Email', content, disclaimer);
  }
}

// =============================================================================
// PRODUCTION EMAIL SERVICE
// =============================================================================
class ProductionEmailService {
  constructor() {
    this.transporter = new ProductionEmailTransporter();
    this.stats = {
      sent: 0,
      failed: 0,
      lastReset: Date.now()
    };
  }

  async sendEmail(options) {
    try {
      // Validate inputs
      const email = EmailValidator.validateEmail(options.email);
      const subject = EmailValidator.validateSubject(options.subject);
      
      if (!options.html && !options.message) {
        throw new Error('Email content (html or message) is required');
      }

      const fromAddress = process.env.RESEND_FROM
        ? process.env.RESEND_FROM
        : `${BRAND_CONFIG.displayName} <${BRAND_CONFIG.email}>`;

      const mailOptions = {
        from: fromAddress,
        to: email,
        subject: subject,
        text: options.message || '',
        html: options.html || ''
      };

      if (options.replyTo) {
        mailOptions.replyTo = options.replyTo;
      }

      const info = await this.transporter.sendWithRetry(mailOptions);
      this.stats.sent++;
      return info;

    } catch (error) {
      this.stats.failed++;
      Logger.error('Email sending failed', error, {
        to: options.email,
        subject: options.subject,
        stats: this.stats
      });
      throw new Error(`Email could not be sent: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email, resetUrl) {
    const validatedEmail = EmailValidator.validateEmail(email);
    
    return this.sendEmail({
      email: validatedEmail,
      subject: 'Password Reset Request',
      html: SecureEmailTemplate.passwordReset(resetUrl)
    });
  }

  async sendVerificationEmail(email, fullName, verifyUrl) {
    const validatedEmail = EmailValidator.validateEmail(email);
    const safeDisplayName = EmailValidator.sanitizeText(fullName) || 'User';
    
    return this.sendEmail({
      email: validatedEmail,
      subject: 'Verify Your Email',
      html: SecureEmailTemplate.emailVerification(safeDisplayName, verifyUrl)
    });
  }

  async sendNoticeToStudents(studentEmails, subject, message, attachment = null, attachmentUrl = null) {
    // Validate inputs
    const validatedEmails = EmailValidator.validateEmailArray(studentEmails);
    const validatedSubject = EmailValidator.validateSubject(subject);
    const sanitizedMessage = EmailValidator.sanitizeText(message);

    const emailBatches = this.chunkArray(validatedEmails, BATCH_CONFIG.size);
    
    let totalSent = 0;
    let totalFailed = 0;
    const results = [];

    Logger.info('Starting bulk email send', {
      totalRecipients: validatedEmails.length,
      batches: emailBatches.length,
      subject: validatedSubject
    });

    for (let i = 0; i < emailBatches.length; i++) {
      const batch = emailBatches[i];

      const fromAddress = process.env.RESEND_FROM
        ? process.env.RESEND_FROM
        : `${BRAND_CONFIG.displayName} <${BRAND_CONFIG.email}>`;

      let batchSent = 0;
      let batchFailed = 0;
      const messageIds = [];

      for (const recipient of batch) {
      try {
        const mailOptions = {
            from: fromAddress,
            to: recipient,
          subject: validatedSubject,
          html: this.createNoticeTemplate(validatedSubject, sanitizedMessage, attachment, attachmentUrl)
        };

        const info = await this.transporter.sendWithRetry(mailOptions);
          batchSent += 1;
          totalSent += 1;
          if (info && info.messageId) messageIds.push(info.messageId);

          // Small delay to avoid provider rate limits
          await this.delay(200);
        } catch (error) {
          batchFailed += 1;
          totalFailed += 1;
          Logger.error(`Bulk notice send failed for ${recipient}`, error);
        }
      }

        results.push({
          batchIndex: i + 1,
        success: batchFailed === 0,
          recipientCount: batch.length,
        sent: batchSent,
        failed: batchFailed,
        messageIds
        });

      Logger.info(`Batch ${i + 1} completed`, {
          recipientCount: batch.length,
        sent: batchSent,
        failed: batchFailed,
        messageIds
      });

      // Delay between batches
      if (i < emailBatches.length - 1) {
        await this.delay(BATCH_CONFIG.delayMs);
      }
    }

    const summary = {
      success: totalSent > 0,
      totalRecipients: validatedEmails.length,
      totalSent,
      totalFailed,
      batches: emailBatches.length,
      results,
      timestamp: new Date().toISOString()
    };

    Logger.info('Bulk email send completed', summary);
    return summary;
  }

  createNoticeTemplate(subject, message, attachment, attachmentUrl) {
    const safeBrandName = EmailValidator.sanitizeText(BRAND_CONFIG.name);
    const safeTagline = EmailValidator.sanitizeText(BRAND_CONFIG.tagline);
    const safeSubject = EmailValidator.sanitizeText(subject);
    const safeMessage = message.replace(/\n/g, '<br/>');
    const safeDisclaimer = EmailValidator.sanitizeText('This is an automated system notice. Please do not reply to this email.');

    const attachmentHtml = attachment ? `
      <tr>
        <td style="padding:12px 24px 18px 24px;background:#ffffff;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius:6px;border:1px solid #e6eef6;background:#fbfeff;">
            <tr>
              <td style="padding:12px 14px;vertical-align:middle;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:36px;height:36px;border-radius:6px;background:#eef7fb;display:flex;align-items:center;justify-content:center;color:#0b6fb1;font-weight:700;font-size:14px;">📎</div>
                  <div style="flex:1">
                    <div style="font-size:14px;color:#0b6fb1;font-weight:600;">${EmailValidator.sanitizeText(attachment.filename || 'Attachment')}</div>
                    <div style="font-size:13px;color:#4b5563;margin-top:4px;">Click the button to download the attachment.</div>
                  </div>
                  <div style="padding-left:12px;">
                    ${attachmentUrl ? 
                      `<a href="${attachmentUrl}" style="display:inline-block;padding:9px 12px;border-radius:6px;background:#0b74c3;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;">Download</a>` :
                      `<span style="display:inline-block;padding:8px 10px;border-radius:6px;background:#e6eaf0;color:#374151;font-size:13px;">Attached</span>`
                    }
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    ` : '';

    return `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1.0" />
          <meta name="x-apple-disable-message-reformatting">
          <title>Hostel Notice</title>
        </head>
        <body style="margin:0;background-color:#f5f6f7;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td align="center" style="padding:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6e6e8;border-radius:8px;overflow:hidden;">
                  <tr>
                    <td style="padding:20px 24px;background:#ffffff;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="vertical-align:middle;">
                            <div style="font-size:18px;font-weight:700;color:#111111;letter-spacing:-0.02em;">${safeBrandName}</div>
                            <div style="font-size:13px;color:#6b7280;margin-top:6px;">${safeTagline}</div>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#f3f4f6;color:#374151;font-size:12px;font-weight:600;">HOSTEL NOTICE</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:18px 24px 8px 24px;background:#ffffff;">
                      <h1 style="margin:0;font-size:20px;color:#111111;font-weight:600;">${safeSubject}</h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:12px 24px 18px 24px;background:#ffffff;">
                      <div style="background:#fbfcfd;border:1px solid #eef2f6;border-radius:6px;padding:16px;">
                        <div style="color:#111827;font-size:15px;line-height:1.6;">
                          ${safeMessage}
                        </div>
                      </div>
                    </td>
                  </tr>

                  ${attachmentHtml}

                  <tr>
                    <td style="padding:18px 24px 20px 24px;background:#ffffff;border-top:1px solid #f1f5f9;">
                      <div style="font-size:13px;color:#6b7280;">
                        <div style="font-weight:600;color:#111111;">${safeBrandName}</div>
                        <div style="margin-top:6px;">
                          ${EmailValidator.sanitizeText(BRAND_CONFIG.supportEmail) ? `<a href="mailto:${EmailValidator.sanitizeText(BRAND_CONFIG.supportEmail)}" style="color:#0b74c3;text-decoration:none;">${EmailValidator.sanitizeText(BRAND_CONFIG.supportEmail)}</a>` : ''}
                          ${(EmailValidator.sanitizeText(BRAND_CONFIG.supportEmail) && EmailValidator.sanitizeText(BRAND_CONFIG.phone)) ? ' | ' : ''}
                          ${(() => { const t = (BRAND_CONFIG.phone || '').replace(/[^+\d]/g,''); return EmailValidator.sanitizeText(BRAND_CONFIG.phone) ? `<a href="tel:${t}" style="color:#0b74c3;text-decoration:none;">${EmailValidator.sanitizeText(BRAND_CONFIG.phone)}</a>` : '' })()}
                          ${( (EmailValidator.sanitizeText(BRAND_CONFIG.supportEmail) || EmailValidator.sanitizeText(BRAND_CONFIG.phone)) && EmailValidator.sanitizeText(BRAND_CONFIG.websiteUrl) ) ? ' | ' : ''}
                          ${EmailValidator.sanitizeText(BRAND_CONFIG.websiteUrl) ? `<a href="${EmailValidator.sanitizeText(BRAND_CONFIG.websiteUrl)}" style="color:#0b74c3;text-decoration:none;">${EmailValidator.sanitizeText(BRAND_CONFIG.websiteUrl)}</a>` : ''}
                        </div>
                        <div style="margin-top:10px;font-size:12px;color:#9aa0a6;">This is an official notice from the hostel administration.</div>
                        <div style="margin-top:10px;font-size:12px;color:#9aa0a6;">${safeDisclaimer}</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.lastReset
    };
  }
}

// =============================================================================
// PRODUCTION EXPORTS
// =============================================================================
const emailService = new ProductionEmailService();

// Graceful shutdown handler
process.on('SIGTERM', () => {
  Logger.info('Email service shutting down gracefully', emailService.getStats());
  process.exit(0);
});

module.exports = {
  // Main functions
  sendEmail: (options) => emailService.sendEmail(options),
  sendPasswordResetEmail: (email, resetUrl) => emailService.sendPasswordResetEmail(email, resetUrl),
  sendVerificationEmail: (email, fullName, verifyUrl) => emailService.sendVerificationEmail(email, fullName, verifyUrl),
  sendNoticeToStudents: (emails, subject, message, attachment, attachmentUrl) => 
    emailService.sendNoticeToStudents(emails, subject, message, attachment, attachmentUrl),
  
  // Production utilities
  getEmailStats: () => emailService.getStats(),
  EmailValidator,
  
  // For testing
  ProductionEmailService,
  SecureEmailTemplate
};