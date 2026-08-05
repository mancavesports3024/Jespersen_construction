const nodemailer = require('nodemailer');

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MIN_FORM_MS = 2500;
const rateBuckets = new Map();

/** Sales/SEO pitches that are never legitimate roofing inquiries */
const SPAM_PHRASES = [
  'rank higher on google',
  'seo audit',
  'free audit',
  'quick wins',
  'without expensive',
  'pricing & examples',
  'just reply',
  'increase your traffic',
  'backlink',
  'guest post',
  'crypto',
  'bitcoin',
  'viagra',
  'casino',
  'forex',
  'make money online',
  'click here to',
  'long-term contracts',
  'rebuild is $',
  'hosting after launch',
  'no reply is needed',
  'what i found on your site',
  'nothing else stood out',
  'i won\'t keep writing',
  '$499',
  '$150 to start',
  '$349 only after',
  '$49/mo',
];

function asText(value, maxLength = 2000) {
  return String(value || '').trim().slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

function looksLikeGarbage(value) {
  const s = String(value || '').trim();
  if (s.length < 10) return false;
  if (/\s/.test(s)) return false;
  if (!/^[A-Za-z0-9]+$/.test(s)) return false;
  if (!/[A-Z]/.test(s) || !/[a-z]/.test(s)) return false;

  const vowels = (s.match(/[aeiouAEIOU]/g) || []).length;
  if (vowels / s.length < 0.18) return true;

  const transitions = (s.match(/[a-z][A-Z]/g) || []).length;
  if (s.length >= 14 && transitions >= 3 && vowels / s.length < 0.28) return true;

  return false;
}

function isSuspiciousEmail(email) {
  if (!isEmail(email)) return true;
  const local = email.split('@')[0] || '';
  const dots = (local.match(/\./g) || []).length;
  if (dots >= 4) return true;
  if (local.length > 40) return true;
  if (looksLikeGarbage(local.replace(/\./g, ''))) return true;
  return false;
}

function hasSpamContent(text) {
  const lower = String(text || '').toLowerCase();
  return SPAM_PHRASES.some((phrase) => lower.includes(phrase));
}

/** Soft-accept spam so bots stop retrying; never send email. */
function softOk(res, reason) {
  console.warn(`[spam] blocked request-service: ${reason}`);
  return res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return softOk(res, `rate_limit ip=${ip}`);
    }

    const honeypot = asText(req.body?.website, 200);
    if (honeypot) {
      return softOk(res, `honeypot ip=${ip}`);
    }

    const startedRaw = asText(req.body?._formStartedAt, 40);
    if (startedRaw) {
      const started = Number(startedRaw);
      if (Number.isFinite(started)) {
        const elapsed = Date.now() - started;
        if (elapsed >= 0 && elapsed < MIN_FORM_MS) {
          return softOk(res, `too_fast ${elapsed}ms ip=${ip}`);
        }
        if (elapsed < 0 || elapsed > 24 * 60 * 60 * 1000) {
          return softOk(res, `bad_timing ip=${ip}`);
        }
      }
    }

    const name = asText(req.body?.name, 160);
    const email = asText(req.body?.email, 320).toLowerCase();
    const phone = asText(req.body?.phone, 80);
    const message = asText(req.body?.message, 5000);

    if (!name) return res.status(400).json({ error: 'Name is required.' });
    if (!email || !isEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });

    if (isSuspiciousEmail(email)) {
      return softOk(res, `bad_email ${email} ip=${ip}`);
    }
    if (looksLikeGarbage(name.replace(/\s+/g, ''))) {
      return softOk(res, `garbage_name ip=${ip}`);
    }
    if (hasSpamContent(message) || hasSpamContent(name)) {
      return softOk(res, `spam_phrase ip=${ip}`);
    }

    const phoneDigits = (phone.match(/\d/g) || []).length;
    if (phone && phoneDigits > 0 && phoneDigits < 7) {
      return softOk(res, `bad_phone ip=${ip}`);
    }

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
