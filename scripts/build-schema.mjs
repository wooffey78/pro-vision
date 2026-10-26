#!/usr/bin/env node
// Écrit docs/schemas/projet.schema.json à partir de la source unique (public/js/core/schema.js).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './lib-node.mjs';
import { SCHEMA_PROJET } from '../public/js/core/schema.js';
writeFileSync(join(RACINE, 'docs/schemas/projet.schema.json'), JSON.stringify(SCHEMA_PROJET, null, 2) + '\n');
console.log('docs/schemas/projet.schema.json écrit');
