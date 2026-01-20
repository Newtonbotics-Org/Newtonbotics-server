const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const from = process.env.EMAIL_FROM || 'no-reply@example.com';
const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

let transporter = null;

function normalizeSmtpPass(pass) {
  if (!pass) return pass;
  // Gmail app passwords are often shown with spaces; SMTP auth expects the raw value.
  return String(pass).replace(/\s+/g, '');
}

function getTransporter() {
  if (transporter) return transporter;
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
    const user = process.env.SMTP_USER;
    const pass = normalizeSmtpPass(process.env.SMTP_PASS);

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      // Gmail on 587 typically requires STARTTLS.
      requireTLS: !secure && port === 587,
      auth: user ? { user, pass } : undefined,
    });
    return transporter;
  } catch (err) {
    logger.error('Email transporter init failed:', err);
    return null;
  }
}

async function sendEmail({ to, subject, html, text }) {
  const tx = getTransporter();
  if (!tx) {
    logger.warn('Email transporter not configured. Logging email instead.');
    logger.info(`EMAIL to=${to} subject=${subject}\n${text || html}`);
    return { mocked: true };
  }
  try {
    const info = await tx.sendMail({ from, to, subject, html, text });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    // Normalize common SMTP auth failures to a more actionable message.
    if (err && (err.code === 'EAUTH' || err.responseCode === 535)) {
      const isGmail = String(process.env.SMTP_HOST || '').includes('gmail');
      const hint = isGmail
        ? 'Gmail rejected the login. Use a Gmail App Password (requires 2‑Step Verification) and set it as SMTP_PASS.'
        : 'SMTP authentication failed. Check SMTP_USER/SMTP_PASS.';
      logger.error(`${hint} ${err.message || err}`);
      const e = new Error(hint);
      e.code = 'EMAIL_AUTH_FAILED';
      throw e;
    }
    throw err;
  }
}

function buildHtml(title, body) {
  return `
  <div style="font-family:Inter,Arial,sans-serif; max-width:640px; margin:0 auto;">
    <h2 style="color:#111827;">${title}</h2>
    <div style="color:#374151; line-height:1.6;">${body}</div>
    <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />
    <div style="color:#6b7280; font-size:12px;">This is an automated message from NewtonBotics.</div>
  </div>`;
}

async function sendPasswordResetEmail({ email, token }) {
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Reset your NewtonBotics password';
  const html = buildHtml('Reset your password', `
    <p>We received a request to reset your password.</p>
    <p><a href="${link}">Click here to reset your password</a>. This link will expire in 1 hour.</p>
  `);
  const text = `Reset your password: ${link}`;
  return sendEmail({ to: email, subject, html, text });
}

async function sendPasswordResetOtpEmail({ email, otp }) {
  const subject = 'Your NewtonBotics password reset code';
  const html = buildHtml('Password reset code', `
    <p>Use the following one-time code to reset your password:</p>
    <p style="font-size:24px; letter-spacing:4px; font-weight:700; color:#111827;">${otp}</p>
    <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
  `);
  const text = `Your password reset code is: ${otp} (expires in 10 minutes)`;
  return sendEmail({ to: email, subject, html, text });
}

async function sendRoleAssignedEmail({ email, fullName, role }) {
  const subject = 'Your NewtonBotics role has been updated';
  const html = buildHtml('Role updated', `
    <p>Hello ${fullName || ''},</p>
    <p>Your role has been updated to <strong>${role}</strong>. You now have access to additional features.</p>
  `);
  const text = `Your role has been updated to ${role}.`;
  return sendEmail({ to: email, subject, html, text });
}

async function sendContactAcknowledgement({ name, email }) {
  const subject = 'We received your message';
  const html = buildHtml('Thanks for contacting NewtonBotics', `
    <p>Hi ${name || ''},</p>
    <p>We have received your message and will get back to you shortly.</p>
  `);
  const text = `Hi ${name || ''}, we received your message and will reply soon.`;
  return sendEmail({ to: email, subject, html, text });
}

