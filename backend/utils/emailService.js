const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log('✅ Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // In development, we don't want to crash if email fails, but we should know
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Mailing failed. Check your SMTP credentials in .env');
    }
    throw error;
  }
};

const sendResetPasswordEmail = async (email, name, resetUrl) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">TASK.ONE</h1>
      </div>
      <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 700; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">Hi ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">We received a request to reset your password for your Task.One account. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);">Reset Password</a>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.</p>
      </div>
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">
        &copy; 2026 Task.One. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your Task.One password',
    html,
  });
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail
};
