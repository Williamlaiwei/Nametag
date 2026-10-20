// 從 raster/*.mjs 產生的 JSON 讀成和手描來源(us-*.source.mjs)相同的形狀:LAYERS、toCanvas、DEFAULT_COLORS。
// JSON 裡的座標已經是 1000×1400 畫布座標,所以 toCanvas 是恆等轉換。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export function loadJsonSource(file) {
  const j = JSON.parse(readFileSync(join(here, 'data', file), 'utf8'));
  const byKey = (prefix, obj, pick) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [`${prefix}${k}`, pick(v)]));
  const LAYERS = [
    { id: 'hair_back', warp: 'head', variants: j.hairBack ? byKey('h', j.hairBack, (v) => v) : null },
    { id: 'body', warp: 'body', variants: { '': j.body } },
    { id: 'figure', warp: 'body', variants: null, note: '身材加強層由程式伸縮,不需要獨立圖層' },
    { id: 'bottom', warp: 'body', variants: byKey('o', j.outfits, (o) => o.bottom) },
    { id: 'top', warp: 'body', variants: byKey('o', j.outfits, (o) => o.top) },
    { id: 'shoes', warp: 'shift', variants: byKey('o', j.outfits, (o) => o.shoes) },
    { id: 'head', warp: 'head', variants: { '': j.head } },
    { id: 'glasses', warp: 'head', optional: true, variants: j.glasses ? { '': j.glasses } : null },
    { id: 'hair_front', warp: 'head', variants: byKey('h', j.hairs, (v) => v) },
  ];
  return { LAYERS, toCanvas: { k: 1, x: (x) => x, y: (y) => y }, DEFAULT_COLORS: j.defaults, meta: j };
}
