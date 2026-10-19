// 渲染測試:三個體型各輸出一張合成預覽 PNG,並檢查透明背景、圖層順序、對齊。
// 執行:npm run avatar:test
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { canvasLayers, composeSvg, layerSvg, BUILD_SCALES, DEFAULT_COLORS } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'assets/avatar/previews');
mkdirSync(out, { recursive: true });
const layers = canvasLayers();
const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures.push(msg);
};

const render = (svg) => new Resvg(svg, { fitTo: { mode: 'original' } }).render();
const bbox = (img) => {
  const { width: W, height: H, pixels: px } = img;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (px[(y * W + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  return { minX, minY, maxX, maxY };
};

// 1. 圖層順序
const order = layers.map((l) => l.id).join(',');
check(order === 'hair_back,body,figure,bottom,top,shoes,head,glasses,hair_front', `圖層順序符合規格:${order}`);

// 2. 三個體型
const boxes = {};
for (const [name, w] of Object.entries(BUILD_SCALES)) {
  const svg = composeSvg(layers, w, DEFAULT_COLORS);
  const png = render(svg);
  writeFileSync(join(out, `us_3_m_${name}.png`), png.asPng());
  writeFileSync(join(out, `us_3_m_${name}.svg`), svg);
  const b = bbox(png);
  boxes[name] = b;
  const px = png.pixels;
  const W = png.width;
  const H = png.height;
  const corners = [0, (W - 1) * 4, (H - 1) * W * 4, (H * W - 1) * 4];
  check(W === 1000 && H === 1400, `${name}: 畫布 1000×1400`);
  check(corners.every((o) => px[o + 3] === 0), `${name}: 四個角落透明`);
  check(Math.abs(b.maxY - 1330) <= 14, `${name}: 腳底 y=${b.maxY}(目標 1330,允許外框線 ±14)`);
  check(b.minY < 150 && b.minY > 40, `${name}: 髮頂 y=${b.minY}(臉頂在 150,頭髮在其上)`);
  check(b.minX > 20 && b.maxX < 980, `${name}: 左右在畫布內 x=${b.minX}–${b.maxX}`);
}
const width = (n) => boxes[n].maxX - boxes[n].minX;
check(width('slim') < width('normal') && width('normal') < width('heavy'), `寬度 瘦 ${width('slim')} < 普通 ${width('normal')} < 壯 ${width('heavy')}`);
check(
  Math.abs(boxes.slim.maxY - boxes.heavy.maxY) <= 2 && Math.abs(boxes.slim.minY - boxes.heavy.minY) <= 2,
  '三種體型頭頂與腳底位置一致(頭不縮放)',
);

// 3. 換色:四個區域各自換色後,畫面要有變化
const base = render(composeSvg(layers, 1, DEFAULT_COLORS)).pixels;
for (const key of ['skin', 'hair', 'top', 'bottom']) {
  const alt = render(composeSvg(layers, 1, { ...DEFAULT_COLORS, [key]: '#FF00AA' })).pixels;
  let diff = 0;
  for (let i = 0; i < base.length; i += 4) if (base[i] !== alt[i] || base[i + 1] !== alt[i + 1]) diff++;
  check(diff > 800, `換色:${key} 可獨立換色(${diff} 像素改變)`);
}

// 4. 每個有圖的圖層單獨輸出,尺寸一致且背景透明
for (const l of layers.filter((x) => x.shapes)) {
  const png = render(layerSvg(l, 1, DEFAULT_COLORS));
  check(png.width === 1000 && png.height === 1400 && png.pixels[3] === 0, `${l.id}: 單層 1000×1400、背景透明`);
}

// 5. 並排預覽(白底,方便看)
const inner = (n) =>
  composeSvg(layers, BUILD_SCALES[n], DEFAULT_COLORS, { glasses: true }).replace(/^<svg[^>]*>/, '').replace('</svg>', '');
const sideBySide = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 1400" width="3000" height="1400"><rect width="3000" height="1400" fill="#fff"/>${['slim', 'normal', 'heavy']
  .map((n, i) => `<g transform="translate(${i * 1000} 0)">${inner(n)}</g>`)
  .join('')}</svg>`;
writeFileSync(join(out, 'us_3_m_all.png'), render(sideBySide).asPng());

console.log(failures.length ? `\n${failures.length} 項失敗` : '\n全部通過');
process.exit(failures.length ? 1 : 0);
