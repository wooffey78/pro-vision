#!/usr/bin/env node
// Génère public/config/fonts.config.json à partir de la table ci-dessous et des fichiers réellement installés.
// Chaque famille a un rôle : « titre », « texte » ou « les deux ». Les couples sont calculés par
// affinité d'ambiances (deux textes par titre) : déterministe et sans dépendance à l'exécution.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './lib-node.mjs';

// [id, nom, catégorie, rôle, ambiances]
const T = [
  ['atkinson-hyperlegible', 'Atkinson Hyperlegible', 'sans-serif', 'texte', ['rassurant', 'sérieux']],
  ['inter', 'Inter', 'sans-serif', 'les deux', ['moderne', 'minimaliste', 'sérieux']],
  ['montserrat', 'Montserrat', 'sans-serif', 'les deux', ['moderne', 'audacieux', 'minimaliste']],
  ['lora', 'Lora', 'serif', 'les deux', ['chaleureux', 'rassurant', 'artisanal']],
  ['playfair-display', 'Playfair Display', 'serif', 'titre', ['élégant', 'premium']],
  ['merriweather', 'Merriweather', 'serif', 'texte', ['sérieux', 'rassurant']],
  ['nunito', 'Nunito', 'arrondie', 'les deux', ['doux', 'chaleureux', 'naturel']],
  ['quicksand', 'Quicksand', 'arrondie', 'titre', ['joyeux', 'doux']],
  ['fraunces', 'Fraunces', 'serif', 'titre', ['chaleureux', 'doux', 'artisanal']],
  ['dm-serif-display', 'DM Serif Display', 'serif', 'titre', ['premium', 'élégant', 'sérieux']],
  ['ibm-plex-mono', 'IBM Plex Mono', 'monospace', 'texte', ['moderne', 'sérieux', 'minimaliste']],
  ['caveat', 'Caveat', 'script', 'titre', ['artisanal', 'joyeux']],
  ['open-sans', 'Open Sans', 'sans-serif', 'les deux', ['sérieux', 'rassurant', 'minimaliste']],
  ['roboto', 'Roboto', 'sans-serif', 'les deux', ['moderne', 'sérieux', 'minimaliste']],
  ['lato', 'Lato', 'sans-serif', 'les deux', ['rassurant', 'chaleureux', 'doux']],
  ['poppins', 'Poppins', 'sans-serif', 'les deux', ['moderne', 'joyeux', 'audacieux']],
  ['raleway', 'Raleway', 'sans-serif', 'les deux', ['élégant', 'minimaliste', 'premium']],
  ['oswald', 'Oswald', 'display', 'titre', ['audacieux', 'sérieux', 'moderne']],
  ['bebas-neue', 'Bebas Neue', 'display', 'titre', ['audacieux', 'moderne']],
  ['pacifico', 'Pacifico', 'script', 'titre', ['joyeux', 'artisanal', 'doux']],
  ['dancing-script', 'Dancing Script', 'script', 'titre', ['élégant', 'doux', 'artisanal']],
  ['lobster', 'Lobster', 'script', 'titre', ['joyeux', 'audacieux', 'artisanal']],
  ['cormorant-garamond', 'Cormorant Garamond', 'serif', 'les deux', ['élégant', 'premium', 'naturel']],
  ['libre-baskerville', 'Libre Baskerville', 'serif', 'les deux', ['sérieux', 'premium', 'artisanal']],
  ['crimson-pro', 'Crimson Pro', 'serif', 'texte', ['chaleureux', 'sérieux']],
  ['eb-garamond', 'EB Garamond', 'serif', 'les deux', ['élégant', 'premium', 'naturel']],
  ['bitter', 'Bitter', 'slab', 'les deux', ['sérieux', 'rassurant', 'artisanal']],
  ['josefin-sans', 'Josefin Sans', 'sans-serif', 'titre', ['élégant', 'minimaliste', 'premium']],
  ['work-sans', 'Work Sans', 'sans-serif', 'texte', ['moderne', 'minimaliste']],
  ['karla', 'Karla', 'sans-serif', 'texte', ['moderne', 'doux']],
  ['rubik', 'Rubik', 'sans-serif', 'les deux', ['joyeux', 'moderne', 'doux']],
  ['mulish', 'Mulish', 'sans-serif', 'les deux', ['doux', 'minimaliste', 'moderne']],
  ['manrope', 'Manrope', 'sans-serif', 'les deux', ['moderne', 'minimaliste']],
  ['outfit', 'Outfit', 'sans-serif', 'les deux', ['moderne', 'minimaliste', 'joyeux']],
  ['sora', 'Sora', 'sans-serif', 'les deux', ['moderne', 'audacieux']],
  ['lexend', 'Lexend', 'sans-serif', 'les deux', ['rassurant', 'moderne']],
  ['space-grotesk', 'Space Grotesk', 'sans-serif', 'les deux', ['moderne', 'audacieux', 'sérieux']],
  ['syne', 'Syne', 'display', 'titre', ['audacieux', 'artisanal', 'moderne']],
  ['unbounded', 'Unbounded', 'display', 'titre', ['audacieux', 'joyeux', 'moderne']],
  ['bricolage-grotesque', 'Bricolage Grotesque', 'sans-serif', 'les deux', ['audacieux', 'artisanal', 'moderne']],
  ['figtree', 'Figtree', 'sans-serif', 'les deux', ['moderne', 'rassurant']],
  ['urbanist', 'Urbanist', 'sans-serif', 'les deux', ['moderne', 'minimaliste']],
  ['jost', 'Jost', 'sans-serif', 'les deux', ['élégant', 'moderne', 'minimaliste']],
  ['archivo', 'Archivo', 'sans-serif', 'les deux', ['sérieux', 'audacieux']],
  ['barlow', 'Barlow', 'sans-serif', 'les deux', ['sérieux', 'moderne', 'audacieux']],
  ['anton', 'Anton', 'display', 'titre', ['audacieux', 'sérieux']],
  ['righteous', 'Righteous', 'display', 'titre', ['joyeux', 'audacieux']],
  ['abril-fatface', 'Abril Fatface', 'display', 'titre', ['premium', 'élégant', 'audacieux']],
  ['cinzel', 'Cinzel', 'serif', 'titre', ['premium', 'élégant']],
  ['marcellus', 'Marcellus', 'serif', 'titre', ['élégant', 'naturel', 'premium']],
  ['yeseva-one', 'Yeseva One', 'display', 'titre', ['élégant', 'audacieux']],
  ['dm-sans', 'DM Sans', 'sans-serif', 'les deux', ['moderne', 'doux']],
  ['plus-jakarta-sans', 'Plus Jakarta Sans', 'sans-serif', 'les deux', ['moderne', 'rassurant']],
  ['source-sans-3', 'Source Sans 3', 'sans-serif', 'texte', ['sérieux', 'rassurant']],
  ['pt-serif', 'PT Serif', 'serif', 'texte', ['sérieux', 'chaleureux']],
  ['gloock', 'Gloock', 'serif', 'titre', ['premium', 'élégant', 'audacieux']],
  ['bodoni-moda', 'Bodoni Moda', 'serif', 'titre', ['premium', 'élégant']],
  ['italiana', 'Italiana', 'serif', 'titre', ['élégant', 'premium', 'minimaliste']],
  ['tenor-sans', 'Tenor Sans', 'sans-serif', 'titre', ['élégant', 'minimaliste', 'naturel']],
  ['kalam', 'Kalam', 'script', 'titre', ['artisanal', 'joyeux', 'doux']],
  ['permanent-marker', 'Permanent Marker', 'script', 'titre', ['audacieux', 'joyeux']],
  ['amatic-sc', 'Amatic SC', 'script', 'titre', ['artisanal', 'naturel', 'doux']],
  ['satisfy', 'Satisfy', 'script', 'titre', ['élégant', 'doux']],
  ['courgette', 'Courgette', 'script', 'titre', ['joyeux', 'doux']],
  ['bungee', 'Bungee', 'display', 'titre', ['audacieux', 'joyeux', 'moderne']],
  ['chivo', 'Chivo', 'sans-serif', 'les deux', ['moderne', 'sérieux']],
  ['zilla-slab', 'Zilla Slab', 'slab', 'les deux', ['artisanal', 'sérieux']],
  ['arvo', 'Arvo', 'slab', 'les deux', ['artisanal', 'naturel']],
  ['cabin', 'Cabin', 'sans-serif', 'les deux', ['chaleureux', 'rassurant']],
  ['jetbrains-mono', 'JetBrains Mono', 'monospace', 'texte', ['moderne', 'sérieux', 'minimaliste']],
  ['space-mono', 'Space Mono', 'monospace', 'les deux', ['audacieux', 'moderne']],
  ['fjalla-one', 'Fjalla One', 'display', 'titre', ['audacieux', 'sérieux']],
  ['hanken-grotesk', 'Hanken Grotesk', 'sans-serif', 'les deux', ['moderne', 'minimaliste']],
  ['noto-serif-display', 'Noto Serif Display', 'serif', 'titre', ['élégant', 'premium', 'sérieux']]
];

