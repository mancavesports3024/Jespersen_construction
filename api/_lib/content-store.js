const { cloneDefaultContent } = require('../../data/default-content');

const CONTENT_BLOB_PATH = 'site-content.json';
const PRIVATE_SEARCH_BLOB_PATH = 'admin/search-results.json';
const PUBLIC_CONTENT_KEYS = ['services', 'portfolio', 'about'];
const PUBLIC_BLOB_TOKEN_ENV = 'BLOB_READ_WRITE_TOKEN';
const PRIVATE_BLOB_TOKEN_ENV = 'PRIVATE_BLOB_READ_WRITE_TOKEN';

let blobClientOverride = null;

function getBlobClient() {
  if (blobClientOverride) return blobClientOverride;
  return require('@vercel/blob');
}

function __setBlobClientForTests(client) {
  blobClientOverride = client;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asTrimmedString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isMissingBlob(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('not found') || error?.name === 'BlobNotFoundError';
}

function normalizeContent(input) {
  const defaults = cloneDefaultContent();
  const raw = input && typeof input === 'object' ? input : {};

  return {
    services: {
      eyebrow: asTrimmedString(raw.services?.eyebrow, defaults.services.eyebrow),
      heading: asTrimmedString(raw.services?.heading, defaults.services.heading),
      description: asTrimmedString(raw.services?.description, defaults.services.description),
      items: asArray(raw.services?.items)
        .slice(0, 12)
        .map((item, index) => {
          const defItem = defaults.services.items[index % defaults.services.items.length] || {};
          const allowedIcons = ['deck', 'siding', 'remodel', 'storm'];
          return {
            icon: allowedIcons.includes(item?.icon) ? item.icon : defItem.icon || 'remodel',
            title: asTrimmedString(item?.title, `Service ${index + 1}`),
            description: asTrimmedString(item?.description, ''),
            link: asTrimmedString(item?.link, defItem.link || ''),
            linkLabel: asTrimmedString(item?.linkLabel, defItem.linkLabel || 'Learn more'),
          };
        })
        .filter((item) => item.title || item.description),
    },
    portfolio: {
      eyebrow: asTrimmedString(raw.portfolio?.eyebrow, defaults.portfolio.eyebrow),
      heading: asTrimmedString(raw.portfolio?.heading, defaults.portfolio.heading),
      description: asTrimmedString(raw.portfolio?.description, defaults.portfolio.description),
      items: asArray(raw.portfolio?.items)
        .slice(0, 24)
        .map((item, index) => ({
          title: asTrimmedString(item?.title, `Project ${index + 1}`),
          subtitle: asTrimmedString(item?.subtitle, ''),
          imageUrl: asTrimmedString(item?.imageUrl, defaults.portfolio.items[index % defaults.portfolio.items.length].imageUrl),
        }))
        .filter((item) => item.title || item.subtitle || item.imageUrl),
    },
    about: {
      eyebrow: asTrimmedString(raw.about?.eyebrow, defaults.about.eyebrow),
      heading: asTrimmedString(raw.about?.heading, defaults.about.heading),
      body: asTrimmedString(raw.about?.body, defaults.about.body),
      features: asArray(raw.about?.features)
        .slice(0, 12)
        .map((item) => asTrimmedString(item))
        .filter(Boolean),
      stats: asArray(raw.about?.stats)
        .slice(0, 8)
        .map((item) => ({
          value: asTrimmedString(item?.value),
          label: asTrimmedString(item?.label),
        }))
        .filter((item) => item.value || item.label),
    },
    searchResults: {
      title: asTrimmedString(raw.searchResults?.title, defaults.searchResults.title),
      description: asTrimmedString(raw.searchResults?.description, defaults.searchResults.description),
      rows: asArray(raw.searchResults?.rows)
        .slice(0, 100)
        .map((item) => ({
          query: asTrimmedString(item?.query),
          clicks: asTrimmedString(item?.clicks),
          impressions: asTrimmedString(item?.impressions),
          position: asTrimmedString(item?.position),
          notes: asTrimmedString(item?.notes),
        }))
        .filter((item) => item.query || item.clicks || item.impressions || item.position || item.notes),
    },
  };
}

function toPublicContent(content) {
  return {
    services: clone(content.services),
    portfolio: clone(content.portfolio),
    about: clone(content.about),
  };
}

function assertPublicPayload(content) {
  const keys = Object.keys(content);
  const extra = keys.filter((key) => !PUBLIC_CONTENT_KEYS.includes(key));
  if (extra.length) {
    const error = new Error('Refusing to write non-public fields to public content.');
    error.statusCode = 500;
    throw error;
  }
}

function configurationError(message) {
  const error = new Error(message);
  error.statusCode = 503;
  return error;
}

function readToken(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function getPublicToken() {
  return readToken(PUBLIC_BLOB_TOKEN_ENV);
}

function getPrivateToken() {
  return readToken(PRIVATE_BLOB_TOKEN_ENV);
}

function assertDistinctStoreTokens(publicToken, privateToken) {
  if (publicToken && privateToken && publicToken === privateToken) {
    throw configurationError(
      `${PRIVATE_BLOB_TOKEN_ENV} must be a separate private-store token, not ${PUBLIC_BLOB_TOKEN_ENV}. No Blob data was written.`
    );
  }
}

async function readBlobStream(stream) {
  if (!stream) return '';
  if (typeof stream.getReader === 'function') {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).toString('utf8');
  }

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function loadPublicRaw(token) {
  const blob = await getBlobClient().head(CONTENT_BLOB_PATH, { token });
  const response = await fetch(blob.url, { cache: 'no-store' });
  if (!response.ok) {
    const error = new Error(
      response.status === 404 ? 'Blob not found' : `Unable to read saved content: ${response.status}`
    );
    error.statusCode = response.status;
    throw error;
  }
  return response.json();
}

async function loadPrivateSearchResults(token) {
  try {
    const result = await getBlobClient().get(PRIVATE_SEARCH_BLOB_PATH, {
      access: 'private',
      token,
      useCache: false,
    });
    if (!result || !result.stream) return null;
    const parsed = JSON.parse(await readBlobStream(result.stream));
    return parsed?.searchResults || null;
  } catch (error) {
    if (isMissingBlob(error)) return null;
    throw error;
  }
}

async function readPublicRaw() {
  const token = getPublicToken();
  if (!token) return null;
  try {
    return await loadPublicRaw(token);
  } catch (error) {
    if (isMissingBlob(error)) return null;
    throw error;
  }
}

async function loadPublicContent() {
  const publicRaw = await readPublicRaw();
  if (!publicRaw) return toPublicContent(cloneDefaultContent());
  return toPublicContent(normalizeContent(publicRaw));
}

async function loadAdminContent() {
  const publicToken = getPublicToken();
  const privateToken = getPrivateToken();
  assertDistinctStoreTokens(publicToken, privateToken);

  const publicRaw = await readPublicRaw();
  let privateSearch = null;
  if (privateToken) {
    privateSearch = await loadPrivateSearchResults(privateToken);
  }

  const merged = publicRaw && typeof publicRaw === 'object' ? { ...publicRaw } : {};
  if (privateSearch) merged.searchResults = privateSearch;
  if (!publicRaw && !privateSearch) return cloneDefaultContent();
  return normalizeContent(merged);
}

async function saveContent(input) {
  const publicToken = getPublicToken();
  const privateToken = getPrivateToken();
  if (!publicToken) {
    throw configurationError(
      `Missing required environment variable: ${PUBLIC_BLOB_TOKEN_ENV}. Nothing was saved.`
    );
  }
  if (!privateToken) {
    throw configurationError(
      `Missing required environment variable: ${PRIVATE_BLOB_TOKEN_ENV}. Admin notes were not written to the public store, and public content was not changed.`
    );
  }
  assertDistinctStoreTokens(publicToken, privateToken);

  const normalized = normalizeContent(input);
  const publicContent = toPublicContent(normalized);
  assertPublicPayload(publicContent);
  const privateContent = { searchResults: clone(normalized.searchResults) };
  const blob = getBlobClient();

  // Private store first. A failure here leaves the public object, including any legacy notes, unchanged.
  await blob.put(PRIVATE_SEARCH_BLOB_PATH, JSON.stringify(privateContent, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    token: privateToken,
  });

  try {
    await blob.put(CONTENT_BLOB_PATH, JSON.stringify(publicContent, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json; charset=utf-8',
      token: publicToken,
    });
  } catch (error) {
    const wrapped = new Error(
      `Admin notes were saved in the private store, but public content was not updated. ${error.message} Save again after the public store is available. Do not delete the private object.`
    );
    wrapped.statusCode = error.statusCode || 500;
    throw wrapped;
  }

  return normalized;
}

module.exports = {
  CONTENT_BLOB_PATH,
  PRIVATE_BLOB_TOKEN_ENV,
  PRIVATE_SEARCH_BLOB_PATH,
  PUBLIC_BLOB_TOKEN_ENV,
  PUBLIC_CONTENT_KEYS,
  __setBlobClientForTests,
  loadAdminContent,
  loadPublicContent,
  normalizeContent,
  saveContent,
  toPublicContent,
};
