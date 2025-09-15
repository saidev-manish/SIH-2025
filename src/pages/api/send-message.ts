import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

interface MessageRequest {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  messageType?: 'info' | 'warning' | 'alert' | 'custom';
  senderEmail?: string;
  senderName?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      message,
      priority = 'normal',
      messageType = 'custom',
      senderEmail,
      senderName = 'Admin'
    }: MessageRequest = req.body;

    // Validate required fields
    if (!recipientEmail || !recipientName || !subject || !message) {
      return res.status(400).json({ 
        message: 'Missing required fields: recipientEmail, recipientName, subject, message' 
      });
    }

    // Validate environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Missing email configuration');
      return res.status(500).json({ 
        message: 'Email service not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local' 
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
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP connection failed:', verifyError);
      return res.status(500).json({
        message: 'Email service connection failed',
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      });
    }

    // Determine styling based on message type
    const getMessageStyling = (type: string) => {
      switch (type) {
        case 'alert':
          return {
            color: '#EF4444',
            icon: '🚨',
            bgColor: '#FEF2F2',
            borderColor: '#FECACA'
          };
        case 'warning':
          return {
            color: '#F59E0B',
            icon: '⚠️',
            bgColor: '#FFFBEB',
            borderColor: '#FDE68A'
          };
        case 'info':
          return {
            color: '#3B82F6',
            icon: 'ℹ️',
            bgColor: '#EFF6FF',
            borderColor: '#BFDBFE'
          };
        default:
          return {
            color: '#10B981',
            icon: '📧',
            bgColor: '#F0FDF4',
            borderColor: '#BBF7D0'
          };
      }
    };

    const styling = getMessageStyling(messageType);

    // Create email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message from Admin</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: ${styling.color}; color: white; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${styling.icon} Admin Message</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Priority: ${priority.toUpperCase()}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background: ${styling.bgColor}; border-left: 4px solid ${styling.color}; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px;">${subject}</h2>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Hello <strong>${recipientName}</strong>,
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
              <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-line;">${message}</div>
            </div>
            
            <div style="background: ${styling.bgColor}; padding: 15px; border-radius: 8px; border: 1px solid ${styling.borderColor};">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>From:</strong> ${senderName || 'SIH 2025 Admin Portal'} ${senderEmail ? `(${senderEmail})` : ''}<br>
                <strong>Sent:</strong> ${new Date().toLocaleString()}<br>
                <strong>Type:</strong> ${messageType.charAt(0).toUpperCase() + messageType.slice(1)} Message
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This message was sent from ${senderName || 'SIH 2025 Admin Portal'}
            </p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
              If you have any questions, please contact the administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Mail options
    const mailOptions = {
      from: {
        name: senderName || 'SIH 2025 Admin Portal',
        address: senderEmail || process.env.GMAIL_USER
      },
      to: recipientEmail,
      subject: `${styling.icon} ${subject}`,
      html: htmlContent,
      priority: priority as 'low' | 'normal' | 'high'
    };

    console.log('📧 Sending admin message to:', recipientEmail);
    await transporter.sendMail(mailOptions);
    console.log('✅ Admin message sent successfully!');

    res.status(200).json({
      success: true,
      message: 'Admin message sent successfully!',
      recipient: recipientEmail,
      subject: subject,
      messageType: messageType,
      priority: priority,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending admin message:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      command: (error as any)?.command,
      response: (error as any)?.response
    };
    
    res.status(500).json({
      success: false,
      message: 'Failed to send admin message',
      error: errorDetails,
      recipient: req.body.recipientEmail,
      troubleshooting: {
        checkEmailConfig: 'Verify GMAIL_USER and GMAIL_APP_PASSWORD in .env.local',
        checkAppPassword: 'Ensure you use Gmail App Password, not regular password',
        checkRecipient: 'Verify recipient email address is valid'
      }
    });
  }
}