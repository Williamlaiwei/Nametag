// 產生:src/lib/avatar/usMale.ts、assets/avatar/** 的分層 SVG 與 manifest.json
// 執行:npm run avatar:build
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { canvasLayers, layerSvg, BUILD_SCALES, DEFAULT_COLORS } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const layers = canvasLayers();

// 1. App 用的資料
const ts = `// 由 scripts/avatar/build.mjs 產生,請不要手改(要改去 scripts/avatar/us-male.source.mjs 再重跑)。
// 美式 Emoji 風 · 男 · 20–30 歲。座標為 1000×1400 畫布。

export type Shape = { d: string; fill: string; stroke: string; sw: number; cx?: number };
export type Layer = { id: string; warp: 'body' | 'shift' | 'none'; optional: boolean; shapes: Shape[] | null };

export const US_MALE_LAYERS: Layer[] = ${JSON.stringify(
  layers.map(({ id, warp, optional, shapes }) => ({ id, warp, optional, shapes })),
  null,
  1,
)};

export const US_MALE_DEFAULTS = ${JSON.stringify(DEFAULT_COLORS)};
`;
mkdirSync(join(root, 'src/lib/avatar'), { recursive: true });
writeFileSync(join(root, 'src/lib/avatar/usMale.ts'), ts);

// 2. 分層 SVG + manifest
const base = 'assets/avatar/us/3/m';
mkdirSync(join(root, base), { recursive: true });
const manifest = {
  canvas: { width: 1000, height: 1400 },
  baseline: { footY: 1330, headTopY: 150 },
  referenceImage: 'docs/reference/Gemini_Generated_Image_ck5hsuck5hsuck5h.jpg',
  layerOrder: layers.map((l) => l.id),
  builds: BUILD_SCALES,
  recolor: {
    roles: ['skin', 'skinShade', 'hair', 'hairShade', 'top', 'topShade', 'bottom', 'bottomShade'],
    note: '每個 path 的 data-fill / data-stroke 標明顏色角色;shade 由主色自動加深',
    defaults: DEFAULT_COLORS,
  },
  styles: { us: { 3: { m: {} } } },
};
const files = manifest.styles.us[3].m;
for (const l of layers) {
  if (!l.shapes) {
    files[l.id] = { present: false, note: l.note ?? '' };
    continue;
  }
  if (l.warp === 'none') {
    const f = `${base}/${l.id}.svg`;
    writeFileSync(join(root, f), layerSvg(l, 1, DEFAULT_COLORS));
    files[l.id] = { present: true, optional: l.optional, file: f };
  } else {
    const entry = { present: true, warp: l.warp, files: {} };
    for (const [name, w] of Object.entries(BUILD_SCALES)) {
      const f = `${base}/${l.id}_${name}.svg`;
      writeFileSync(join(root, f), layerSvg(l, w, DEFAULT_COLORS));
      entry.files[name] = f;
    }
    files[l.id] = entry;
  }
}
writeFileSync(join(root, 'assets/avatar/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('avatar build ok:', layers.filter((l) => l.shapes).length, 'layers with art,', layers.filter((l) => !l.shapes).length, 'empty');
