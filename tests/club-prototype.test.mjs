import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import * as demo from '../public/club/data.js';

const club = new URL('../dist/client/club/', import.meta.url);

// Run the real view/controller code against a small DOM adapter. Layout and
// actual keyboard behaviour still require the browser checks in README.
async function viewHarness(initial = demo.initialState('2026-09-07'), hash = '#home') {
  const source = await readFile(new URL('app.js', club), 'utf8');
  const importLine = /^import \{[^\n]+\} from '\.\/data\.js';\r?\n/;
  assert.match(source, importLine);
  const nodes = new Map();
  const windowEvents = {};
  let stored = JSON.stringify(initial);
  let focused = '';
  const document = { title: '', activeElement: null, addEventListener() {}, querySelector: node };
  function node(selector) {
    if (!nodes.has(selector)) {
      const classes = new Set();
      const events = {};
      const element = {
        innerHTML: '', textContent: '', hidden: false, open: false, isConnected: true,
        classList: {
          toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
          contains: (name) => classes.has(name), add: (name) => classes.add(name), delete: (name) => classes.delete(name),
        },
        querySelector: (child) => node(`${selector} ${child}`),
        focus() { focused = selector; document.activeElement = element; },
        addEventListener: (name, callback) => { events[name] = callback; },
        showModal() { element.open = true; },
        close() { element.open = false; events.close?.(); },
        contains: () => false,
      };
      nodes.set(selector, element);
    }
    return nodes.get(selector);
  }
  const location = { hash };
  const controller = runInNewContext(source.replace(importLine, '') + '\n;({ home, schedule, sessionCard, sessionSheet, render, actions, route })', {
    ...demo, document, location, navigator: { onLine: true },
    window: { addEventListener: (name, callback) => { windowEvents[name] = callback; }, scrollTo() {} },
    localStorage: { getItem: () => stored, setItem: (_key, value) => { stored = value; } },
    setTimeout: () => 0, clearTimeout() {},
  }, { timeout: 5000 });
  return {
    ...controller, node,
    get html() { return node('#main').innerHTML; },
    get focused() { return focused; },
    get stored() { return stored; },
    navigate(hash) { location.hash = hash; windowEvents.hashchange(); },
  };
}

test('home prioritizes the next action and keeps all existing entry points', async () => {
  const view = await viewHarness();
  assert.match(view.html, /<h1 tabindex="-1">Твой ритм\.<\/h1>/);
  assert.match(view.html, /id="next-visit-title">Когда тебе удобно\?/);
  assert.match(view.html, /class="primary visit-cta" href="#schedule"/);
  for (const route of ['profile/visits', 'profile/passes', 'shop']) assert.ok(view.html.includes(`href="#${route}"`));
  assert.match(view.html, /data-action="about"/);
  assert.match(view.html, /без реальной записи и оплаты/);
  assert.ok(view.html.indexOf('class="next-visit"') < view.html.indexOf('class="studio-glimpse"'));
  assert.doesNotMatch(view.html, /hero-card|hero-copy|<em>/);
});

test('home selects the earliest active demo booking without changing saved data', async () => {
  const sessions = demo.buildSessions('2026-09-07').filter((item) => item.day === 0 && item.seats > 0).sort((a, b) => a.time.localeCompare(b.time));
  let state = demo.initialState('2026-09-07');
  for (const session of [sessions[2], sessions[1], sessions[0]]) state = demo.bookDemoSession(state, session.id, null).state;
  state = demo.cancelDemoSession(state, sessions[0].id).state;
  const before = JSON.stringify(state);
  const view = await viewHarness(state);
  assert.match(view.html, /Твоя демо-запись/);
  assert.ok(view.html.includes(`id="next-visit-title">${sessions[1].title}</h2>`));
  assert.ok(view.html.includes(`<strong>${sessions[1].time}</strong>`));
  assert.match(view.html, /class="primary visit-cta" href="#profile\/visits"/);
  assert.equal(view.stored, before);
  assert.equal(JSON.stringify(state), before);
});

