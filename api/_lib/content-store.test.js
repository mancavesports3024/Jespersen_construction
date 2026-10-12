const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('./content-store');
const publicHandler = require('../content');
const adminHandler = require('../admin/content');
const loginHandler = require('../admin/login');

const SENTINEL_NOTE = 'PRIVATE-NOTE-9f3c2a';
const SENTINEL_QUERY = 'PRIVATE-QUERY-do-not-publish';
const SENTINEL_EMAIL = 'owner-only-inbox@example.test';
const SENTINEL_SECRET = 'services-secret-should-not-publish';
const PUBLIC_HEADING = 'Public roof heading stays';
const PUBLIC_TOKEN = 'public-store-token';
const PRIVATE_TOKEN = 'private-store-token';

function jsonStream(value) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(value)));
      controller.close();
    },
  });
}

function privateInput() {
  return {
    customerEmail: SENTINEL_EMAIL,
    services: {
      heading: PUBLIC_HEADING,
      secret: SENTINEL_SECRET,
      items: [{ title: 'Roof repair', description: 'Public description', secret: SENTINEL_SECRET }],
    },
    searchResults: {
      title: 'Admin search notes',
      description: SENTINEL_NOTE,
      rows: [
        {
          query: SENTINEL_QUERY,
          clicks: '3',
          impressions: '40',
          position: '8',
          notes: SENTINEL_NOTE,
          customerEmail: SENTINEL_EMAIL,
        },
      ],
    },
  };
}

function legacyPublicBody() {
  return {
    services: { heading: PUBLIC_HEADING },
    customerEmail: SENTINEL_EMAIL,
    searchResults: {
      title: 'Legacy public copy',
      description: '',
      rows: [{ query: SENTINEL_QUERY, notes: SENTINEL_NOTE, clicks: '', impressions: '', position: '' }],
    },
  };
}

function createStores() {
  const publicStore = { access: 'public', token: PUBLIC_TOKEN, objects: new Map() };
  const privateStore = { access: 'private', token: PRIVATE_TOKEN, objects: new Map() };
  const calls = [];

  function storeFor(token) {
    if (token === publicStore.token) return publicStore;
    if (token === privateStore.token) return privateStore;
    const error = new Error('Unknown blob store token');
    error.statusCode = 401;
    throw error;
  }

  function assertAccess(blobStore, access) {
    if (access !== blobStore.access) {
      const error = new Error(`Blob store access is ${blobStore.access}; refused ${access}.`);
      error.name = 'BlobAccessError';
      error.statusCode = 400;
      throw error;
    }
  }

  const client = {
    async put(path, body, options) {
      const blobStore = storeFor(options.token);
      assertAccess(blobStore, options.access);
      calls.push({ op: 'put', path, body, options, store: blobStore.access });
      blobStore.objects.set(path, body);
      return { url: `https://${blobStore.access}.example/${path}` };
    },
    async head(path, options) {
      const blobStore = storeFor(options.token);
      assertAccess(blobStore, 'public');
      if (!blobStore.objects.has(path)) throw new Error('Blob not found');
      return { url: `https://public.example/${path}` };
    },
    async get(path, options) {
      const blobStore = storeFor(options.token);
      assertAccess(blobStore, options.access);
      calls.push({ op: 'get', path, options, store: blobStore.access });
      if (!blobStore.objects.has(path)) return null;
      return {
        statusCode: 200,
        stream: jsonStream(JSON.parse(blobStore.objects.get(path))),
        headers: new Headers(),
        blob: {},
      };
    },
  };

  return { publicStore, privateStore, calls, client };
}

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function installFetch(publicStore) {
  global.fetch = async () => {
    const body = publicStore.objects.get(store.CONTENT_BLOB_PATH);
    if (!body) return { ok: false, status: 404, async json() { return {}; } };
    return { ok: true, status: 200, async json() { return JSON.parse(body); } };
  };
}

let activeFetch = null;

test.beforeEach(() => {
  activeFetch = global.fetch;
});

