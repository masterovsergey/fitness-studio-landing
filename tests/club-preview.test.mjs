import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createPreviewServer } from '../scripts/preview-pages.mjs';

test('preview serves slash routes and manifest MIME without exposing other files', async (t) => {
  const server = createPreviewServer(fileURLToPath(new URL('../public/', import.meta.url)));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const directory = await fetch(base + '/fitness-studio-landing/club', { redirect: 'manual' });
  assert.equal(directory.status, 308);
  assert.equal(directory.headers.get('location'), '/fitness-studio-landing/club/');
  const page = await fetch(base + '/fitness-studio-landing/club/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Кабинет студии · прототип/);
  const manifest = await fetch(base + '/fitness-studio-landing/club/manifest.webmanifest');
  assert.match(manifest.headers.get('content-type'), /application\/manifest\+json/);
  for (const path of ['/club/', '/fitness-studio-landing-extra/club/', '/fitness-studio-landing/%2e%2e%2fpackage.json', '/fitness-studio-landing/%ZZ']) assert.equal((await fetch(base + path)).status, 404);
  assert.equal((await fetch(base + '/fitness-studio-landing/club/app.js', { method: 'POST' })).status, 405);
});
