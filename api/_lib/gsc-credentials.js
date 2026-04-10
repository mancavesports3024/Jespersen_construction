const { google } = require('googleapis');

function getServiceAccountCredentials() {
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

function getGscSiteUrl() {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) {
    const error = new Error('Missing required environment variable: GSC_SITE_URL');
    error.statusCode = 503;
    throw error;
  }
  return siteUrl;
}

async function getSearchConsoleClient() {
  const credentials = getServiceAccountCredentials();
  if (!credentials.client_email || credentials.type !== 'service_account') {
    const error = new Error('Use a Google service-account JSON key. OAuth client credentials will not work.');
    error.statusCode = 400;
    throw error;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const authClient = await auth.getClient();
  return google.searchconsole({ version: 'v1', auth: authClient });
}

module.exports = {
  getServiceAccountCredentials,
  getGscSiteUrl,
  getSearchConsoleClient,
};
