const nodemailer = require('nodemailer');

function asText(value, maxLength = 2000) {
  return String(value || '').trim().slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const name = asText(req.body?.name, 160);
    const email = asText(req.body?.email, 320).toLowerCase();
    const phone = asText(req.body?.phone, 80);
    const message = asText(req.body?.message, 5000);

    if (!name) return res.status(400).json({ error: 'Name is required.' });
    if (!email || !isEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const toEmail = process.env.RECIPIENT_EMAIL || 'Jespersenerections@gmail.com';

    if (!emailUser || !emailPassword) {
      return res.status(503).json({ error: 'Email service not configured.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    const subject = `New service request from ${name}`;
    const textBody = [
      'A new service request was submitted on the website.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || '(not provided)'}`,
      '',
      'Project Details:',
      message || '(none provided)',
      '',
      `Submitted: ${new Date().toISOString()}`,
    ].join('\n');

    const htmlBody = `
      <h2>New Service Request</h2>
      <p>A new request was submitted on the website.</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || '(not provided)')}</p>
      <p><strong>Project Details:</strong><br>${escapeHtml(message || '(none provided)').replace(/\n/g, '<br>')}</p>
      <p><strong>Submitted:</strong> ${new Date().toISOString()}</p>
    `;

    await transporter.sendMail({
      from: `"Jespersen Service Request" <${emailUser}>`,
      to: toEmail,
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to send request.' });
  }
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

