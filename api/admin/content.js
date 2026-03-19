const { isAuthenticated } = require('../_lib/admin-auth');
const { loadStoredContent, saveContent } = require('../_lib/content-store');
const { cloneDefaultContent } = require('../../data/default-content');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      const content = await loadStoredContent();
      return res.status(200).json(content);
    } catch (error) {
      // Never block admin login just because stored content is unavailable.
      return res.status(200).json(cloneDefaultContent());
    }
  }

  if (req.method === 'PUT') {
    try {
      const content = await saveContent(req.body);
      return res.status(200).json({ ok: true, content });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ error: error.message || 'Unable to save content.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed.' });
};
