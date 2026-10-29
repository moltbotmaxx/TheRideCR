import { build } from 'esbuild';
import { readdir, readFile, mkdir, writeFile, copyFile, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.admin.config.js'], { stdio: 'inherit' });
const assets = {};
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json' };
async function collect(directory, prefix = '') {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, item.name);
    if (item.isDirectory()) await collect(path.join(directory, item.name), relative);
    else { const bytes = await readFile(path.join(directory, item.name)); assets['/' + relative] = { body: bytes.toString('base64'), type: types[path.extname(item.name)] || 'application/octet-stream' }; }
  }
}
await collect('build/admin-client');
await collect('public/admin', 'admin');
for (const file of ['icon-192.png', 'icon-512.png', 'favicon.svg']) {
  assets['/' + file] = { body: (await readFile('public/' + file)).toString('base64'), type: types[path.extname(file)] };
}
await mkdir('build', { recursive: true });
await writeFile('build/embedded-assets.js', 'export default ' + JSON.stringify(assets) + ';\n');
await rm('build/public', { recursive: true, force: true });
await cp('dist', 'build/public', { recursive: true });
await rm('dist', { recursive: true, force: true });
await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
await build({ entryPoints: ['worker/index.js'], outfile: 'dist/server/index.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true });
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log('Backend bundle ready (embedded Admin app + D1 API)');
