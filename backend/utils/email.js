const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true", // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  // Pool and rate limiting
  pool: true,
  maxConnections: 3,   // keep up to 3 SMTP connections open
  maxMessages: 10,     // max 10 emails per connection
  rateDelta: 20000,    // time window in ms (20s)
  rateLimit: 5         // max 5 emails per rateDelta
});

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: '"Hostel Management System" <noreply@hostelmanagement.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Elite Hostel Management</title>
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
          .reset-button {
            display: inline-block;
            background-color: #16a34a;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            transition: background-color 0.2s ease;
          }
          .reset-button:hover {
            background-color: #15803d;
          }
          .warning-box {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
          }
          .info-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
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
          .footer .disclaimer {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">ELITE HOSTEL MANAGEMENT</div>
            <div class="brand-subtitle">A Home Close For Your Academic Success</div>
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>You requested a password reset for your Elite Hostel Management System account.</p>
            
            <p>Click the button below to create a new password and regain access to your account:</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="reset-button">Reset My Password</a>
            </div>
            
            <div class="warning-box">
              <strong>Time Sensitive:</strong> This link will expire in <strong>10 minutes</strong> for security purposes.
            </div>
            
            <div class="info-box">
              <strong>Security Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account stays secure.
            </div>
            
            <p>For any assistance with your account, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <div class="brand-footer">Elite Hostel Management</div>
            <div class="tagline">"A Home Close For Your Academic Success"</div>
            <div style="font-size: 14px; color: #6b7280;">
              support@elitehostel.com | +233-555-0000
            </div>
            <div class="disclaimer">
              This is an automated security email. Please do not reply directly to this message.
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Utility function to split array into chunks
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};


/**
 * Robust sendNoticeToStudents
 * - studentEmails: array (or single email)
 * - subject, message: strings
 * - attachment: can be:
 *     { originalname, buffer, mimetype }    // old controller style
 *     { filename, content(Buffer|string), contentType, encoding? } // new style
 *     { path: '/abs/path/to/file', filename?, contentType? } // path on disk
 *     base64 string (not recommended)
 */
