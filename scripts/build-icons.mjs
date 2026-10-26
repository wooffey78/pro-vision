#!/usr/bin/env node
// Génère les icônes de l'application (PNG) à partir du logo SVG, avec resvg (devDependency, utilisée ici uniquement).
// Les PNG générés sont versionnés : ce script n'est PAS nécessaire pour faire tourner l'application.
// Sans resvg : ouvrez scripts/build-icons.html dans un navigateur et enregistrez les images.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE, PUBLIC, chargerPolice } from './lib-node.mjs';
import { texteVersTraces } from '../public/js/core/textToPath.js';

let Resvg;
try { ({ Resvg } = await import('@resvg/resvg-js')); } catch { console.error('resvg absent : utilisez scripts/build-icons.html'); process.exit(1); }
const logo = readFileSync(join(PUBLIC, 'assets/logo/provision.svg'), 'utf8');
const rendre = (svg, w) => new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng();
const ecrire = (nom, buf) => { writeFileSync(join(PUBLIC, 'assets/icons', nom), buf); console.log('écrit', nom); };

ecrire('favicon-32.png', rendre(logo, 32));
ecrire('apple-touch-icon.png', rendre(logo, 180));
ecrire('icon-192.png', rendre(logo, 192));
ecrire('icon-512.png', rendre(logo, 512));
// Icône « maskable » : fond plein, glyphe réduit dans la zone sûre (80 %)
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#173b37"/><g transform="translate(9.6 9.6) scale(0.7)"><circle cx="30" cy="34" r="15" fill="none" stroke="#f6f7f2" stroke-width="6"/><path d="M43 17h7v7h-7z" fill="#c46b43"/></g></svg>`;
ecrire('icon-maskable-512.png', rendre(maskable, 512));
// Image de partage 1200×630 (texte converti en tracés avec le moteur du projet : pas de dépendance de police)
const fraunces = await chargerPolice('inter', 700);
const atk = await chargerPolice('inter', 400);
const titre = texteVersTraces(fraunces, 'Pro-vision', { taille: 120, espacement: 0.01 });
const sous = texteVersTraces(atk, 'Votre identité visuelle de départ.', { taille: 44 });
const sous2 = texteVersTraces(atk, 'Gratuit · sans compte · dans votre navigateur', { taille: 34 });
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f6f7f2"/><rect x="80" y="170" width="150" height="150" rx="42" fill="#173b37"/><circle cx="148" cy="256" r="35" fill="none" stroke="#f6f7f2" stroke-width="14"/><path d="M182 200h16v16h-16z" fill="#c46b43"/><path transform="translate(270 275)" d="${titre.d}" fill="#173b37"/><path transform="translate(80 400)" d="${sous.d}" fill="#173b37"/><path transform="translate(80 460)" d="${sous2.d}" fill="#53665d"/><rect x="0" y="612" width="1200" height="18" fill="#c46b43"/></svg>`;
ecrire('og-image.png', rendre(og, 1200));