test.afterEach(() => {
  store.__setBlobClientForTests(null);
  delete process.env[store.PUBLIC_BLOB_TOKEN_ENV];
  delete process.env[store.PRIVATE_BLOB_TOKEN_ENV];
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SECRET;
  global.fetch = activeFetch;
});

test('separate stores reject mismatched access modes', async () => {
  const stores = createStores();
  await assert.rejects(
    () => stores.client.put(store.PRIVATE_SEARCH_BLOB_PATH, '{}', {
      access: 'private',
      token: stores.publicStore.token,
    }),
    /access is public; refused private/
  );
  await assert.rejects(
    () => stores.client.put(store.CONTENT_BLOB_PATH, '{}', {
      access: 'public',
      token: stores.privateStore.token,
    }),
    /access is private; refused public/
  );
  await assert.rejects(
    () => stores.client.head(store.CONTENT_BLOB_PATH, { token: stores.privateStore.token }),
    /access is private; refused public/
  );
  assert.equal(stores.publicStore.objects.size, 0);
  assert.equal(stores.privateStore.objects.size, 0);
});

test('save writes notes only to the private store token', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  const stores = createStores();
  store.__setBlobClientForTests(stores.client);

  const saved = await store.saveContent(privateInput());
  const privatePut = stores.calls.find((call) => call.store === 'private');
  const publicPut = stores.calls.find((call) => call.store === 'public');

  assert.equal(stores.calls[0].store, 'private');
  assert.equal(privatePut.options.token, PRIVATE_TOKEN);
  assert.equal(privatePut.options.access, 'private');
  assert.equal(privatePut.path, store.PRIVATE_SEARCH_BLOB_PATH);
  assert.equal(publicPut.options.token, PUBLIC_TOKEN);
  assert.equal(publicPut.options.access, 'public');
  assert.equal(publicPut.path, store.CONTENT_BLOB_PATH);
  assert.notEqual(privatePut.options.token, publicPut.options.token);

  assert.equal(publicPut.body.includes(SENTINEL_NOTE), false);
  assert.equal(publicPut.body.includes(SENTINEL_QUERY), false);
  assert.equal(publicPut.body.includes(SENTINEL_EMAIL), false);
  assert.equal(publicPut.body.includes(SENTINEL_SECRET), false);
  assert.equal(publicPut.body.includes('searchResults'), false);
  assert.equal(publicPut.body.includes(PUBLIC_HEADING), true);
  assert.equal(privatePut.body.includes(SENTINEL_NOTE), true);
  assert.equal(privatePut.body.includes(SENTINEL_EMAIL), false);
  assert.equal(saved.searchResults.rows[0].notes, SENTINEL_NOTE);
});

test('a missing public token fails before any write', async () => {
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  const stores = createStores();
  store.__setBlobClientForTests(stores.client);

  await assert.rejects(() => store.saveContent(privateInput()), /BLOB_READ_WRITE_TOKEN/);
  assert.equal(stores.calls.length, 0);
  assert.equal(stores.privateStore.objects.size, 0);
});

test('missing private configuration does not write and keeps the public object', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  const stores = createStores();
  stores.publicStore.objects.set(store.CONTENT_BLOB_PATH, JSON.stringify(legacyPublicBody()));
  store.__setBlobClientForTests(stores.client);

  await assert.rejects(
    () => store.saveContent(privateInput()),
    /PRIVATE_BLOB_READ_WRITE_TOKEN/
  );
  assert.equal(stores.calls.length, 0);
  assert.equal(stores.privateStore.objects.size, 0);
  assert.equal(stores.publicStore.objects.get(store.CONTENT_BLOB_PATH).includes(SENTINEL_NOTE), true);
});

test('the same token for both stores is rejected before any write', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  const stores = createStores();
  store.__setBlobClientForTests(stores.client);

  await assert.rejects(() => store.saveContent(privateInput()), /separate private-store token/);
  assert.equal(stores.calls.length, 0);
});

