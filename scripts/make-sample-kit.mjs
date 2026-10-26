#!/usr/bin/env node
// Génère un kit d'exemple complet dans out/kit-exemple.zip (et dépose les fichiers dans out/kit-exemple/).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { RACINE, chargerContexte, chargerRessources, projetExemple, rasteriseurResvg } from './lib-node.mjs';
import { construireKit } from '../public/js/core/kit.js';
import { creerZip } from '../public/js/services/zip.js';
import * as fflate from '../public/vendor/fflate/fflate.js';

const ctx = chargerContexte();
const projet = await projetExemple(ctx);
const ressources = await chargerRessources(projet, ctx);
const rasterize = await rasteriseurResvg();
if (!rasterize) console.warn('resvg absent : le kit d’exemple sera généré sans PNG.');
const { fichiers, avertissements } = await construireKit(projet, ressources, ctx, { rasterize: rasterize || undefined, version: ctx.app.version });
const sortie = join(RACINE, 'out');
mkdirSync(join(sortie, 'kit-exemple'), { recursive: true });
for (const [chemin, contenu] of Object.entries(fichiers)) {
  const cible = join(sortie, 'kit-exemple', chemin);
  mkdirSync(dirname(cible), { recursive: true });
  writeFileSync(cible, contenu);
}
writeFileSync(join(sortie, 'kit-exemple.zip'), creerZip(fflate, fichiers));
console.log(`kit d'exemple : ${Object.keys(fichiers).length} fichiers → out/kit-exemple.zip`, avertissements.length ? avertissements : '');
