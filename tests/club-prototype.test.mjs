import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const club = new URL('../dist/client/club/', import.meta.url);
test('exports the isolated PWA with demo labelling and local assets', async () => {
  assert.deepEqual((await readdir(club)).sort(), ['app.css', 'app.js', 'data.js', 'icon-192.png', 'icon-512.png', 'icon.svg', 'index.html', 'manifest.webmanifest', 'sw.js']);
  const html = await readFile(new URL('index.html', club), 'utf8');
  assert.match(html, /noindex, nofollow/);
  assert.match(html, /Без реальной записи/);
  assert.match(html, /персонажи вымышлены/);
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', club), 'utf8'));
  assert.equal(manifest.scope, './'); assert.equal(manifest.start_url, './'); assert.equal(manifest.display, 'standalone');
  for (const item of manifest.icons) {
    const png = await readFile(new URL(item.src, club));
    const expected = Number(item.sizes.split('x')[0]);
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), expected); assert.equal(png.readUInt32BE(20), expected);
  }
  for (const match of html.matchAll(/(?:href|src)="(\.[^"]+)"/g)) await access(new URL(match[1], club));
  const css = await readFile(new URL('app.css', club), 'utf8');
  for (const match of css.matchAll(/url\('([^']+)'\)/g)) await access(new URL(match[1], club));
  const js = await readFile(new URL('app.js', club), 'utf8');
  assert.match(js, /register\('\.\/sw\.js', \{ scope: '\.\/' \}\)/);
  assert.doesNotMatch(js, /https?:\/\/|Notification\.requestPermission|fetch\(/);
});
test('service worker ignores the landing, outside origins, query URLs, and non-GET requests', async () => {
  const source = await readFile(new URL('sw.js', club), 'utf8');
  const handlers = {};
  const scope = 'https://example.test/fitness-studio-landing/club/';
  const cacheNames = ['unrelated-app', 'fitness-club-demo:/fitness-studio-landing/club/:old', 'fitness-club-demo:/another/club/:old'];
  const deleted = [];
  let cachedUrls = [];
  const cache = { addAll: async (urls) => { cachedUrls = urls; }, put: async () => {}, match: async () => new Response('cached') };
  runInNewContext(source, { URL, Set, Response, self: { registration: { scope }, addEventListener: (type, fn) => { handlers[type] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => {} } }, caches: { open: async () => cache, keys: async () => cacheNames, delete: async (key) => { deleted.push(key); } }, fetch: async () => { throw new Error('offline'); } });
  let pending;
  handlers.install({ waitUntil: (promise) => { pending = promise; } }); await pending;
  assert.ok(cachedUrls.includes(scope + 'index.html'));
  for (const url of cachedUrls) { assert.ok(url.startsWith('https://example.test/fitness-studio-landing/')); assert.ok(!url.includes('?')); }
  handlers.activate({ waitUntil: (promise) => { pending = promise; } }); await pending;
  assert.deepEqual(deleted, ['fitness-club-demo:/fitness-studio-landing/club/:old']);
  for (const [url, method] of [['https://example.test/fitness-studio-landing/', 'GET'], ['https://other.test/club/', 'GET'], [scope + 'app.js?token=secret', 'GET'], [scope + 'app.js', 'POST']]) {
    handlers.fetch({ request: { url, method }, respondWith: () => assert.fail('request must not be intercepted') });
  }
  handlers.fetch({ request: { url: scope + 'app.js', method: 'GET' }, respondWith: (promise) => { pending = promise; } });
  assert.equal(await (await pending).text(), 'cached');
});