test('a failed private write does not overwrite public content', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  const stores = createStores();
  stores.publicStore.objects.set(store.CONTENT_BLOB_PATH, JSON.stringify(legacyPublicBody()));
  const originalPut = stores.client.put.bind(stores.client);
  stores.client.put = async (path, body, options) => {
    if (options.access === 'private') throw new Error('private store unavailable');
    return originalPut(path, body, options);
  };
  store.__setBlobClientForTests(stores.client);

  await assert.rejects(() => store.saveContent(privateInput()), /private store unavailable/);
  assert.equal(stores.calls.some((call) => call.store === 'public'), false);
  assert.equal(stores.publicStore.objects.get(store.CONTENT_BLOB_PATH).includes(SENTINEL_NOTE), true);
});

test('a failed public write keeps notes already stored privately', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  const stores = createStores();
  const originalPut = stores.client.put.bind(stores.client);
  stores.client.put = async (path, body, options) => {
    if (options.access === 'public') throw new Error('public write failed');
    return originalPut(path, body, options);
  };
  store.__setBlobClientForTests(stores.client);

  await assert.rejects(() => store.saveContent(privateInput()), /public write failed/);
  assert.equal(stores.publicStore.objects.has(store.CONTENT_BLOB_PATH), false);
  const privateBody = stores.privateStore.objects.get(store.PRIVATE_SEARCH_BLOB_PATH);
  assert.equal(privateBody.includes(SENTINEL_NOTE), true);
});

test('public reads work without private storage and ignore legacy notes', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  const stores = createStores();
  stores.publicStore.objects.set(store.CONTENT_BLOB_PATH, JSON.stringify(legacyPublicBody()));
  installFetch(stores.publicStore);
  store.__setBlobClientForTests(stores.client);

  const loaded = await store.loadPublicContent();
  const res = mockRes();
  await publicHandler({ method: 'GET', headers: {} }, res);

  assert.equal(loaded.services.heading, PUBLIC_HEADING);
  assert.equal(loaded.searchResults, undefined);
  assert.equal(JSON.stringify(loaded).includes(SENTINEL_NOTE), false);
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.stringify(res.body).includes(SENTINEL_NOTE), false);
  assert.equal(stores.calls.some((call) => call.op === 'get'), false);
});

test('admin load keeps legacy notes when the private store is not configured', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  const stores = createStores();
  stores.publicStore.objects.set(store.CONTENT_BLOB_PATH, JSON.stringify(legacyPublicBody()));
  installFetch(stores.publicStore);
  store.__setBlobClientForTests(stores.client);

  const loaded = await store.loadAdminContent();
  assert.equal(loaded.searchResults.rows[0].notes, SENTINEL_NOTE);
  assert.equal(JSON.stringify(store.toPublicContent(loaded)).includes(SENTINEL_NOTE), false);
  assert.equal(stores.calls.some((call) => call.op === 'get'), false);
});

test('admin load prefers the private store and a private read failure does not write', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  const stores = createStores();
  stores.publicStore.objects.set(store.CONTENT_BLOB_PATH, JSON.stringify({
    services: { heading: PUBLIC_HEADING },
    searchResults: {
      title: 'Legacy',
      description: '',
      rows: [{ query: 'legacy', notes: 'LEGACY-PUBLIC-NOTE', clicks: '', impressions: '', position: '' }],
    },
  }));
  stores.privateStore.objects.set(store.PRIVATE_SEARCH_BLOB_PATH, JSON.stringify({
    searchResults: {
      title: 'Private',
      description: SENTINEL_NOTE,
      rows: [{ query: SENTINEL_QUERY, notes: SENTINEL_NOTE, clicks: '1', impressions: '2', position: '3' }],
    },
  }));
  installFetch(stores.publicStore);
  store.__setBlobClientForTests(stores.client);

  const loaded = await store.loadAdminContent();
  assert.equal(loaded.searchResults.rows[0].notes, SENTINEL_NOTE);
  assert.equal(stores.calls[0].options.token, PRIVATE_TOKEN);
  assert.equal(stores.calls[0].options.access, 'private');

  stores.client.get = async () => {
    throw new Error('private read failed');
  };
  await assert.rejects(() => store.loadAdminContent(), /private read failed/);
  assert.equal(stores.calls.some((call) => call.op === 'put'), false);
});

