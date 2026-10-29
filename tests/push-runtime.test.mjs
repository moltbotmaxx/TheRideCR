import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Miniflare, createFetchMock } from 'miniflare';

// Exercise WebCrypto and fetch inside workerd. The subscription and transport are
// synthetic: these tests never contact a push provider or read production keys.
let script, bindings;
before(async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const client = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const subscription = {
    endpoint: 'https://web.push.apple.com/test-only-runtime', expirationTime: null,
    keys: {
      p256dh: Buffer.from(await crypto.subtle.exportKey('raw', client.publicKey)).toString('base64url'),
      auth: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url'),
    },
  };
  bindings = {
    ADMIN_EMAIL: 'admin@example.test', SUBSCRIPTION: JSON.stringify(subscription),
    VAPID_SUBJECT: 'mailto:admin@example.test',
    VAPID_PUBLIC_KEY: Buffer.from(await crypto.subtle.exportKey('raw', pair.publicKey)).toString('base64url'),
    VAPID_PRIVATE_KEY: jwk.d,
  };
  const source = `
    import worker from './worker/index.js';
    import { buildPushPayload } from '@block65/webcrypto-web-push';
    export default { async fetch(request, env, ctx) {
      const subscription = JSON.parse(env.SUBSCRIPTION);
      if (new URL(request.url).pathname === '/__test/payload') {
        const payload = await buildPushPayload({ data: 'test', options: { ttl: 3600 } }, subscription,
          { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY });
        const jwt = payload.headers.authorization.match(/t=([^,]+)/)[1];
        return Response.json({ bytes: payload.body.byteLength, encoding: payload.headers['content-encoding'],
          signatureBytes: atob(jwt.split('.')[2].replace(/-/g, '+').replace(/_/g, '/')).length });
      }
      // The real application handler and sendPush implementation run unchanged;
      // this narrow fixture replaces only the database read for subscriptions.
      const DB = { prepare() { return { bind() { return this; }, async all() {
        return { results: [{ endpoint: subscription.endpoint, payload: env.SUBSCRIPTION }] };
      } }; } };
      return worker.fetch(request, { ...env, DB }, ctx);
    } };
  `;
  const output = await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: 'js' }, bundle: true, write: false, format: 'esm', platform: 'browser' });
  script = output.outputFiles[0].text;
});

function runtime(mock) {
  mock.disableNetConnect();
  return new Miniflare({ modules: true, script, compatibilityDate: '2026-05-15', bindings, fetchMock: mock });
}
const authenticated = {
  method: 'POST', headers: { 'oai-authenticated-user-id': 'runtime-test-user', 'oai-authenticated-user-email': 'admin@example.test' },
};

test('push encryption and VAPID signing work in the Cloudflare runtime', async () => {
  const mf = runtime(createFetchMock());
  try {
    const response = await mf.dispatchFetch('https://admin.example.test/__test/payload');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { bytes: 4096, encoding: 'aes128gcm', signatureBytes: 64 });
  } finally { await mf.dispose(); }
});

test('the real Worker push test reaches the provider using a supported redirect mode', async () => {
  const mock = createFetchMock();
  let requests = 0;
  mock.get('https://web.push.apple.com').intercept({ path: '/test-only-runtime', method: 'POST' }).reply(options => {
    requests++;
    const headers = new Headers(options.headers);
    assert.equal(headers.get('content-encoding'), 'aes128gcm');
    assert.match(headers.get('authorization'), /^vapid /);
    return { statusCode: 201, data: '' };
  });
  const mf = runtime(mock);
  try {
    const response = await mf.dispatchFetch('https://admin.example.test/api/push/test', authenticated);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { sent: 1, failed: 0, devices: 1 });
    assert.equal(requests, 1);
  } finally { await mf.dispose(); }
});

test('a redirect from a push provider is reported as a failure and never followed', async () => {
  // A service binding keeps the 302 response inside workerd. If the sender ever
  // follows it, the synthetic destination returns 201 and this test fails.
  const mf = new Miniflare({ workers: [
    { name: 'app', modules: true, script, compatibilityDate: '2026-05-15', bindings, outboundService: 'provider' },
    { name: 'provider', modules: true, compatibilityDate: '2026-05-15', script: `export default { fetch(request) {
      return new URL(request.url).hostname === 'web.push.apple.com'
        ? new Response(null, { status: 302, headers: { Location: 'https://other.example.test/redirected' } })
        : new Response('', { status: 201 });
    } };` },
  ] });
  try {
    const response = await mf.dispatchFetch('https://admin.example.test/api/push/test', authenticated);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { sent: 0, failed: 1, devices: 1 });
  } finally { await mf.dispose(); }
});
