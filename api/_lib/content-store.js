const { head, put } = require('@vercel/blob');
const { cloneDefaultContent } = require('../../data/default-content');

const CONTENT_BLOB_PATH = 'site-content.json';

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
        .map((item, index) => ({
          icon: ['deck', 'siding', 'remodel'].includes(item?.icon) ? item.icon : defaults.services.items[index % defaults.services.items.length].icon,
          title: asTrimmedString(item?.title, `Service ${index + 1}`),
          description: asTrimmedString(item?.description, ''),
        }))
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

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

async function loadStoredContent() {
  const token = getBlobToken();
  if (!token) {
    return cloneDefaultContent();
  }

  try {
    const blob = await head(CONTENT_BLOB_PATH, { token });
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to read saved content: ${response.status}`);
    }

    const raw = await response.json();
    return normalizeContent(raw);
  } catch (error) {
    if (error?.message && error.message.toLowerCase().includes('not found')) {
      return cloneDefaultContent();
    }
    throw error;
  }
}

async function saveContent(input) {
  const token = getBlobToken();
  if (!token) {
    const error = new Error('Missing required environment variable: BLOB_READ_WRITE_TOKEN');
    error.statusCode = 503;
    throw error;
  }

  const normalized = normalizeContent(input);
  await put(CONTENT_BLOB_PATH, JSON.stringify(normalized, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    token,
  });

  return normalized;
}

module.exports = {
  loadStoredContent,
  normalizeContent,
  saveContent,
  toPublicContent,
};
