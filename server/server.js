// Serveur statique minimal, sans dépendance : node server/server.js
// Variables : PORT (défaut 8080), HOST (défaut 127.0.0.1 ; 0.0.0.0 en production derrière un proxy).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'public');
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8' };
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

/** En-têtes de sécurité (exportés pour les tests). */
export function entetesSecurite(req) {
  const h = {
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Frame-Options': 'DENY'
  };
  if (req.headers['x-forwarded-proto'] === 'https') h['Strict-Transport-Security'] = 'max-age=31536000';
  return h;
}

/** Chemin demandé → chemin disque sûr, ou null. */
export function resoudre(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]); } catch { return null; }
  if (p.includes('\0')) return null;
  if (p.endsWith('/')) p += 'index.html';
  const complet = normalize(join(RACINE, p));
  return complet === RACINE || complet.startsWith(RACINE + sep) ? complet : null;
}

export const serveur = createServer(async (req, res) => {
  const base = entetesSecurite(req);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { ...base, Allow: 'GET, HEAD' }); return res.end(); }
  if (req.url === '/healthz') { res.writeHead(200, { ...base, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end('ok\n'); }
  const chemin = resoudre(req.url || '/');
  if (!chemin) { res.writeHead(400, base); return res.end('Requête invalide'); }
  try {
    const s = await stat(chemin);
    if (!s.isFile()) throw new Error('pas un fichier');
    const octets = await readFile(chemin);
    const rel = chemin.slice(RACINE.length + 1).split(sep).join('/');
    const cache = rel === 'sw.js' || rel === 'precache.json' || rel === 'index.html' ? 'no-cache' : rel.startsWith('vendor/') || rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';
    res.writeHead(200, { ...base, 'Content-Type': TYPES[extname(chemin)] || 'application/octet-stream', 'Content-Length': octets.length, 'Cache-Control': cache });
    res.end(req.method === 'HEAD' ? undefined : octets);
  } catch {
    res.writeHead(404, { ...base, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Page introuvable');
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  serveur.listen(PORT, HOST, () => console.log(`Pro-vision : http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`));
}
