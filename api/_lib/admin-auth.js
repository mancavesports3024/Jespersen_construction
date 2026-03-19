const crypto = require('crypto');

const COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function useSecureCookies() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=');
    if (rawName === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`);
    error.statusCode = 503;
    throw error;
  }
  return value;
}

function createSignature(payload) {
  return crypto.createHmac('sha256', getRequiredEnv('ADMIN_SECRET')).update(payload).digest('base64url');
}

function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      nonce: crypto.randomBytes(16).toString('hex'),
    })
  ).toString('base64url');

  return `${payload}.${createSignature(payload)}`;
}

function verifySessionToken(token) {
  if (!token || !token.includes('.')) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = createSignature(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) return false;
  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);

  return parts.join('; ');
}

function setSessionCookie(res) {
  const token = createSessionToken();
  res.setHeader(
    'Set-Cookie',
    serializeCookie(COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'Strict',
      secure: useSecureCookies(),
    })
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(COOKIE_NAME, '', {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'Strict',
      secure: useSecureCookies(),
    })
  );
}

function isAuthenticated(req) {
  try {
    const token = getCookieValue(req.headers.cookie || '', COOKIE_NAME);
    return verifySessionToken(token);
  } catch {
    return false;
  }
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = {
  clearSessionCookie,
  getRequiredEnv,
  isAuthenticated,
  safeEqual,
  setSessionCookie,
};