test('schedule keeps seven days and chronologically ordered actionable rows', async () => {
  const view = await viewHarness(undefined, '#schedule');
  assert.equal((view.html.match(/class="day-button"/g) ?? []).length, 7);
  const rows = [...view.html.matchAll(/class="session-row [^"]*" data-action="session" data-id="([^"]+)"/g)].map((match) => match[1]);
  const sessions = demo.buildSessions('2026-09-07').filter((item) => item.day === 0).sort((a, b) => a.time.localeCompare(b.time));
  assert.deepEqual(rows, sessions.map((item) => item.id));
  for (const session of sessions) {
    const row = view.sessionCard(session);
    assert.ok(row.includes(session.time) && row.includes(`${session.minutes} мин`));
    assert.ok(row.includes(demo.trainers.find((trainer) => trainer.id === session.trainer).name));
    assert.match(row, /aria-label="[^"]+свободных мест: \d+"/);
  }
});

test('day and category filters, empty state and reset keep working after the restyle', async () => {
  const view = await viewHarness(undefined, '#schedule');
  view.actions.category({ dataset: { id: 'strength' } });
  assert.equal(view.focused, '#main [data-action="category"][data-id="strength"]');
  assert.match(view.html, /Силовой тренинг/);
  assert.doesNotMatch(view.html, /<strong>Пилатес<\/strong>/);
  view.actions.day({ dataset: { day: '6' } });
  assert.equal(view.focused, '#main [data-day="6"]');
  assert.match(view.html, /Здесь пока свободный день/);
  assert.doesNotMatch(view.html, /class="session-row /);
  view.actions['reset-filters']();
  assert.match(view.html, /data-day="0" aria-pressed="true"/);
  assert.match(view.html, /data-id="all" aria-pressed="true"/);
  assert.equal(view.focused, '#main h1');
});

test('full and booked rows preserve their details and demo safeguards', async () => {
  const sessions = demo.buildSessions('2026-09-07');
  const full = sessions.find((item) => item.seats === 0);
  const available = sessions.find((item) => item.seats > 0);
  const state = demo.bookDemoSession(demo.initialState('2026-09-07'), available.id, null).state;
  const view = await viewHarness(state, '#schedule');
  assert.match(view.sessionCard(full), /Мест нет/);
  assert.doesNotMatch(view.sessionCard(full), /disabled/);
  view.sessionSheet(full.id);
  assert.equal(view.node('#sheet').open, true);
  assert.match(view.node('#sheet-content').innerHTML, /disabled>Мест нет/);
  assert.doesNotMatch(view.node('#sheet-content').innerHTML, /data-action="confirm-booking"/);
  assert.match(view.sessionCard(available), /class="session-row booked"/);
  assert.match(view.sessionCard(available), /Вы записаны/);
  view.sessionSheet(available.id);
  assert.match(view.node('#sheet-content').innerHTML, /data-action="open-visits"/);
});

test('the visual scope follows home and schedule without touching the other views', async () => {
  const view = await viewHarness();
  const before = view.stored;
  assert.equal(view.node('#main').classList.contains('rhythm-view'), true);
  for (const route of ['schedule', 'profile', 'shop', 'trainers', 'not-a-route']) {
    view.navigate(`#${route}`);
    const resolved = route === 'not-a-route' ? 'home' : route;
    assert.equal(view.route(), resolved);
    assert.equal(view.node('#main').classList.contains('rhythm-view'), ['home', 'schedule'].includes(resolved));
    assert.ok(view.node('#mobile-nav').innerHTML.includes(`href="#${resolved}" aria-current="page"`));
    assert.equal(view.focused, '#main h1');
  }
  assert.equal(view.stored, before);
});
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
  assert.match(js, /<a class="menu-button" href="\.\.\/">[^\n]*На сайт студии/);
  assert.match(html, /href="\.\.\/">Вернуться на сайт/);
  assert.match(css, /main h1\[tabindex="-1"\]:focus\s*\{\s*outline:\s*none;/);
  assert.match(css, /:focus-visible\s*\{outline:3px solid/);
  assert.match(js, /querySelector\('h1'\)\?\.focus\(\{ preventScroll: true \}\)/);
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