test('a public read failure is reported to admin and does not expose notes publicly', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  const stores = createStores();
  stores.client.head = async () => {
    throw new Error('public store unavailable');
  };
  store.__setBlobClientForTests(stores.client);

  await assert.rejects(() => store.loadAdminContent(), /public store unavailable/);

  const res = mockRes();
  await publicHandler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.stringify(res.body).includes(SENTINEL_NOTE), false);
  assert.equal(stores.calls.some((call) => call.op === 'get'), false);
});

test('unauthenticated requests cannot read or write private notes', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  const stores = createStores();
  stores.privateStore.objects.set(store.PRIVATE_SEARCH_BLOB_PATH, JSON.stringify({
    searchResults: {
      title: 'Private',
      description: '',
      rows: [{ query: SENTINEL_QUERY, notes: SENTINEL_NOTE, clicks: '', impressions: '', position: '' }],
    },
  }));
  store.__setBlobClientForTests(stores.client);

  const getRes = mockRes();
  await adminHandler({ method: 'GET', headers: {} }, getRes);
  const putRes = mockRes();
  await adminHandler({ method: 'PUT', headers: {}, body: privateInput() }, putRes);

  assert.equal(getRes.statusCode, 401);
  assert.equal(putRes.statusCode, 401);
  assert.equal(stores.calls.length, 0);
  assert.equal(JSON.stringify(getRes.body).includes(SENTINEL_NOTE), false);
});

test('an admin session can read private notes', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SECRET = 'test-secret';
  const stores = createStores();
  stores.publicStore.objects.set(store.CONTENT_BLOB_PATH, JSON.stringify({
    services: { heading: PUBLIC_HEADING },
  }));
  stores.privateStore.objects.set(store.PRIVATE_SEARCH_BLOB_PATH, JSON.stringify({
    searchResults: {
      title: 'Private',
      description: '',
      rows: [{ query: SENTINEL_QUERY, notes: SENTINEL_NOTE, clicks: '', impressions: '', position: '' }],
    },
  }));
  installFetch(stores.publicStore);
  store.__setBlobClientForTests(stores.client);

  const loginRes = mockRes();
  await loginHandler({ method: 'POST', headers: {}, body: { password: 'test-password' } }, loginRes);
  assert.equal(loginRes.statusCode, 200);

  const getRes = mockRes();
  await adminHandler({
    method: 'GET',
    headers: { cookie: loginRes.headers['Set-Cookie'] },
  }, getRes);

  assert.equal(getRes.statusCode, 200);
  assert.equal(getRes.body.searchResults.rows[0].notes, SENTINEL_NOTE);
  assert.equal(stores.calls.some((call) => call.op === 'get' && call.options.token === PRIVATE_TOKEN), true);
});

test('admin reports a read failure instead of returning empty notes', async () => {
  process.env[store.PUBLIC_BLOB_TOKEN_ENV] = PUBLIC_TOKEN;
  process.env[store.PRIVATE_BLOB_TOKEN_ENV] = PRIVATE_TOKEN;
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SECRET = 'test-secret';
  const stores = createStores();
  stores.publicStore.objects.set(store.CONTENT_BLOB_PATH, JSON.stringify(legacyPublicBody()));
  stores.client.head = async () => {
    throw new Error('public store unavailable');
  };
  store.__setBlobClientForTests(stores.client);

  const loginRes = mockRes();
  await loginHandler({ method: 'POST', headers: {}, body: { password: 'test-password' } }, loginRes);
  const getRes = mockRes();
  await adminHandler({
    method: 'GET',
    headers: { cookie: loginRes.headers['Set-Cookie'] },
  }, getRes);

  assert.equal(getRes.statusCode, 500);
  assert.match(getRes.body.error, /public store unavailable/);
  assert.equal(getRes.body.searchResults, undefined);
  assert.equal(stores.calls.some((call) => call.op === 'put'), false);
  assert.equal(stores.publicStore.objects.get(store.CONTENT_BLOB_PATH).includes(SENTINEL_NOTE), true);
});
