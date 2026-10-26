import test from 'node:test';
import assert from 'node:assert/strict';
import { serveur, resoudre, entetesSecurite } from '../server/server.js';

let base;
test.before(async () => { await new Promise((r) => serveur.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${serveur.address().port}`; });
test.after(() => serveur.close());

test('résolution de chemins : traversée de répertoire impossible', () => {
  for (const u of ['/../server/server.js', '/..%2fpackage.json', '/%2e%2e/%2e%2e/etc/passwd', '/a/../../package.json', '/x%00.html', '/%E0%A4%A']) assert.equal(resoudre(u), null, u);
  assert.ok(resoudre('/').endsWith('index.html'));
  assert.ok(resoudre('/css/base.css?v=1').endsWith('base.css'));
});
test('index servi avec en-têtes de sécurité', async () => {
  const r = await fetch(`${base}/`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/html/);
  const csp = r.headers.get('content-security-policy');
  assert.match(csp, /default-src 'none'/); assert.match(csp, /frame-ancestors 'none'/); assert.ok(!csp.includes('unsafe'));
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(r.headers.get('strict-transport-security'), null);
});
test('HSTS seulement derrière HTTPS', () => {
  assert.ok(entetesSecurite({ headers: { 'x-forwarded-proto': 'https' } })['Strict-Transport-Security']);
  assert.ok(!entetesSecurite({ headers: {} })['Strict-Transport-Security']);
});
test('types MIME et cache', async () => {
  assert.match((await fetch(`${base}/js/app.js`)).headers.get('content-type'), /javascript/);
  assert.match((await fetch(`${base}/vendor/fonts/lora/lora-400.woff2`)).headers.get('content-type'), /woff2/);
  assert.match((await fetch(`${base}/vendor/fonts/lora/lora-400.woff2`)).headers.get('cache-control'), /immutable/);
  assert.equal((await fetch(`${base}/sw.js`)).headers.get('cache-control'), 'no-cache');
  assert.match((await fetch(`${base}/manifest.webmanifest`)).headers.get('content-type'), /manifest\+json/);
});
test('404, méthodes non autorisées, healthz', async () => {
  assert.equal((await fetch(`${base}/nexiste-pas.html`)).status, 404);
  assert.equal((await fetch(`${base}/`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  assert.equal((await fetch(`${base}/..%2f..%2fetc%2fpasswd`)).status === 200, false);
  assert.equal((await fetch(`${base}/`, { method: 'HEAD' })).status, 200);
});
test('pages légales accessibles', async () => {
  for (const p of ['mentions-legales', 'confidentialite', 'cgu', 'accessibilite']) assert.equal((await fetch(`${base}/legal/${p}.html`)).status, 200);
});
