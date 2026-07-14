const nodemailer = require('nodemailer');

/**
 * Send an email using SMTP configurations from environment variables.
 * @param {Object} options Options containing destination, subject, message, and html content.
 */
const sendEmail = async (options) => {
  // Create transporter using SMTP config from .env
  const config = {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: parseInt(process.env.SMTP_PORT || '2525', 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your_smtp_username',
      pass: process.env.SMTP_PASS || 'your_smtp_password',
    },
  };
  
  // If a specific service like 'gmail' is provided in env
  if (process.env.SMTP_SERVICE) {
    config.service = process.env.SMTP_SERVICE;
    delete config.host;
    delete config.port;
    delete config.secure;
  }

  const transporter = nodemailer.createTransport(config);

  // Default premium HTML layout if none is provided
  const htmlTemplate = options.html || `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Smart Expense Tracker</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8fafc;
          color: #1e293b;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #4f46e5;
          text-decoration: none;
          letter-spacing: -0.025em;
        }
        .card {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          border: 1px solid #e2e8f0;
        }
        h1 {
          font-size: 22px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 16px;
          color: #0f172a;
          text-align: center;
        }
        p {
          font-size: 16px;
          line-height: 24px;
          color: #475569;
          margin-bottom: 24px;
        }
        .otp-container {
          background-color: #f1f5f9;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin: 32px 0;
          border: 1px dashed #cbd5e1;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #4f46e5;
          margin: 0;
        }
        .expiry-text {
          font-size: 14px;
          color: #dc2626;
          font-weight: 500;
          margin-top: 8px;
          margin-bottom: 0;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
          line-height: 20px;
        }
        .footer a {
          color: #6366f1;
          text-decoration: none;
        }
        .security-note {
          border-top: 1px solid #f1f5f9;
          margin-top: 32px;
          padding-top: 24px;
          font-size: 13px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="#" class="logo">Smart Expense Tracker</a>
        </div>
        <div class="card">
          <h1>Password Reset Request</h1>
          <p>Hello,</p>
          <p>We received a request to reset the password associated with your account. Use the following One-Time Password (OTP) code to verify your request:</p>
          
          <div class="otp-container">
            <div class="otp-code">${options.otp}</div>
            <p class="expiry-text">This code is valid for 10 minutes only.</p>
          </div>
          
          <p>If you did not request a password reset, please ignore this email or contact our support team if you have any questions.</p>
          
          <div class="security-note">
            <strong>Security Reminder:</strong> Never share this OTP code with anyone. Our support team will never ask for your password or OTP.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Smart Expense Tracker. All rights reserved.</p>
          <p>If you're having trouble, please contact <a href="mailto:support@smart-expense-tracker.com">support@smart-expense-tracker.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Smart Expense Tracker'}" <${process.env.SMTP_FROM || 'alerts@smart-expense-tracker.com'}>`,
    to: options.email,
    subject: options.subject || 'Password Reset OTP - Smart Expense Tracker',
    text: options.message || `Your password reset OTP is ${options.otp}. It is valid for 10 minutes.`,
    html: htmlTemplate,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
