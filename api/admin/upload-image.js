const { put } = require('@vercel/blob');
const { isAuthenticated } = require('../_lib/admin-auth');

function sanitizeFilename(filename) {
  const safe = String(filename || 'upload')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return safe || 'upload';
}

function validateContentType(contentType) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return allowed.includes(contentType);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'Missing required environment variable: BLOB_READ_WRITE_TOKEN' });
  }

  try {
    const filename = sanitizeFilename(req.body?.filename || 'upload');
    const contentType = req.body?.contentType || '';
    const dataBase64 = req.body?.dataBase64 || '';

    if (!validateContentType(contentType)) {
      return res.status(400).json({ error: 'Unsupported file type. Use JPG, PNG, WEBP, or GIF.' });
    }

    if (!dataBase64 || typeof dataBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing image data.' });
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    const maxBytes = 8 * 1024 * 1024;
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Image data is empty.' });
    }
    if (buffer.length > maxBytes) {
      return res.status(400).json({ error: 'Image is too large. Max upload size is 8MB.' });
    }

    const path = `uploads/${Date.now()}-${filename}`;
    const blob = await put(path, buffer, {
      token,
      access: 'public',
      addRandomSuffix: false,
      contentType,
    });

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to upload image.' });
  }
};

