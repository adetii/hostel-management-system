// test-smtp.js (improved)
require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  try {
    const host = (process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.EMAIL_PORT ?? process.env.SMTP_PORT ?? '465', 10);
    const user = (process.env.EMAIL_USERNAME || process.env.SMTP_USER || process.env.SMTP_USER || '').trim();
    const pass = (process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASS || '').trim();

    console.log('SMTP host:', host);
    console.log('SMTP port:', port, 'type:', typeof port);
    console.log('SMTP user present?', !!user);

    if (!host || !Number.isFinite(port) || !user || !pass) {
      console.error('Missing or invalid SMTP config. Please ensure EMAIL_HOST/EMAIL_PORT/EMAIL_USERNAME/EMAIL_PASSWORD (or SMTP_*) are set in .env');
      process.exit(1);
    }

    const secure = process.env.EMAIL_SECURE !== undefined
      ? process.env.EMAIL_SECURE === 'true'
      : port === 465; // default: secure if port 465

    console.log('Testing SMTP connection to', host, port, 'secure=', secure);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      logger: true,
      debug: true,
    });

    await transporter.verify();
    console.log('✅ SMTP connection OK — transporter.verify() succeeded');

    // close pooled connections (if any)
    if (typeof transporter.close === 'function') {
      transporter.close();
    }
  } catch (err) {
    console.error('SMTP test error:', err);
    process.exitCode = 1;
  }
})();
