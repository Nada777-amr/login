/**
 * Email Service using Brevo (Sendinblue) API
 * Replaces Resend for transactional email sending
 */

// Check if Brevo API key is configured
const isConfigured = (): boolean => {
  return !!process.env.BREVO_API_KEY;
};

/**
 * Send email using Brevo API
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content of the email
 * @returns Promise with success status and optional error message
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    console.log(`📧 [EMAIL SERVICE] Attempting to send email to: ${to}`);
    console.log(`📧 [EMAIL SERVICE] Subject: ${subject}`);
    
    if (!isConfigured()) {
      console.error('⚠️ BREVO_API_KEY not configured in environment variables');
      return {
        success: false,
        error: 'Email service not configured. Please add BREVO_API_KEY to .env.local',
      };
    }
    
    console.log(`✅ [EMAIL SERVICE] Brevo API key found`);

    console.log(`✅ [EMAIL SERVICE] Brevo API key found`);

    const emailPayload = {
      sender: {
        name: 'WebCraft',
        email: process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'noreply@brevo.com',
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    };
    
    console.log(`📤 [EMAIL SERVICE] Sending email with payload:`, JSON.stringify({
      sender: emailPayload.sender,
      to: emailPayload.to,
      subject: emailPayload.subject,
    }));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [EMAIL SERVICE] Brevo API error:', errorData);
      console.error(`❌ [EMAIL SERVICE] Status: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log(`✅ [EMAIL SERVICE] Email sent successfully to ${to}`, data);
    
    // Check if Brevo is in sandbox/testing mode
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ [EMAIL SERVICE] Running in development mode`);
      console.warn(`⚠️ [EMAIL SERVICE] If using Brevo free tier, emails may only be delivered to:`);
      console.warn(`   1. Your Brevo account email`);
      console.warn(`   2. Email addresses added to your Brevo contacts`);
      console.warn(`   3. Verified domain emails (requires domain verification)`);
      console.warn(`📝 [EMAIL SERVICE] If email not received, check: https://app.brevo.com/senders`);
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ [EMAIL SERVICE] Failed to send email:', error);
    console.error('❌ [EMAIL SERVICE] Error details:', error.message, error.stack);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationLink: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🔑 [VERIFICATION EMAIL] Starting verification email process for: ${email}`);
  console.log(`🔑 [VERIFICATION EMAIL] Username: ${username}`);
  console.log(`🔑 [VERIFICATION EMAIL] Verification link: ${verificationLink}`);
  
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html: getVerificationEmailTemplate(username, verificationLink),
    });
    
    console.log(`📊 [VERIFICATION EMAIL] Send result:`, result);

    if (!result.success) {
      console.error(`❌ [VERIFICATION EMAIL] Failed to send verification email to ${email}:`, result.error);
      return {
        success: false,
        error: result.error || 'Failed to send verification email',
      };
    }

    console.log(`✅ [VERIFICATION EMAIL] Verification email sent successfully to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ [VERIFICATION EMAIL] Exception caught while sending verification email:', error);
    console.error('❌ [VERIFICATION EMAIL] Error stack:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to send verification email',
    };
  }
}

/**
 * Email verification template
 */
function getVerificationEmailTemplate(username: string, link: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to Our Platform! 🎉</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px;">Hi <strong>${username}</strong>,</p>
        
        <p>Thanks for signing up! We're excited to have you on board.</p>
        
        <p>To get started, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
          <strong>Or copy and paste this link into your browser:</strong><br>
          <a href="${link}" style="color: #667eea; word-break: break-all;">${link}</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #888; font-size: 13px; margin: 5px 0;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #888; font-size: 13px; margin: 5px 0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;  
}
