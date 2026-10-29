import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare } from 'miniflare';
import worker from '../dist/server/index.js';
let mf, env;
let tasks = [], pushes = [];
const nativeFetch = globalThis.fetch;
const origin = 'https://admin.example.test';
const adminHeaders = { 'oai-authenticated-user-id': 'verified-test-user', 'oai-authenticated-user-email': 'tbnalfaro@gmail.com' };
const future = new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10);
const booking = { customerName: 'QA Guest', customerContact: '+506 8888 1111', from: 'SJO Airport', to: 'San José Hotels', date: future, time: '14:30', pax: 2, total: 1, status: 'confirmed', id: 'spoofed' };
async function request(path, { admin = false, body, headers = {}, method = 'GET' } = {}) {
  return worker.fetch(new Request(origin + path, { method, headers: { ...(admin ? adminHeaders : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) }), env, { waitUntil: p => tasks.push(p) });
}
async function create(data = booking, key = crypto.randomUUID()) { return request('/api/reservations', { method: 'POST', headers: { 'Idempotency-Key': key, Origin: 'https://theridecr.net' }, body: data }); }
before(async () => {
  mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', compatibilityDate: '2026-05-15', d1Databases: ['DB'] });
  const db = await mf.getD1Database('DB');
  const sql = await readFile(new URL('../drizzle/0000_sharp_sunfire.sql', import.meta.url), 'utf8');
  for (const statement of sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) await db.prepare(statement).run();
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', keys.privateKey);
  env = { DB: db, ADMIN_EMAIL: 'tbnalfaro@gmail.com', VAPID_PUBLIC_KEY: Buffer.from(await crypto.subtle.exportKey('raw', keys.publicKey)).toString('base64url'), VAPID_PRIVATE_KEY: jwk.d, VAPID_SUBJECT: 'mailto:tbnalfaro@gmail.com' };
  globalThis.fetch = async (url, options) => { pushes.push({ url, options }); return new Response('', { status: 201 }); };
});
after(async () => { await Promise.all(tasks); globalThis.fetch = nativeFetch; await mf.dispose(); });
test('private APIs require verified identity and the authorized email', async () => {
  assert.equal((await request('/api/reservations')).status, 401);
  assert.equal((await request('/api/admin/session', { headers: { ...adminHeaders, 'oai-authenticated-user-email': 'other@example.test' } })).status, 403);
  assert.deepEqual(await (await request('/api/admin/session', { admin: true })).json(), { user: { email: 'tbnalfaro@gmail.com' } });
});
let id;
test('reservation persists with authoritative ID, price, status and no public PII', async () => {
  const response = await create(); assert.equal(response.status, 201);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://theridecr.net');
  const { reservation } = await response.json(); id = reservation.id;
  assert.match(id, /^TRC-[A-F0-9]{12}$/); assert.equal(reservation.total, 60); assert.equal(reservation.status, 'new');
  assert.equal(reservation.customerName, undefined);
  const list = await (await request('/api/reservations', { admin: true })).json();
  assert.equal(list.reservations[0].customerName, booking.customerName); assert.equal(list.reservations[0].distanceKm, null);
});
test('idempotent retries and concurrent submissions create one row', async () => {
  const key = crypto.randomUUID();
  const responses = await Promise.all([create(booking, key), create(booking, key)]);
  const values = await Promise.all(responses.map(r => r.json()));
  assert.equal(values[0].reservation.id, values[1].reservation.id);
  assert.equal((await create({ ...booking, pax: 3 }, key)).status, 409);
});
test('rejects invalid date, past time, phone, route, pax and key', async () => {
  for (const patch of [{ date: '2020-01-01' }, { date: '2027-02-30' }, { time: '99:00' }, { pax: 6 }, { from: booking.to }, { customerContact: 'abcdefgh' }, { customerName: '' }]) assert.equal((await create({ ...booking, ...patch })).status, 400);
  assert.equal((await create(booking, 'bad')).status, 400);
});
test('custom route remains pending; public CORS cannot mutate admin records', async () => {
  const { reservation } = await (await create({ ...booking, to: 'Custom hotel address' })).json(); assert.equal(reservation.total, null); assert.equal(reservation.quoteStatus, 'pending');
  assert.equal((await request(`/api/reservations/${id}`, { method: 'PATCH', admin: true, headers: { Origin: 'https://theridecr.net' }, body: { status: 'confirmed' } })).status, 403);
  assert.equal((await request('/api/reservations', { method: 'POST', headers: { Origin: 'https://evil.test', 'Idempotency-Key': crypto.randomUUID() }, body: booking })).status, 403);
});
test('admin status updates persist and invalid status is rejected', async () => {
  const response = await request(`/api/reservations/${id}`, { method: 'PATCH', admin: true, body: { status: 'confirmed' } });
  assert.equal((await response.json()).reservation.status, 'confirmed');
  assert.equal((await request(`/api/reservations/${id}`, { method: 'PATCH', admin: true, body: { status: 'paid' } })).status, 400);
});
test('push subscription is private, prevents SSRF, encrypts delivery and unregisters', async () => {
  await Promise.all(tasks); tasks = [];
  assert.equal((await request('/api/push/public-key')).status, 401);
  assert.equal((await request('/api/push/subscriptions', { method: 'POST', admin: true, body: { subscription: { endpoint: 'https://localhost/internal' } } })).status, 400);
  const key = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test-only', keys: { p256dh: Buffer.from(await crypto.subtle.exportKey('raw', key.publicKey)).toString('base64url'), auth: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url') } };
  assert.equal((await request('/api/push/subscriptions', { method: 'POST', admin: true, body: { subscription } })).status, 200);
  const result = await (await request('/api/push/test', { method: 'POST', admin: true })).json();
  assert.equal(result.sent, 1); assert.equal(pushes.length, 1);
  assert.match(pushes[0].options.headers.Authorization || pushes[0].options.headers.authorization, /^vapid /);
  const before = pushes.length; const response = await create({ ...booking, pax: 5 }); assert.equal(response.status, 201);
  await Promise.all(tasks); tasks = []; assert.equal(pushes.length, before + 1);
  assert.equal((await request('/api/push/subscriptions', { method: 'DELETE', admin: true, body: { endpoint: subscription.endpoint } })).status, 200);
});
test('admin shell has manifest, protected data is not cached, legacy API flags cannot authenticate', async () => {
  const response = await request('/admin/'); assert.equal(response.status, 200); assert.match(await response.text(), /manifest/);
  assert.match((await request('/api/reservations?admin=1')).headers.get('Cache-Control'), /no-store/);
  assert.equal((await request('/api/reservations?admin=1')).status, 401);
});
test('admin can delete a reservation durably', async () => {
  assert.equal((await request(`/api/reservations/${id}`, { method: 'DELETE', admin: true })).status, 200);
  const { reservations } = await (await request('/api/reservations', { admin: true })).json(); assert.equal(reservations.some(r => r.id === id), false);
});