async function sendContactNotificationToAdmin({ subject: sub, name, email, message, phone, category }) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || from;
  const subject = `[Contact] ${sub} from ${name}`;
  const html = buildHtml('New contact submission', `
    <p><strong>From:</strong> ${name} (${email})</p>
    <p><strong>Subject:</strong> ${sub}</p>
    <p><strong>Category:</strong> ${category || 'General'}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `);
  const text = `From: ${name} <${email}>, Subject: ${sub}, Category: ${category || 'General'}, Phone: ${phone || 'Not provided'}, Message: ${message}`;
  return sendEmail({ to: adminEmail, subject, html, text });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendPasswordResetOtpEmail,
  sendRoleAssignedEmail,
  sendContactAcknowledgement,
  sendContactNotificationToAdmin,
};

// Extra domain notifications
async function sendProjectCreatedNotification({ project, recipients = [] }) {
  if (!project) return;
  const subject = `New Project Created: ${project.title}`;
  const link = `${baseUrl}/projects/${project._id}`;
  const html = buildHtml('New Project Created', `
    <p><strong>${project.title}</strong> has been created.</p>
    <p>Status: ${project.status}</p>
    <p><a href="${link}">View Project</a></p>
  `);
  const text = `New project created: ${project.title} (${link})`;
  const toList = recipients.filter(Boolean);
  if (toList.length === 0) return;
  return sendEmail({ to: toList.join(','), subject, html, text });
}

async function sendWorkshopRegistrationEmail({ workshop, userEmail }) {
  if (!workshop || !userEmail) return;
  const subject = `Workshop Registration: ${workshop.title}`;
  const html = buildHtml('Registration Confirmed', `
    <p>You are registered for <strong>${workshop.title}</strong>.</p>
    <p>Start: ${new Date(workshop.startDate).toLocaleString()}</p>
    <p>Location: ${workshop.location || 'TBA'}</p>
  `);
  const text = `Registered for ${workshop.title}`;
  return sendEmail({ to: userEmail, subject, html, text });
}

async function sendInventoryCheckoutEmail({ equipment, userEmail, quantity, expectedReturnDate }) {
  if (!equipment || !userEmail) return;
  const subject = `Equipment Checkout: ${equipment.name}`;
  const html = buildHtml('Checkout Confirmed', `
    <p>You checked out <strong>${equipment.name}</strong> (x${quantity}).</p>
    <p>Expected return: ${new Date(expectedReturnDate).toLocaleDateString()}</p>
    <p>Location: ${equipment.location || 'Inventory Desk'}</p>
  `);
  const text = `Checked out ${equipment.name} x${quantity}. Expected return ${new Date(expectedReturnDate).toDateString()}`;
  return sendEmail({ to: userEmail, subject, html, text });
}

module.exports.sendProjectCreatedNotification = sendProjectCreatedNotification;
module.exports.sendWorkshopRegistrationEmail = sendWorkshopRegistrationEmail;
module.exports.sendInventoryCheckoutEmail = sendInventoryCheckoutEmail;

// Project status changed
async function sendProjectStatusChangedEmail({ project, oldStatus, newStatus, recipients = [] }) {
  if (!project || !oldStatus || !newStatus) return;
  const subject = `Project Status Updated: ${project.title}`;
  const link = `${baseUrl}/projects/${project._id}`;
  const html = buildHtml('Project Status Changed', `
    <p><strong>${project.title}</strong> status updated from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
    <p><a href="${link}">View Project</a></p>
  `);
  const text = `Project ${project.title} status: ${oldStatus} -> ${newStatus}. ${link}`;
  const toList = recipients.filter(Boolean);
  if (toList.length === 0) return;
  return sendEmail({ to: toList.join(','), subject, html, text });
}

// Project request status notifications
async function sendProjectRequestStatusEmail({ request, newStatus, recipientEmail }) {
  if (!request || !recipientEmail) return;
  const subject = `Project Request ${newStatus.replace('_', ' ').toUpperCase()}: ${request.title}`;
  const html = buildHtml('Project Request Update', `
    <p>Your project request <strong>${request.title}</strong> is now <strong>${newStatus}</strong>.</p>
  `);
  const text = `Your project request ${request.title} is now ${newStatus}.`;
  return sendEmail({ to: recipientEmail, subject, html, text });
}

