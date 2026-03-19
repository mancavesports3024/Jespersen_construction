const { google } = require('googleapis');
const { isAuthenticated } = require('../_lib/admin-auth');

function getCredentials() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const base64Json = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

  if (!rawJson && !base64Json) {
    const error = new Error(
      'Search Console is not configured. Add GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_BASE64.'
    );
    error.statusCode = 503;
    throw error;
  }

  try {
    return JSON.parse(base64Json ? Buffer.from(base64Json, 'base64').toString('utf8') : rawJson);
  } catch {
    const error = new Error('Invalid Search Console credentials. Use the full service-account JSON.');
    error.statusCode = 400;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const credentials = getCredentials();
    if (!credentials.client_email || credentials.type !== 'service_account') {
      return res.status(400).json({
        error: 'Use a Google service-account JSON key. OAuth client credentials will not work.',
      });
    }

    const siteUrl = process.env.GSC_SITE_URL;
    if (!siteUrl) {
      return res.status(503).json({
        error: 'Missing required environment variable: GSC_SITE_URL',
      });
    }

    const days = Math.min(90, Math.max(7, Number.parseInt(req.query.days || '28', 10) || 28));

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const authClient = await auth.getClient();
    const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });

    const [summaryResult, queryResult, pageResult] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: start,
          endDate: end,
          rowLimit: 1,
        },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: start,
          endDate: end,
          dimensions: ['query'],
          rowLimit: 25,
        },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: start,
          endDate: end,
          dimensions: ['page'],
          rowLimit: 25,
        },
      }),
    ]);

    const summary = summaryResult.data.rows?.[0] || {};
    const topQueries = (queryResult.data.rows || []).map((row) => ({
      query: row.keys?.[0] || '(not set)',
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0),
    }));
    const topPages = (pageResult.data.rows || []).map((row) => ({
      page: row.keys?.[0] || '(not set)',
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0),
    }));

    return res.status(200).json({
      siteUrl,
      dateRange: { start, end, days },
      summary: {
        clicks: Number(summary.clicks || 0),
        impressions: Number(summary.impressions || 0),
        ctr: Number(summary.ctr || 0),
        position: Number(summary.position || 0),
      },
      topQueries,
      topPages,
    });
  } catch (error) {
    const message = error?.message || 'Failed to fetch Search Console data.';

    if (message.includes('403') || message.includes('Forbidden')) {
      return res.status(403).json({
        error: 'Access denied. Add the service-account email as a user in Search Console.',
      });
    }

    if (message.includes('404') || message.toLowerCase().includes('not found')) {
      return res.status(404).json({
        error: 'Site not found. Make sure GSC_SITE_URL matches your Search Console property exactly.',
      });
    }

    return res.status(error.statusCode || 500).json({ error: message });
  }
};