const T_SUITE = [
  ['alegreya', 'Alegreya', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['alegreya-sans', 'Alegreya Sans', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['amaranth', 'Amaranth', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['anonymous-pro', 'Anonymous Pro', 'monospace', 'texte', ['moderne','sérieux']],
  ['arimo', 'Arimo', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['asap', 'Asap', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['assistant', 'Assistant', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['baloo-2', 'Baloo 2', 'arrondie', 'les deux', ['doux','joyeux']],
  ['bangers', 'Bangers', 'display', 'titre', ['audacieux','moderne']],
  ['barlow-condensed', 'Barlow Condensed', 'display', 'titre', ['audacieux','moderne']],
  ['be-vietnam-pro', 'Be Vietnam Pro', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['bevan', 'Bevan', 'slab', 'titre', ['artisanal','sérieux']],
  ['bowlby-one', 'Bowlby One', 'display', 'titre', ['audacieux','moderne']],
  ['cairo', 'Cairo', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['caprasimo', 'Caprasimo', 'display', 'titre', ['audacieux','moderne']],
  ['catamaran', 'Catamaran', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['chakra-petch', 'Chakra Petch', 'display', 'titre', ['audacieux','moderne']],
  ['comfortaa', 'Comfortaa', 'arrondie', 'les deux', ['doux','joyeux']],
  ['cormorant', 'Cormorant', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['cuprum', 'Cuprum', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['dela-gothic-one', 'Dela Gothic One', 'display', 'titre', ['audacieux','moderne']],
  ['dosis', 'Dosis', 'arrondie', 'les deux', ['doux','joyeux']],
  ['domine', 'Domine', 'serif', 'texte', ['élégant','premium','chaleureux']],
  ['exo', 'Exo', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['fira-sans', 'Fira Sans', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['frank-ruhl-libre', 'Frank Ruhl Libre', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['gelasio', 'Gelasio', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['gilda-display', 'Gilda Display', 'serif', 'titre', ['élégant','premium','chaleureux']],
  ['glory', 'Glory', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['gothic-a1', 'Gothic A1', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['hind', 'Hind', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['ibm-plex-sans', 'IBM Plex Sans', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['ibm-plex-serif', 'IBM Plex Serif', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['instrument-sans', 'Instrument Sans', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['instrument-serif', 'Instrument Serif', 'serif', 'titre', ['élégant','premium','chaleureux']],
  ['kanit', 'Kanit', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['kumbh-sans', 'Kumbh Sans', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['lilita-one', 'Lilita One', 'display', 'titre', ['audacieux','moderne']],
  ['literata', 'Literata', 'serif', 'texte', ['élégant','premium','chaleureux']],
  ['lobster-two', 'Lobster Two', 'script', 'titre', ['joyeux','artisanal','doux']],
  ['maven-pro', 'Maven Pro', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['mukta', 'Mukta', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['newsreader', 'Newsreader', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['noto-sans', 'Noto Sans', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['orbitron', 'Orbitron', 'display', 'titre', ['audacieux','moderne']],
  ['overpass', 'Overpass', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['oxygen', 'Oxygen', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['philosopher', 'Philosopher', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['prata', 'Prata', 'serif', 'titre', ['élégant','premium','chaleureux']],
  ['prompt', 'Prompt', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['quattrocento', 'Quattrocento', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['red-hat-display', 'Red Hat Display', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['roboto-condensed', 'Roboto Condensed', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['roboto-mono', 'Roboto Mono', 'monospace', 'texte', ['moderne','sérieux']],
  ['rowdies', 'Rowdies', 'display', 'titre', ['audacieux','moderne']],
  ['sansita', 'Sansita', 'display', 'titre', ['audacieux','moderne']],
  ['signika', 'Signika', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['spectral', 'Spectral', 'serif', 'texte', ['élégant','premium','chaleureux']],
  ['syncopate', 'Syncopate', 'sans-serif', 'titre', ['moderne','minimaliste']],
  ['teko', 'Teko', 'display', 'titre', ['audacieux','moderne']],
  ['vollkorn', 'Vollkorn', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['fredoka', 'Fredoka', 'arrondie', 'les deux', ['doux','joyeux']],
  ['chewy', 'Chewy', 'script', 'titre', ['joyeux','artisanal','doux']],
  ['comic-neue', 'Comic Neue', 'script', 'texte', ['joyeux','artisanal','doux']],
  ['indie-flower', 'Indie Flower', 'script', 'titre', ['joyeux','artisanal','doux']],
  ['architects-daughter', 'Architects Daughter', 'script', 'titre', ['joyeux','artisanal','doux']],
  ['caveat-brush', 'Caveat Brush', 'script', 'titre', ['joyeux','artisanal','doux']],
  ['homemade-apple', 'Homemade Apple', 'script', 'titre', ['joyeux','artisanal','doux']],
  ['monoton', 'Monoton', 'display', 'titre', ['audacieux','moderne']],
  ['rubik-mono-one', 'Rubik Mono One', 'display', 'titre', ['audacieux','moderne']],
  ['bagel-fat-one', 'Bagel Fat One', 'display', 'titre', ['audacieux','moderne']],
  ['cherry-bomb-one', 'Cherry Bomb One', 'display', 'titre', ['audacieux','moderne']],
  ['vidaloka', 'Vidaloka', 'serif', 'titre', ['élégant','premium','chaleureux']],
  ['young-serif', 'Young Serif', 'serif', 'titre', ['élégant','premium','chaleureux']],
  ['rozha-one', 'Rozha One', 'serif', 'titre', ['élégant','premium','chaleureux']],
  ['shrikhand', 'Shrikhand', 'script', 'titre', ['joyeux','artisanal','doux']],
  ['unica-one', 'Unica One', 'display', 'titre', ['audacieux','moderne']],
  ['zen-kaku-gothic-new', 'Zen Kaku Gothic New', 'sans-serif', 'les deux', ['moderne','minimaliste']],
  ['bungee-shade', 'Bungee Shade', 'display', 'titre', ['audacieux','moderne']],
  ['climate-crisis', 'Climate Crisis', 'display', 'titre', ['audacieux','moderne']],
  ['almendra', 'Almendra', 'serif', 'les deux', ['élégant','premium','chaleureux']],
  ['belleza', 'Belleza', 'sans-serif', 'titre', ['moderne','minimaliste']],
];

const PILE = {
  'sans-serif': 'system-ui,sans-serif', arrondie: 'ui-rounded,system-ui,sans-serif', serif: 'Georgia,serif', slab: 'Georgia,serif',
  display: 'sans-serif', script: "'Comic Sans MS',cursive", monospace: 'ui-monospace,monospace'
};
const cheminNm = (id) => join(RACINE, 'node_modules/@fontsource', id, 'files');

const familles = [...T, ...T_SUITE].map(([id, nom, categorie, role, ambiances]) => {
  const dispo = existsSync(cheminNm(id)) ? readdirSync(cheminNm(id)) : [];
  const poids = [400, 700].filter((w) => dispo.includes(`${id}-latin-${w}-normal.woff2`));
  if (!poids.includes(400)) throw new Error(`${id} : graisse 400 absente (npm i requis)`);
  const pile = `'${nom}',${PILE[categorie]}`;
  return { id, nom, categorie, role, ambiances, pile: nom.includes(' ') ? pile : pile.replace(`'${nom}'`, nom), poids };
});

// Couples : pour chaque titre, les deux textes les plus proches (ambiances communes, autre famille).
const textes = familles.filter((f) => f.role !== 'titre');
const titres = familles.filter((f) => f.role !== 'texte');
const couples = [];
for (const t of titres) {
  const candidats = textes
    .filter((x) => x.id !== t.id)
    .map((x) => ({ x, score: x.ambiances.filter((a) => t.ambiances.includes(a)).length * 2 + (x.categorie !== t.categorie ? 1 : 0) + (t.categorie === 'script' && x.categorie === 'sans-serif' ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || a.x.id.localeCompare(b.x.id))
    .slice(0, 2);
  for (const { x } of candidats) {
    couples.push({ id: `${t.id}-${x.id}`, titres: t.id, texte: x.id, ambiances: [...new Set([...t.ambiances, ...x.ambiances])] });
  }
}

writeFileSync(join(RACINE, 'public/config/fonts.config.json'), JSON.stringify({ familles: familles.map(({ role, ...f }) => f), couples }, null, 1) + '\n');
console.log(`fonts : ${familles.length} familles, ${couples.length} couples`);
