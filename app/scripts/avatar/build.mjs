// 產生:src/lib/avatar/usMale.ts、usFemale.ts,以及 assets/avatar/** 的分層 SVG 與 manifest.json
// 執行:npm run avatar:build
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { canvasLayers, layerFileSvg, BUILD_SCALES } from './lib.mjs';
import { CHARACTERS } from './characters.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
mkdirSync(join(root, 'src/lib/avatar'), { recursive: true });

const manifest = {
  canvas: { width: 1000, height: 1400 },
  baseline: { footY: 1330, headTopY: 150 },
  referenceImages: {},
  builds: BUILD_SCALES,
  height: {
    note: '身高不是等比例縮放:腳底與鞋固定,腿拉長最多(±30%),軀幹 ±8%,頭與頭髮大小不變只平移。公式在 src/lib/avatar/warp.ts 的 heightWarp。',
  },
  figure: {
    note: '身材 0–3:女 = 曲線(胸、腰、臀),男 = 肌肉(肩胸)。由程式對身體與衣服做橫向伸縮(warpPathFigure),不需要獨立圖層。',
  },
  variants: {
    hair: { 0: '光頭(無檔案)', 1: '寸頭', 2: '短髮', 3: '油頭', 4: '長髮' },
    outfit: {
      m: { 0: '汗衫', 1: '短短', 2: '短長', 3: '長長', 4: 'Casual', 5: '正裝' },
      f: { 0: '小可愛', 1: '短褲', 2: '長長', 3: 'Casual', 4: '正裝', 5: '禮服' },
    },
  },
  recolor: {
    roles: ['skin', 'skinShade', 'hair', 'hairShade', 'top', 'topShade', 'bottom', 'bottomShade'],
    note: '每個 path 的 data-fill / data-stroke 標明顏色角色;shade 由主色自動加深',
  },
  styles: {},
};

let count = 0;
for (const ch of CHARACTERS) {
  const layers = canvasLayers(ch);
  manifest.referenceImages[`${ch.style}_${ch.age}_${ch.gender}`] = ch.reference;
  const colors = ch.src.DEFAULT_COLORS;

  const ts = `// 由 scripts/avatar/build.mjs 產生,請不要手改(來源:${ch.style === 'us' ? `scripts/avatar/us-${ch.name}.source.mjs` : `scripts/avatar/raster/${ch.name}.mjs`},改完重跑 npm run avatar:build)。
// ${ch.style} · ${ch.gender === 'm' ? '男' : '女'} · 年紀階段 ${ch.age}。座標為 1000×1400 畫布。
import type { Layer } from '../compose.ts';

export const ${ch.exportName}_LAYERS: Layer[] = ${JSON.stringify(
    layers.map(({ id, warp, optional, variants }) => ({ id, warp, optional, variants })),
    null,
    1,
  )};

export const ${ch.exportName}_DEFAULTS = ${JSON.stringify(colors)};

export const ${ch.exportName}_ZONES = ${JSON.stringify(ch.zones)};

export const ${ch.exportName}_FIGURE_BUMPS: [number, number, number][] | undefined = ${JSON.stringify(ch.figureBumps)};
`;
  mkdirSync(dirname(join(root, 'src/lib/avatar', ch.file)), { recursive: true });
  writeFileSync(join(root, 'src/lib/avatar', ch.file), ts);

  const base = `assets/avatar/${ch.style}/${ch.age}/${ch.gender}`;
  mkdirSync(join(root, base), { recursive: true });
  const files = (((manifest.styles[ch.style] ??= {})[ch.age] ??= {})[ch.gender] = {});
  for (const l of layers) {
    if (!l.variants) {
      files[l.id] = { present: false, note: l.note ?? '' };
      continue;
    }
    const entry = { present: true, warp: l.warp, optional: l.optional, files: {} };
    for (const [key, shapes] of Object.entries(l.variants)) {
      if (shapes.length === 0) {
        entry.files[key || 'base'] = null; // 這個款式刻意沒有這一層(例如洋裝沒有下身)
        continue;
      }
      const stem = key ? `${l.id}_${key}` : l.id;
      if (l.warp === 'body' || l.warp === 'shift') {
        entry.files[key || 'base'] = {};
        for (const [name, w] of Object.entries(BUILD_SCALES)) {
          const f = `${base}/${stem}_${name}.svg`;
          writeFileSync(join(root, f), layerFileSvg(ch, l, shapes, w, colors));
          entry.files[key || 'base'][name] = f;
          count++;
        }
      } else {
        const f = `${base}/${stem}.svg`;
        writeFileSync(join(root, f), layerFileSvg(ch, l, shapes, 1, colors));
        entry.files[key || 'base'] = f;
        count++;
      }
    }
    files[l.id] = entry;
  }
}
writeFileSync(join(root, 'assets/avatar/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('avatar build ok:', count, 'svg files');
