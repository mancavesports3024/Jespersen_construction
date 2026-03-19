const { loadStoredContent, toPublicContent } = require('./_lib/content-store');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    const content = await loadStoredContent();
    return res.status(200).json(toPublicContent(content));
  } catch (error) {
    return res.status(200).json(toPublicContent(require('../data/default-content').cloneDefaultContent()));
  }
};