const sendNoticeToStudents = async (studentEmails, subject, message, attachment = null, attachmentUrl = null) => {
  if (!Array.isArray(studentEmails)) studentEmails = [studentEmails];

  const BATCH_SIZE = 10; // keep same as before
  const DELAY_BETWEEN_BATCHES = 3000;

  const emailBatches = chunkArray(studentEmails, BATCH_SIZE);
  const results = [];
  let totalSent = 0;
  let totalFailed = 0;

  console.log(`Sending notice to ${studentEmails.length} students in ${emailBatches.length} batches`);

  // normalize attachment into Nodemailer-friendly object or null
  let normalizedAttachment = null;
  if (attachment) {
    try {
      // case: old controller: { originalname, buffer, mimetype }
      if (attachment.buffer && (attachment.originalname || attachment.filename)) {
        const filename = (attachment.originalname || attachment.filename).replace(/\s+/g, '_');
        const content = attachment.buffer;
        if (!Buffer.isBuffer(content) || content.length === 0) throw new Error('Attachment buffer empty');
        normalizedAttachment = {
          filename,
          content,
          contentType: attachment.mimetype || attachment.contentType || 'application/octet-stream'
        };
      }
      // case: { filename, content, contentType, encoding? }
      else if (attachment.content && (attachment.filename || attachment.originalname)) {
        const filename = (attachment.filename || attachment.originalname).replace(/\s+/g, '_');
        const content = attachment.content;
        // if content is Buffer
        if (Buffer.isBuffer(content)) {
          if (content.length === 0) throw new Error('Attachment buffer empty');
          normalizedAttachment = {
            filename,
            content,
            contentType: attachment.contentType || attachment.mimetype || 'application/octet-stream'
          };
        } else if (typeof content === 'string') {
          // If it's a base64 string (likely), detect and set encoding
          const isLikelyBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(content.replace(/\s+/g, ''));
          if (isLikelyBase64) {
            normalizedAttachment = {
              filename,
              content: content.replace(/\s+/g, ''), // strip whitespace
              encoding: 'base64',
              contentType: attachment.contentType || attachment.mimetype || 'application/octet-stream'
            };
          } else {
            // treat as plain text content
            normalizedAttachment = {
              filename,
              content,
              contentType: attachment.contentType || 'text/plain'
            };
          }
        } else {
          throw new Error('Unsupported attachment.content type');
        }
      }
      // case: path on disk
      else if (attachment.path) {
        const abs = path.isAbsolute(attachment.path) ? attachment.path : path.join(process.cwd(), attachment.path);
        if (!fs.existsSync(abs)) throw new Error('Attachment path not found: ' + abs);
        const buf = fs.readFileSync(abs);
        if (!Buffer.isBuffer(buf) || buf.length === 0) throw new Error('Attachment file empty on disk: ' + abs);
        const filename = (attachment.filename || path.basename(abs)).replace(/\s+/g, '_');
        normalizedAttachment = {
          filename,
          content: buf,
          contentType: attachment.contentType || attachment.mimetype || 'application/octet-stream'
        };
      } else {
        // unknown shape — log and ignore
        console.warn('sendNoticeToStudents: unknown attachment shape, skipping attachment', Object.keys(attachment));
      }

    } catch (err) {
      console.error('Attachment normalization error:', err);
      // fail fast: return a summary that indicates failure reason
      return {
        success: false,
        totalRecipients: studentEmails.length,
        totalSent: 0,
        totalFailed: studentEmails.length,
        batches: emailBatches.length,
        results: [{ error: 'Attachment normalization failed: ' + err.message }]
      };
    }
  }

  // iterate batches and send
  for (let i = 0; i < emailBatches.length; i++) {
    const batch = emailBatches[i];

    // build mail options
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Hostel Management System" <noreply@hostelmanagement.com>',
      to: '"Hostel Notice" <noreply@hostelmanagement.com>',
      bcc: batch,
      subject,
      html: `
        <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1.0" />
          <title>Hostel Notice</title>
        </head>
        <body style="margin:0;background-color:#f5f6f7;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td align="center" style="padding:24px;">
                <!-- Container -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6e6e8;border-radius:8px;overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding:20px 24px;background:#ffffff;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="vertical-align:middle;">
                            <div style="font-size:18px;font-weight:700;color:#111111;letter-spacing:-0.02em;">ELITE HOSTEL MANAGEMENT</div>
                            <div style="font-size:13px;color:#6b7280;margin-top:6px;">A home close for your academic success</div>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <!-- small neutral badge -->
                            <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#f3f4f6;color:#374151;font-size:12px;font-weight:600;">HOSTEL NOTICE</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Subject -->
                  <tr>
                    <td style="padding:18px 24px 8px 24px;background:#ffffff;">
                      <h1 style="margin:0;font-size:20px;color:#111111;font-weight:600;">${subject}</h1>
                    </td>
                  </tr>

                  <!-- Message -->
                  <tr>
                    <td style="padding:12px 24px 18px 24px;background:#ffffff;">
                      <div style="background:#fbfcfd;border:1px solid #eef2f6;border-radius:6px;padding:16px;">
                        <div style="color:#111827;font-size:15px;line-height:1.6;white-space:pre-wrap;">
                          ${(message || '').replace(/\n/g,'<br/>')}
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Attachment (optional) -->
                  ${ normalizedAttachment ? `
                  <tr>
                    <td style="padding:12px 24px 18px 24px;background:#ffffff;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius:6px;border:1px solid #e6eef6;background:#fbfeff;">
                        <tr>
                          <td style="padding:12px 14px;vertical-align:middle;">
                            <div style="display:flex;align-items:center;gap:12px;">
                              <div style="width:36px;height:36px;border-radius:6px;background:#eef7fb;display:flex;align-items:center;justify-content:center;color:#0b6fb1;font-weight:700;font-size:14px;">📎</div>
                              <div style="flex:1">
                                <div style="font-size:14px;color:#0b6fb1;font-weight:600;">${normalizedAttachment.filename}</div>
                                <div style="font-size:13px;color:#4b5563;margin-top:4px;">Click the button to download the attachment.</div>
                              </div>
                              <td align="right" style="vertical-align:middle;padding-left:12px;">
                                ${ attachmentUrl ? `
                                <a href="${attachmentUrl}" style="display:inline-block;padding:9px 12px;border-radius:6px;background:#0b74c3;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;">
                                  Download
                                </a>
                                ` : `
                                <span style="display:inline-block;padding:8px 10px;border-radius:6px;background:#e6eaf0;color:#374151;font-size:13px;">Attached</span>
                                `}
                              </td>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>` : '' }

                  <!-- Footer -->
                  <tr>
                    <td style="padding:18px 24px 20px 24px;background:#ffffff;border-top:1px solid #f1f5f9;">
                      <div style="font-size:13px;color:#6b7280;">
                        <div style="font-weight:600;color:#111111;">Elite Hostel Management</div>
                        <div style="margin-top:6px;">support@elitehostel.com | +233-555-0000</div>
                        <div style="margin-top:10px;font-size:12px;color:#9aa0a6;">This is an official notice from the hostel administration. If this message was sent to you by mistake, please contact the administration.</div>
                      </div>
                    </td>
                  </tr>

                </table>
                <!-- /container -->
              </td>
            </tr>
          </table>
        </body>
      </html>

      `
    };

    if (normalizedAttachment) {
      // ensure we don't pass huge or invalid content accidentally
      if (normalizedAttachment.encoding) {
        mailOptions.attachments = [{
          filename: normalizedAttachment.filename,
          content: normalizedAttachment.content,
          encoding: normalizedAttachment.encoding,
          contentType: normalizedAttachment.contentType
        }];
      } else {
        // content should be Buffer or string
        mailOptions.attachments = [{
          filename: normalizedAttachment.filename,
          content: normalizedAttachment.content,
          contentType: normalizedAttachment.contentType
        }];
      }
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Batch ${i + 1} sent:`, info && (info.messageId || info.response) || 'ok');
      totalSent += batch.length;
      results.push({ batchIndex: i + 1, success: true, recipientCount: batch.length, info });
    } catch (error) {
      console.error(`Error sending notice to batch ${i + 1}:`, error);
      totalFailed += batch.length;
      results.push({ batchIndex: i + 1, success: false, error: error.message || error, recipientCount: batch.length });
    }

    // delay between batches
    if (i < emailBatches.length - 1) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  const summary = {
    success: totalSent > 0,
    totalRecipients: studentEmails.length,
    totalSent,
    totalFailed,
    batches: emailBatches.length,
    results
  };

  if (totalFailed > 0) console.warn(`Notice sending completed with errors: ${totalSent} sent, ${totalFailed} failed`);
  else console.log(`Notice sent successfully to all ${totalSent} students`);

  return summary;
};

const sendVerificationEmail = async (to, fullName, verifyUrl) => {
  const displayName = fullName || 'there';
  const mailOptions = {
    from: '"Elite Hostel" <noreply@elitehostel.com>',
    to,
    subject: 'Verify your email address',
    html: `
     <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Elite Hostel Management</title>
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
              font-size: 16px;
            }
            .button-container {
              text-align: center;
              margin: 32px 0;
            }
            .verify-button {
              display: inline-block;
              background-color: #16a34a;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-size: 16px;
              font-weight: 600;
              border: none;
              transition: background-color 0.2s ease;
            }
            .verify-button:hover {
              background-color: #15803d;
            }
            .fallback-section {
              background: #f8fafc;
              padding: 20px;
              border-radius: 6px;
              margin: 24px 0;
              border: 1px solid #e5e7eb;
            }
            .fallback-text {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 12px;
            }
            .fallback-url {
              font-size: 12px;
              color: #16a34a;
              word-break: break-all;
              font-family: 'Courier New', monospace;
              background: white;
              padding: 8px;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .expiry-notice {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 16px;
              margin: 24px 0;
              text-align: center;
            }
            .expiry-notice p {
              margin: 0;
              font-size: 14px;
              color: #92400e;
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
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">ELITE HOSTEL MANAGEMENT</div>
              <div class="brand-subtitle">A Home Close For Your Academic Success</div>
              <h2>Verify Your Email</h2>
            </div>
            
            <div class="content">
              <p>Hello <strong>${displayName}</strong>,</p>
              
              <p>Welcome to Elite Hostel Management! Thanks for registering with us.</p>
              
              <p>To complete your registration and access your account, please confirm this is your email address by clicking the button below:</p>
              
              <div class="button-container">
                <a href="${verifyUrl}" class="verify-button">Verify My Email</a>
              </div>
              
              <div class="fallback-section">
                <p class="fallback-text">If the button doesn't work, copy and paste this URL into your browser:</p>
                <div class="fallback-url">${verifyUrl}</div>
              </div>
              
              <div class="expiry-notice">
                <p><strong>Important:</strong> This verification link will expire in 24 hours for security purposes.</p>
              </div>
              
              <p>Once verified, you'll be able to log in and start using all the features of our hostel management system.</p>
            </div>
            
            <div class="footer">
              <div class="brand-footer">Elite Hostel Management</div>
              <div class="tagline">"A Home Close For Your Academic Success"</div>
              <div class="contact">
                support@elitehostel.com | +233-555-0000
              </div>
            </div>
          </div>
        </body>
        </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendNoticeToStudents,
  sendVerificationEmail
};