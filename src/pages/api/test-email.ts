import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Check environment variables
    console.log('🔍 Checking email configuration...');
    console.log('GMAIL_USER exists:', !!process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        message: 'Email service not configured',
        missing: {
          GMAIL_USER: !process.env.GMAIL_USER,
          GMAIL_APP_PASSWORD: !process.env.GMAIL_APP_PASSWORD
        }
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    console.log('🔗 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    const mailOptions = {
      from: {
        name: 'SIH 2025 Admin Portal',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: '✅ Email Test - SIH 2025 Admin Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10B981; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">✅ Email Test Successful!</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #1f2937;">Congratulations!</h2>
            <p>Your email configuration is working correctly.</p>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>From: ${process.env.GMAIL_USER}</li>
              <li>To: ${email}</li>
              <li>Time: ${new Date().toLocaleString()}</li>
            </ul>
            <p style="color: #10B981; font-weight: bold;">Your geofence email alerts should now work properly!</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
            <p>SIH 2025 Admin Portal - Geofence Alert System</p>
          </div>
        </body>
        </html>
      `
    };

    console.log('📧 Sending test email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      recipient: email,
      from: process.env.GMAIL_USER,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    const errorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      command: (error as any)?.command
    };

    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: errorInfo,
      troubleshooting: [
        'Check if GMAIL_USER and GMAIL_APP_PASSWORD are set in .env.local',
        'Ensure GMAIL_USER is a valid Gmail address',
        'Ensure GMAIL_APP_PASSWORD is a 16-character app password (not regular password)',
        'Make sure 2-Factor Authentication is enabled on your Google account',
        'Check if Gmail account allows less secure apps (or use App Password)'
      ]
    });
  }
}