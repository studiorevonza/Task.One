const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { authenticateToken } = require('../middleware/auth');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    tls: {
        rejectUnauthorized: false
    },
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Add timeout configuration for Render deployment
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
});

// @route   POST api/notifications/email
// @desc    Send email notification
// @access  Protected
router.post('/email', authenticateToken, async (req, res) => {
    const { to, subject, body, taskTitle } = req.body;

    if (!to || !subject || !body) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        // Check if email configuration exists
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('Email service not configured - skipping email send');
            return res.json({ 
                success: true, 
                message: 'Notification processed (email service not configured)', 
                messageId: 'mock-id-' + Date.now() 
            });
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || '"TASQ.ONE Neural Sync" <notifications@tasq.one>',
            to: to,
            subject: subject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px;">
                    <h2 style="color: #0f172a; font-weight: 800; letter-spacing: -0.025em; font-size: 24px;">Neural Sync Alert</h2>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Your workspace has detected an urgent operational requirement.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #6366f1;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Target Unit</p>
                        <p style="margin: 5px 0; font-size: 18px; color: #1e293b; font-weight: 800;">${taskTitle || 'Task Update'}</p>
                    </div>

                    <p style="color: #334155; font-size: 15px;">${body}</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                        <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">TASQ.ONE NEURAL COMMAND CENTER</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Message sent: %s', info.messageId);

        res.json({ success: true, messageId: info.messageId, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
    }
});

module.exports = router;
