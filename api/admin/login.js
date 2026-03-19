const { getRequiredEnv, safeEqual, setSessionCookie } = require('../_lib/admin-auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const adminPassword = getRequiredEnv('ADMIN_PASSWORD');
    const submittedPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!safeEqual(submittedPassword, adminPassword)) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    setSessionCookie(res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Login failed.' });
  }
};
