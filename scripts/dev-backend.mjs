// Loopback-only preview. Verified identity is simulated ONLY in this development adapter.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { Miniflare } from 'miniflare';
import worker from '../dist/server/index.js';
const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', compatibilityDate: '2026-05-15', d1Databases: ['DB'], d1Persist: '.data/d1' });
const DB = await mf.getD1Database('DB');
await DB.prepare('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)').run();
for (const name of (await readdir('drizzle')).filter(n => n.endsWith('.sql')).sort()) {
  if (await DB.prepare('SELECT name FROM local_migrations WHERE name = ?').bind(name).first()) continue;
  for (const statement of (await readFile('drizzle/' + name, 'utf8')).split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) await DB.prepare(statement).run();
  await DB.prepare('INSERT INTO local_migrations (name) VALUES (?)').bind(name).run();
}
const env = { DB, ADMIN_EMAIL: 'tbnalfaro@gmail.com', PUBLIC_ORIGINS: 'http://127.0.0.1:4173,http://localhost:4173,http://localhost:5173' };
const server = createServer(async (req, res) => {
  try {
    const headers = new Headers(req.headers);
    headers.set('oai-authenticated-user-id', 'local-preview');
    headers.set('oai-authenticated-user-email', env.ADMIN_EMAIL);
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const response = await worker.fetch(new Request('http://127.0.0.1:8787' + req.url, { method: req.method, headers, ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Buffer.concat(chunks) }) }), env, { waitUntil: p => p.catch(console.error) });
    res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { res.writeHead(500); res.end(error.message); }
});
server.listen(8787, '127.0.0.1', () => console.log('Local: http://127.0.0.1:8787/admin/ (development identity; local D1)'));
process.on('SIGINT', async () => { server.close(); await mf.dispose(); process.exit(0); });
