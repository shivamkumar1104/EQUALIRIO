/**
 * Email services for Equalirio Hotel account verification and newsletters.
 */
import { Resend } from 'resend';
import config from '../config/env.js';

let resend = null;

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

const getResendClient = () => {
  if (!resend && config.email.resendApiKey) {
    resend = new Resend(config.email.resendApiKey);
  }
  return resend;
};

/**
 * Send OTP via Brevo. Falls back to Resend if Brevo is not configured.
 */
const sendEmailWithFallback = async ({ to, toName, subject, htmlContent }) => {
  // --- Try Brevo first ---
  if (config.email.brevoApiKey && config.email.brevoSenderEmail) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': config.email.brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: config.email.brevoSenderName,
          email: config.email.brevoSenderEmail,
        },
        to: toName ? [{ email: to, name: toName }] : [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (response.ok) return { provider: 'brevo' };

    const errorBody = await response.json().catch(() => ({}));
    console.warn(
      `Brevo email failed (HTTP ${response.status}): ${errorBody.message || response.statusText}. Trying Resend fallback…`
    );
  }

  // --- Fallback: Resend ---
  const client = getResendClient();
  if (!client) {
    throw new Error('No email provider configured. Set BREVO_API_KEY or RESEND_API_KEY in .env');
  }

  const { error } = await client.emails.send({
    from: config.email.from || 'Equalirio Resort <onboarding@resend.dev>',
    to: [to],
    subject,
    html: htmlContent,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return { provider: 'resend' };
};

export const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = new URL('/', config.frontendUrl);
  verificationUrl.hash = new URLSearchParams({ verifyEmail: token }).toString();
  const safeName = escapeHTML(name);

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#17352c">
      <h1 style="color:#b4975a">Welcome to EQUALIRIO</h1>
      <p>Hello ${safeName},</p>
      <p>Please verify your email address to finish creating your account.</p>
      <p><a href="${verificationUrl.toString()}" style="display:inline-block;padding:12px 20px;background:#b4975a;color:#102820;text-decoration:none;border-radius:6px">Verify email</a></p>
      <p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
    </div>
  `;

  await sendEmailWithFallback({
    to: email,
    toName: name,
    subject: 'Verify your EQUALIRIO account',
    htmlContent,
  });
};

export const sendRegistrationOtpEmail = async (email, otp) => {
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#17352c">
      <h1 style="color:#b4975a">Verify your email</h1>
      <p>Enter this code to continue creating your EQUALIRIO account:</p>
      <p style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#17352c">${otp}</p>
      <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
    </div>
  `;

  await sendEmailWithFallback({
    to: email,
    subject: 'Your EQUALIRIO registration code',
    htmlContent,
  });
};

/**
 * Sends a newsletter welcome email to a new subscriber.
 */
export const sendWelcomeEmail = async (email, name = 'Valued Guest') => {
  const client = getResendClient();
  if (!client) {
    console.warn('⚠️ Resend API key not configured — skipping welcome email.');
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: config.email.from || 'Equalirio Resort <onboarding@resend.dev>',
      to: [email],
      subject: '✨ Welcome to EQUALIRIO Privé Privilege Club',
      html: generateWelcomeHTML(name),
    });

    if (error) {
      console.error('Resend send error:', error);
      return { success: false, reason: 'send_failed', error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Resend service error:', err.message);
    return { success: false, reason: 'exception', error: err.message };
  }
};

/**
 * Sends a newsletter/info email to an existing subscriber.
 */
