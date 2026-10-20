// 韓漫 · 男 · 20–30 歲:Image/Batch 1-6.jpg(單人)→ scripts/avatar/data/kr-male.json
// 執行:node scripts/avatar/raster/kr-male.mjs(npm run avatar:trace 會把全部角色跑一遍)
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildLayers } from './layers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');

const layers = buildLayers({
  image: join(root, 'Image', 'Batch 1-6.jpg'),
  scale: 2,
  seg: { bgMin: 226, lineLuma: 85, lineChroma: 22, chin: 0.128, shoulder: 0.156, waist: 0.412, ankle: 0.932, waistBand: 28, torsoHalf: 110, brow: 0.077, faceHalf: 44, headShift: 5 },
  shoes: '#8F8A84',
});

const out = {
  source: 'Image/Batch 1-6.jpg',
  style: 'kr',
  age: 3,
  gender: 'm',
  zones: { shoulder: 335, crotch: 750, foot: 1250 },
  defaults: { skin: '#F2B392', hair: '#2A2530', top: '#E8EEF2', bottom: '#5B7FA6' },
  hairs: { 2: layers.hair },
  outfits: { 2: { top: layers.top, bottom: layers.bottom, shoes: layers.shoes } },
  body: layers.body,
  head: layers.head,
};
mkdirSync(join(here, '..', 'data'), { recursive: true });
writeFileSync(join(here, '..', 'data', 'kr-male.json'), JSON.stringify(out));
console.log('kr-male.json', Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, v.reduce((n, s) => n + s.d.length, 0)])));
