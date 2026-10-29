import assets from '../build/embedded-assets.js';
import { buildPushPayload } from '@block65/webcrypto-web-push';
import { getFare } from './pricing.js';
const encoder = new TextEncoder();
const statuses = new Set(['new', 'confirmed', 'completed', 'cancelled']);
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
async function hash(value) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))].map(n => n.toString(16).padStart(2, '0')).join(''); }
function getAdmin(request, env) {
  // Sites dispatch supplies verified identity; never accept identity from the body/query.
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  const id = request.headers.get('oai-authenticated-user-id');
  if (!id || !email) throw new HttpError(401, 'Inicia sesión para continuar.');
  if (email !== env.ADMIN_EMAIL?.trim().toLowerCase()) throw new HttpError(403, 'Esta cuenta no tiene acceso al administrador.');
  return { id, email };
}
function checkOrigin(request, env, admin = false) {
  const origin = request.headers.get('Origin');
  if (!origin) return;
  const same = new URL(request.url).origin;
  const allowed = admin ? [same] : [same, ...(env.PUBLIC_ORIGINS || 'https://theridecr.net,https://www.theridecr.net').split(',').map(s => s.trim())];
  if (!allowed.includes(origin)) throw new HttpError(403, 'Origen no permitido.');
}
async function bodyJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new HttpError(415, 'Se requiere JSON.');
  if (Number(request.headers.get('content-length')) > 16384) throw new HttpError(413, 'Solicitud demasiado grande.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'JSON inválido.');
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new HttpError(413, 'Solicitud demasiado grande.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const raw = new TextDecoder().decode(bytes);
  try { const value = JSON.parse(raw); if (!value || Array.isArray(value) || typeof value !== 'object') throw 0; return value; }
  catch { throw new HttpError(400, 'JSON inválido.'); }
}
function textField(data, name, min, max) {
  const value = typeof data[name] === 'string' ? data[name].trim() : '';
  if (value.length < min || value.length > max || /[\u0000-\u001f]/.test(value)) throw new HttpError(400, `Campo inválido: ${name}.`);
  return value;
}
function validateReservation(data) {
  if (data.company) throw new HttpError(400, 'Solicitud inválida.');
  const customerName = textField(data, 'customerName', 2, 120);
  const customerContact = textField(data, 'customerContact', 8, 40);
  if (!/^\+?[\d\s().-]+$/.test(customerContact) || !/^\d{8,15}$/.test(customerContact.replace(/\D/g, ''))) throw new HttpError(400, 'Número de teléfono inválido.');
  const from = textField(data, 'from', 2, 250), to = textField(data, 'to', 2, 250);
  if (from.toLowerCase() === to.toLowerCase()) throw new HttpError(400, 'El origen y el destino deben ser diferentes.');
  const date = textField(data, 'date', 10, 10), time = textField(data, 'time', 5, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new HttpError(400, 'Fecha u hora inválida.');
  const pickup = new Date(`${date}T${time}:00-06:00`);
  if (Number.isNaN(+pickup) || new Date(+pickup - 21600000).toISOString().slice(0, 10) !== date || +pickup <= Date.now()) throw new HttpError(400, 'La recogida debe ser una fecha futura, hora de Costa Rica.');
  const pax = data.pax;
  if (!Number.isInteger(pax) || pax < 1 || pax > 5) throw new HttpError(400, 'Selecciona de 1 a 5 pasajeros.');
  const total = getFare(from, to, pax);
  // Client-supplied prices, distances, statuses and IDs are never trusted.
  return { customerName, customerContact, from, to, date, time, pax, total, distanceKm: null, durationMin: null, quoteStatus: total === null ? 'pending' : 'preset', timezone: 'America/Costa_Rica' };
}
function decodeRow(row) { return { ...JSON.parse(row.payload), id: row.id, status: row.status, createdAt: row.created_at, source: 'Website' }; }
function receipt(row) { const r = decodeRow(row); return { id: r.id, createdAt: r.createdAt, status: r.status, total: r.total, quoteStatus: r.quoteStatus }; }
async function throttle(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const windowStart = Math.floor(Date.now() / 3600000);
  const key = await hash(`${ip}:${windowStart}`);
  const row = await env.DB.prepare('INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(key, windowStart).first();
  if (row.count > 10) throw new HttpError(429, 'Demasiadas solicitudes. Intenta más tarde o contáctanos por WhatsApp.');
  await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(windowStart - 24).run();
}
function validSubscription(value) {
  if (!value || typeof value.endpoint !== 'string' || value.endpoint.length > 2048) return false;
  let endpoint; try { endpoint = new URL(value.endpoint); } catch { return false; }
  // Restrict endpoints to real browser push providers; prevents authenticated SSRF.
  if (endpoint.protocol !== 'https:' || endpoint.port || endpoint.username || endpoint.password || !(/^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com)$/.test(endpoint.hostname) || endpoint.hostname.endsWith('.notify.windows.com'))) return false;
  try {
    const decode = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    return typeof value.keys?.p256dh === 'string' && typeof value.keys?.auth === 'string' && decode(value.keys.p256dh).length === 65 && decode(value.keys.auth).length === 16;
  } catch { return false; }
}
async function sendPush(env, subscription, data) {
  const payload = await buildPushPayload({ data: JSON.stringify(data), options: { ttl: 3600 } }, subscription, { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY });
  // workerd supports manual/follow, but rejects redirect:error before sending.
  // Manual mode keeps provider redirects blocked without leaving the allowlisted endpoint.
  return fetch(subscription.endpoint, { ...payload, redirect: 'manual', signal: AbortSignal.timeout(8000) });
}
async function deliver(env, data) {
  const { results } = await env.DB.prepare('SELECT endpoint, payload FROM push_subscriptions WHERE user_id = ?').bind(env.ADMIN_EMAIL.toLowerCase()).all();
  let sent = 0, failed = 0;
  await Promise.all(results.map(async row => {
    try {
      const response = await sendPush(env, JSON.parse(row.payload), data);
      if (response.ok) sent++;
      else if (response.status === 404 || response.status === 410) await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(row.endpoint).run();
      else { failed++; console.warn('Push provider status', response.status); }
    } catch (error) {
      failed++;
      const message = String(error?.message || 'Unknown error').replace(/https?:\/\/\S+/gi, '[endpoint]').replace(/[A-Za-z0-9_-]{32,}/g, '[redacted]').slice(0, 180);
      console.warn('Push delivery failed; retry queued', { name: error?.name || 'Error', message });
    }
  }));
  return { sent, failed, devices: results.length };
}
async function flushPushJobs(env) {
  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY) return false;
  let retry = false;
  const now = Date.now();
  const { results } = await env.DB.prepare('SELECT id FROM push_jobs WHERE sent_at IS NULL AND next_attempt <= ? ORDER BY next_attempt LIMIT 10').bind(now).all();
  for (const item of results) {
    const job = await env.DB.prepare('UPDATE push_jobs SET attempts = attempts + 1, next_attempt = ? WHERE id = ? AND sent_at IS NULL AND next_attempt <= ? RETURNING payload, attempts').bind(now + 60000, item.id, now).first();
    if (!job) continue;
    const result = await deliver(env, JSON.parse(job.payload));
    if (!result.failed) await env.DB.prepare('UPDATE push_jobs SET sent_at = ? WHERE id = ?').bind(new Date().toISOString(), item.id).run();
    else {
      retry = true;
      await env.DB.prepare('UPDATE push_jobs SET next_attempt = ? WHERE id = ?').bind(Date.now() + (job.attempts === 1 ? 2000 : Math.min(3600000, 30000 * 2 ** Math.min(job.attempts, 7))), item.id).run();
    }
  }
  return retry;
}
async function processPushJobs(env) {
  if (await flushPushJobs(env)) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    await flushPushJobs(env);
  }
}
function background(ctx, work) { ctx.waitUntil(work.catch(() => console.error('Background notification work failed'))); }
async function api(request, env, ctx, url) {
  const path = url.pathname;
  if (request.method === 'OPTIONS') { checkOrigin(request, env, path !== '/api/reservations'); return new Response(null, { status: 204 }); }
  if (path === '/api/health' && request.method === 'GET') { await env.DB.prepare('SELECT 1 FROM reservations LIMIT 1').first(); return json({ ok: true, service: 'TheRideCR reservations' }); }
  if (path === '/api/reservations' && request.method === 'POST') {
    checkOrigin(request, env);
    const key = request.headers.get('Idempotency-Key');
    if (!key || !/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new HttpError(400, 'Idempotency-Key inválida.');
    const raw = await bodyJson(request);
    // Normalize/hash the submitted fields before validating future time so a committed retry remains safe.
    const fingerprint = await hash(JSON.stringify(['customerName','customerContact','from','to','date','time','pax'].map(k => typeof raw[k] === 'string' ? raw[k].trim() : raw[k])));
    const existing = await env.DB.prepare('SELECT * FROM reservations WHERE idempotency_key = ?').bind(key).first();
    if (existing) { if (existing.request_hash !== fingerprint) throw new HttpError(409, 'La solicitud cambió. Envía una reserva nueva.'); return json({ reservation: receipt(existing) }); }
    const data = validateReservation(raw);
    await throttle(request, env);
    const id = `TRC-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    const notification = { reservationId: id, title: 'Nueva reserva · TheRideCR', body: 'Hay una nueva solicitud de traslado. Abre Admin para revisarla.', tag: id, url: `/admin/?reservation=${id}` };
    try {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO reservations (id, idempotency_key, request_hash, created_at, status, payload) VALUES (?, ?, ?, ?, ?, ?)').bind(id, key, fingerprint, createdAt, 'new', JSON.stringify(data)),
        env.DB.prepare('INSERT INTO push_jobs (id, payload, attempts, next_attempt) VALUES (?, ?, 0, 0)').bind(id, JSON.stringify(notification)),
      ]);
    } catch (error) {
      const winner = await env.DB.prepare('SELECT * FROM reservations WHERE idempotency_key = ?').bind(key).first();
      if (!winner) throw error;
      if (winner.request_hash !== fingerprint) throw new HttpError(409, 'La solicitud cambió.');
      return json({ reservation: receipt(winner) });
    }
    background(ctx, processPushJobs(env));
    return json({ reservation: { id, createdAt, status: 'new', total: data.total, quoteStatus: data.quoteStatus } }, 201);
  }
  const user = getAdmin(request, env);
  if (!['GET', 'HEAD'].includes(request.method)) checkOrigin(request, env, true);
  if (path === '/api/admin/session' && request.method === 'GET') return json({ user: { email: user.email } });
  if (path === '/api/reservations' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM reservations ORDER BY created_at DESC LIMIT 1000').all();
    background(ctx, processPushJobs(env));
    return json({ reservations: results.map(decodeRow) });
  }
  const match = path.match(/^\/api\/reservations\/(TRC-[A-F0-9]{12})$/);
  if (match) {
    if (request.method === 'PATCH') {
      const body = await bodyJson(request);
      if (!statuses.has(body.status)) throw new HttpError(400, 'Estado inválido.');
      const row = await env.DB.prepare('UPDATE reservations SET status = ? WHERE id = ? RETURNING *').bind(body.status, match[1]).first();
      if (!row) throw new HttpError(404, 'Reserva no encontrada.');
      return json({ reservation: decodeRow(row) });
    }
    if (request.method === 'DELETE') {
      await env.DB.batch([env.DB.prepare('DELETE FROM push_jobs WHERE id = ?').bind(match[1]), env.DB.prepare('DELETE FROM reservations WHERE id = ?').bind(match[1])]);
      return json({ ok: true });
    }
  }
  if (path === '/api/push/public-key' && request.method === 'GET') {
    if (!env.VAPID_PUBLIC_KEY) throw new HttpError(503, 'Notificaciones sin configurar.');
    return json({ publicKey: env.VAPID_PUBLIC_KEY });
  }
  if (path === '/api/push/subscriptions') {
    const body = await bodyJson(request);
    if (request.method === 'POST') {
      if (!validSubscription(body.subscription)) throw new HttpError(400, 'Suscripción push inválida.');
      const { subscription } = body;
      const count = await env.DB.prepare('SELECT count(*) AS total FROM push_subscriptions WHERE user_id = ?').bind(user.email).first();
      const existing = await env.DB.prepare('SELECT endpoint FROM push_subscriptions WHERE endpoint = ?').bind(subscription.endpoint).first();
      if (!existing && count.total >= 20) throw new HttpError(400, 'Límite de dispositivos alcanzado.');
      await env.DB.prepare('INSERT INTO push_subscriptions (endpoint, user_id, payload, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, payload = excluded.payload').bind(subscription.endpoint, user.email, JSON.stringify({ endpoint: subscription.endpoint, keys: subscription.keys }), new Date().toISOString()).run();
      return json({ ok: true });
    }
    if (request.method === 'DELETE') {
      if (typeof body.endpoint !== 'string') throw new HttpError(400, 'Endpoint inválido.');
      await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').bind(body.endpoint, user.email).run();
      return json({ ok: true });
    }
  }
  if (path === '/api/push/test' && request.method === 'POST') {
    const result = await deliver(env, { test: true, title: 'TheRideCR Admin', body: 'Las notificaciones están activas en este dispositivo.', tag: 'theridecr-test', url: '/admin/' });
    return json(result);
  }
  throw new HttpError(404, 'Ruta no encontrada.');
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let response;
    try {
      if (url.pathname.startsWith('/api/')) response = await api(request, env, ctx, url);
      else if (url.pathname === '/') response = Response.redirect(url.origin + '/admin/', 302);
      else if (url.pathname === '/admin') response = Response.redirect(url.origin + '/admin/', 308);
      else if (url.pathname === '/robots.txt') response = new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain' } });
      else {
        const key = url.pathname === '/admin/' ? '/admin/index.html' : url.pathname;
        const asset = assets[key];
        response = asset ? new Response(Uint8Array.from(atob(asset.body), c => c.charCodeAt(0)), { headers: { 'Content-Type': asset.type, 'Cache-Control': key.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' } }) : new Response('Not found', { status: 404 });
      }
    } catch (error) {
      if (!error.status) console.error('API request failed', error.message);
      response = json({ error: error.status ? error.message : 'No se pudo completar la solicitud. Intenta nuevamente.' }, error.status || 500);
    }
    response = new Response(response.body, response);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('X-Frame-Options', 'DENY');
    if (url.pathname === '/admin/sw.js') response.headers.set('Service-Worker-Allowed', '/admin/');
    const origin = request.headers.get('Origin');
    const allowed = (env.PUBLIC_ORIGINS || 'https://theridecr.net,https://www.theridecr.net').split(',').map(s => s.trim());
    if (url.pathname === '/api/reservations' && ['POST','OPTIONS'].includes(request.method) && allowed.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
      response.headers.set('Access-Control-Max-Age', '600');
      response.headers.set('Vary', 'Origin');
    }
    return response;
  },
};