export const sendNewsletterEmail = async (email, name = 'Valued Guest', content = {}) => {
  const client = getResendClient();
  if (!client) {
    console.warn('⚠️ Resend API key not configured — skipping newsletter email.');
    return { success: false, reason: 'no_api_key' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: config.email.from || 'Equalirio Resort <onboarding@resend.dev>',
      to: [email],
      subject: content.subject || '🏨 Exclusive Updates from EQUALIRIO Resort & Spa',
      html: generateNewsletterHTML(name, content),
    });

    if (error) {
      console.error('Resend send error:', error);
      return { success: false, reason: 'send_failed', error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Resend service error:', err.message);
    return { success: false, reason: 'exception', error: err.message };
  }
};

// ─── HTML Templates ──────────────────────────────────────────────────────────

function generateWelcomeHTML(name) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a1f1a;font-family:'Georgia','Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;background:#0d2b23;border:1px solid rgba(196,164,106,0.3);border-radius:16px;overflow:hidden;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d2b23,#143d32);padding:40px 30px;text-align:center;border-bottom:1px solid rgba(196,164,106,0.2);">
      <h1 style="color:#c4a46a;font-size:32px;letter-spacing:8px;margin:0 0 8px 0;font-weight:normal;">EQUALIRIO</h1>
      <p style="color:rgba(196,164,106,0.7);font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0;">Resort & Spa</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 30px;">
      <h2 style="color:#ffffff;font-size:22px;font-weight:normal;margin:0 0 16px 0;">Welcome, ${name}</h2>
      <p style="color:#b0b8b5;font-size:14px;line-height:1.8;margin:0 0 24px 0;">
        You have been welcomed into the exclusive <strong style="color:#c4a46a;">Privé Privilege Club</strong> — 
        our inner circle of distinguished guests who receive first access to seasonal villa releases, 
        private culinary events, spa retreats, and bespoke travel packages.
      </p>

      <div style="background:rgba(196,164,106,0.1);border:1px solid rgba(196,164,106,0.25);border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#c4a46a;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px 0;font-weight:bold;">Your Benefits Include</p>
        <ul style="color:#b0b8b5;font-size:13px;line-height:2;margin:0;padding-left:18px;">
          <li>Early access to new villa & suite releases</li>
          <li>Exclusive seasonal culinary tasting invitations</li>
          <li>Priority spa & wellness retreat bookings</li>
          <li>Personalized guest packages & offers</li>
        </ul>
      </div>

      <p style="color:#b0b8b5;font-size:13px;line-height:1.7;margin:24px 0 0 0;">
        We look forward to crafting extraordinary moments for you.
      </p>
      <p style="color:#c4a46a;font-size:14px;margin:16px 0 0 0;font-style:italic;">
        — The Equalirio Concierge Team
      </p>
    </div>

    <!-- Footer -->
    <div style="background:rgba(0,0,0,0.3);padding:20px 30px;text-align:center;border-top:1px solid rgba(196,164,106,0.15);">
      <p style="color:rgba(255,255,255,0.4);font-size:10px;margin:0;">
        © 2026 EQUALIRIO Resort & Spa. All Rights Reserved.<br>
        100 Serenity Boulevard, Rio Bay, Paradise Coast
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateNewsletterHTML(name, content = {}) {
  const title = content.title || 'Exclusive Update from Equalirio';
  const body = content.body || 'We have exciting new offers and experiences waiting for you at our resort.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a1f1a;font-family:'Georgia','Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;background:#0d2b23;border:1px solid rgba(196,164,106,0.3);border-radius:16px;overflow:hidden;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d2b23,#143d32);padding:32px 30px;text-align:center;border-bottom:1px solid rgba(196,164,106,0.2);">
      <h1 style="color:#c4a46a;font-size:28px;letter-spacing:8px;margin:0 0 6px 0;font-weight:normal;">EQUALIRIO</h1>
      <p style="color:rgba(196,164,106,0.6);font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;">Privé Privilege Club</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 30px;">
      <p style="color:rgba(196,164,106,0.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px 0;">Dear ${name},</p>
      <h2 style="color:#ffffff;font-size:20px;font-weight:normal;margin:0 0 20px 0;">${title}</h2>
      <p style="color:#b0b8b5;font-size:14px;line-height:1.8;margin:0;">
        ${body}
      </p>
    </div>

    <!-- Footer -->
    <div style="background:rgba(0,0,0,0.3);padding:20px 30px;text-align:center;border-top:1px solid rgba(196,164,106,0.15);">
      <p style="color:rgba(255,255,255,0.4);font-size:10px;margin:0;">
        © 2026 EQUALIRIO Resort & Spa. All Rights Reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export default { sendWelcomeEmail, sendNewsletterEmail };
