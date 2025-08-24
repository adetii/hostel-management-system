const nodemailer = require('nodemailer');

// Create transporter using Mailtrap SMTP
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_SMTP_USER,
    pass: process.env.MAILTRAP_SMTP_PASS
  },
  // Add pool and rate limiting options
  pool: true,
  maxConnections: 3,
  maxMessages: 10,
  rateDelta: 20000, // 20 seconds
  rateLimit: 5 // max 5 emails per rateDelta
});

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: '"Hostel Management System" <noreply@hostelmanagement.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">You requested a password reset for your Hostel Management System account. Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s ease;
          ">Reset Password</a>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.5;">This link will expire in 10 minutes for security purposes.</p>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Hostel Management System</p>
      </div>
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

// Utility function to add delay between operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Send notice email to all students with batching and throttling
// Function: sendNoticeToStudents
const sendNoticeToStudents = async (studentEmails, subject, message, attachment = null, attachmentUrl = null) => {
  if (!Array.isArray(studentEmails)) {
    studentEmails = [studentEmails];
  }

  // Mailtrap free plan limits: 100 emails per month, rate limiting applies
  const BATCH_SIZE = 10; // Send to max 10 recipients per batch
  const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay between batches
  
  const emailBatches = chunkArray(studentEmails, BATCH_SIZE);
  const results = [];
  let totalSent = 0;
  let totalFailed = 0;

  console.log(`Sending notice to ${studentEmails.length} students in ${emailBatches.length} batches`);

  for (let i = 0; i < emailBatches.length; i++) {
    const batch = emailBatches[i];
    
    const mailOptions = {
      from: '"Hostel Management System" <noreply@hostelmanagement.com>',
      bcc: batch, // Send to batch of emails
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 15px;
              ">📢 NOTICE</div>
              <h1 style="color: #333; margin: 0; font-size: 24px;">${subject}</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="color: #555; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
            </div>
            
            ${attachment ? `
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <div style="display: flex; align-items: center; color: #1976d2; margin-bottom: 10px;">
                <svg style="width: 20px; height: 20px; margin-right: 8px;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <span style="font-weight: bold;">📎 Attachment: ${attachment.originalname}</span>
              </div>
              <div style="margin-top: 10px; font-size: 13px; color: #333;">
                This email includes the attachment "${attachment.originalname}". You can download it directly from your email client.
              </div>
            </div>
            ` : ''}
            
            <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">
                <strong>Hostel Management System</strong><br>
                This is an official notice from the hostel administration.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you have any questions, please contact the hostel administration.
            </p>
          </div>
        </div>
      `
    };

    // Add attachment if provided
    if (attachment) {
      mailOptions.attachments = [{
        filename: attachment.originalname,
        content: attachment.buffer,
        contentType: attachment.mimetype
      }];
    }

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Notice sent successfully to ${batch.length} students${attachment ? ' with attachment' : ''}`);
      totalSent += batch.length;
      results.push({ 
        batchIndex: i + 1, 
        success: true, 
        recipientCount: batch.length,
        emails: batch 
      });
    } catch (error) {
      console.error(`Error sending notice to batch ${i + 1}:`, error);
      totalFailed += batch.length;
      results.push({ 
        batchIndex: i + 1, 
        success: false, 
        error: error.message,
        recipientCount: batch.length,
        emails: batch 
      });
    }

    // Add delay between batches (except for the last batch)
    if (i < emailBatches.length - 1) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before sending next batch...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  // Return comprehensive results
  const summary = {
    success: totalSent > 0,
    totalRecipients: studentEmails.length,
    totalSent,
    totalFailed,
    batches: emailBatches.length,
    results
  };

  if (totalFailed > 0) {
    console.warn(`Notice sending completed with errors: ${totalSent} sent, ${totalFailed} failed`);
  } else {
    console.log(`Notice sent successfully to all ${totalSent} students`);
  }

  return summary;
};

module.exports = {
  sendPasswordResetEmail,
  sendNoticeToStudents
};