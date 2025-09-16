import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

interface AlertRequest {
  userEmail: string;
  userName: string;
  zoneName: string;
  violationType: 'enter' | 'exit';
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  zoneType: 'safe' | 'restricted' | 'warning';
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
      userEmail,
      userName,
      zoneName,
      violationType,
      location,
      timestamp,
      zoneType
    }: AlertRequest = req.body;

    // Validate required fields
    if (!userEmail || !userName || !zoneName || !violationType || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Missing email configuration:', {
        GMAIL_USER: !!process.env.GMAIL_USER,
        GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD
      });
      return res.status(500).json({ 
        message: 'Email service not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local' 
      });
    }

    // Create transporter using environment variables
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

    // Test the connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP connection failed:', verifyError);
      return res.status(500).json({
        message: 'Email service connection failed',
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        hint: 'Check your Gmail credentials and app password'
      });
    }

    // Determine alert severity and styling
    const isRestricted = zoneType === 'restricted';
    const alertColor = isRestricted ? '#EF4444' : zoneType === 'warning' ? '#F59E0B' : '#10B981';
    const alertIcon = isRestricted ? '🚨' : zoneType === 'warning' ? '⚠️' : 'ℹ️';
    const priority = isRestricted ? 'HIGH' : zoneType === 'warning' ? 'MEDIUM' : 'LOW';

    // Create email content
    const subject = `${alertIcon} Geofence Alert: ${userName} ${violationType === 'enter' ? 'Entered' : 'Exited'} ${zoneName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Geofence Alert</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: ${alertColor}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${alertIcon} Geofence Alert</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Priority: ${priority}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: #1e293b; margin: 0 0 10px 0;">${userName}</h2>
              <p style="color: ${alertColor}; font-size: 18px; font-weight: bold; margin: 0;">
                ${violationType === 'enter' ? 'ENTERED' : 'EXITED'} ${zoneName.toUpperCase()}
              </p>
            </div>
            
            <!-- Alert Details -->
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${alertColor};">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Alert Details</h3>
              
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">User:</span>
                  <span style="color: #1f2937; font-weight: bold;">${userName}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Zone:</span>
                  <span style="color: #1f2937; font-weight: bold;">${zoneName}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Zone Type:</span>
                  <span style="color: ${alertColor}; font-weight: bold; text-transform: uppercase;">${zoneType}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Action:</span>
                  <span style="color: #1f2937; font-weight: bold;">${violationType === 'enter' ? 'ENTERED' : 'EXITED'}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Location:</span>
                  <span style="color: #1f2937; font-weight: bold;">${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Time:</span>
                  <span style="color: #1f2937; font-weight: bold;">${new Date(timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <!-- Map Link -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="https://www.google.com/maps?q=${location.lat},${location.lng}" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📍 View Location on Map
              </a>
            </div>
            
            ${isRestricted ? `
            <!-- Security Notice for Restricted Areas -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <h4 style="color: #dc2626; margin: 0 0 8px 0; font-size: 14px;">🔒 SECURITY ALERT</h4>
              <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                This is a restricted area. Unauthorized access may result in security action. 
                Please ensure the user has proper authorization to be in this zone.
              </p>
            </div>
            ` : ''}
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">
                This alert was generated by the Admin Portal Geofence System
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Generated on ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
GEOFENCE ALERT - ${priority} PRIORITY

User: ${userName}
Action: ${violationType.toUpperCase()} ${zoneName}
Zone Type: ${zoneType.toUpperCase()}
Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
Time: ${new Date(timestamp).toLocaleString()}

${isRestricted ? 'SECURITY ALERT: This is a restricted area. Unauthorized access may require security action.' : ''}

View location: https://www.google.com/maps?q=${location.lat},${location.lng}

Generated by Admin Portal Geofence System
    `;

    // Send email
    const mailOptions = {
      from: `"Geofence Alert System" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      priority: (isRestricted ? 'high' : 'normal') as 'high' | 'normal' | 'low',
    };

    console.log('🔄 Attempting to send email to:', userEmail);
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', userEmail);

    res.status(200).json({ 
      message: 'Alert email sent successfully',
      recipient: userEmail,
      subject: subject,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending email alert:', error);
    
    // More detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as unknown as { code?: string })?.code,
      command: (error as unknown as { command?: string })?.command,
      response: (error as unknown as { response?: string })?.response
    };
    
    res.status(500).json({ 
      message: 'Failed to send alert email',
      error: errorDetails,
      recipient: req.body.userEmail,
      troubleshooting: {
        checkEmailConfig: 'Verify GMAIL_USER and GMAIL_APP_PASSWORD in .env.local',
        checkAppPassword: 'Ensure you use Gmail App Password, not regular password',
        checkTwoFactor: 'Enable 2-Factor Authentication in Google Account'
      }
    });
  }
}