module.exports.sendProjectStatusChangedEmail = sendProjectStatusChangedEmail;
module.exports.sendProjectRequestStatusEmail = sendProjectRequestStatusEmail;

// Newsletter campaign sending
async function sendNewsletterCampaign({ campaign, recipients, isTest = false }) {
  if (!campaign || !recipients || recipients.length === 0) {
    throw new Error('Campaign and recipients are required');
  }

  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  // Process recipients in batches to avoid overwhelming the email service
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(async (recipient) => {
      try {
        // Personalize content if needed
        let personalizedContent = campaign.content;
        let personalizedSubject = campaign.subject;
        
        if (recipient.firstName) {
          personalizedContent = personalizedContent.replace(/{{firstName}}/g, recipient.firstName);
          personalizedSubject = personalizedSubject.replace(/{{firstName}}/g, recipient.firstName);
        }
        
        if (recipient.lastName) {
          personalizedContent = personalizedContent.replace(/{{lastName}}/g, recipient.lastName);
          personalizedSubject = personalizedSubject.replace(/{{lastName}}/g, recipient.lastName);
        }

        // Add unsubscribe link
        const unsubscribeLink = `${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(recipient.email)}`;
        personalizedContent += `<br><br><hr><p style="font-size:12px; color:#666;"><a href="${unsubscribeLink}">Unsubscribe from this newsletter</a></p>`;

        const html = buildNewsletterHtml(campaign.title, personalizedContent, campaign.template);
        const text = stripHtml(personalizedContent);

        await sendEmail({
          to: recipient.email,
          subject: isTest ? `[TEST] ${personalizedSubject}` : personalizedSubject,
          html,
          text
        });

        results.sent++;
        logger.info(`Newsletter sent to ${recipient.email}`, { campaignId: campaign._id, isTest });
      } catch (error) {
        results.failed++;
        results.errors.push({ email: recipient.email, error: error.message });
        logger.error(`Failed to send newsletter to ${recipient.email}`, { 
          campaignId: campaign._id, 
          error: error.message,
          isTest 
        });
      }
    });

    // Wait for batch to complete before processing next batch
    await Promise.all(batchPromises);
    
    // Small delay between batches to be respectful to email service
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

function buildNewsletterHtml(title, content, template = 'default') {
  const baseStyles = `
    <style>
      body { font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; }
      .container { max-width: 640px; margin: 0 auto; padding: 20px; }
      .header { background: #111827; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background: white; }
      .footer { background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
      .unsubscribe { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      .unsubscribe a { color: #6b7280; text-decoration: none; }
      .unsubscribe a:hover { text-decoration: underline; }
    </style>
  `;

  const templateStyles = {
    news: `
      <style>
        .news-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .news-title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .news-meta { font-size: 14px; opacity: 0.9; }
      </style>
    `,
    announcement: `
      <style>
        .announcement-header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .announcement-title { font-size: 32px; font-weight: bold; text-transform: uppercase; }
      </style>
    `,
    event: `
      <style>
        .event-header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .event-title { font-size: 30px; font-weight: bold; }
        .event-highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
      </style>
    `,
    default: ''
  };

  const headerClass = template === 'default' ? 'header' : `${template}-header`;
  const titleClass = template === 'default' ? '' : `${template}-title`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${baseStyles}
      ${templateStyles[template] || templateStyles.default}
    </head>
    <body>
      <div class="container">
        <div class="${headerClass}">
          <h1 class="${titleClass}">${title}</h1>
          <div class="news-meta">NewtonBotics Newsletter</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This newsletter was sent by NewtonBotics</p>
          <div class="unsubscribe">
            <a href="{{unsubscribeLink}}">Unsubscribe from this newsletter</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .trim();
}

// Test newsletter sending
async function sendTestNewsletter({ campaign, testEmails }) {
  if (!campaign || !testEmails || testEmails.length === 0) {
    throw new Error('Campaign and test emails are required');
  }

  const testRecipients = testEmails.map(email => ({ email }));
  return await sendNewsletterCampaign({ campaign, recipients: testRecipients, isTest: true });
}

module.exports.sendNewsletterCampaign = sendNewsletterCampaign;
module.exports.sendTestNewsletter = sendTestNewsletter;


