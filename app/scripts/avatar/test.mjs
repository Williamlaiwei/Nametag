// 渲染測試:輸出預覽 PNG,並檢查透明背景、圖層順序、對齊、換色、身高比例、身材、全部髮型 × 服裝組合。
// 執行:npm run avatar:test
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { canvasLayers, composeSvg, innerOf, layerFileSvg, BUILD_SCALES, pickShapes, VIEW_TOP } from './lib.mjs';
import { CHARACTERS } from './characters.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'assets/avatar/previews');
mkdirSync(out, { recursive: true });
const failures = [];
let current = '';
const check = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${current}] ${msg}`);
  if (!ok) failures.push(`[${current}] ${msg}`);
};

const render = (svg) => new Resvg(svg, { fitTo: { mode: 'original' } }).render();
/** 回傳 bbox;y 以畫布座標表示(tall 時要加回 VIEW_TOP) */
const bbox = (img, yOffset = 0) => {
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
  return { minX, minY: minY + yOffset, maxX, maxY: maxY + yOffset };
};
const names = ['slim', 'normal', 'heavy'];

function runCharacter(ch) {
  current = ch.name;
  const layers = canvasLayers(ch);
  const colors = ch.src.DEFAULT_COLORS;
  const sel = ch.sel;
  const compose = (s, w, h, opts) => composeSvg(ch, layers, s, w, h, colors, opts);
  const tag = `us_3_${ch.id}`;

  // 1. 圖層順序
  const order = layers.map((l) => l.id).join(',');
  check(order === 'hair_back,body,figure,bottom,top,shoes,head,glasses,hair_front', `圖層順序符合規格:${order}`);

  // 2. 三個體型
  const boxes = {};
  for (const name of names) {
    const svg = compose(sel, BUILD_SCALES[name], 0.5);
    const png = render(svg);
    writeFileSync(join(out, `${tag}_${name}.png`), png.asPng());
    writeFileSync(join(out, `${tag}_${name}.svg`), svg);
    const b = bbox(png);
    boxes[name] = b;
    const px = png.pixels;
    const W = png.width;
    const H = png.height;
    const corners = [0, (W - 1) * 4, (H - 1) * W * 4, (H * W - 1) * 4];
    check(W === 1000 && H === 1400, `${name}: 畫布 1000×1400`);
    check(corners.every((o) => px[o + 3] === 0), `${name}: 四個角落透明`);
    check(Math.abs(b.maxY - 1330) <= 14, `${name}: 腳底 y=${b.maxY}(目標 1330,允許外框線 ±14)`);
    check(b.minY < 160 && b.minY > 20, `${name}: 髮頂 y=${b.minY}`);
    check(b.minX > 10 && b.maxX < 990, `${name}: 左右在畫布內 x=${b.minX}–${b.maxX}`);
  }
  const width = (n) => boxes[n].maxX - boxes[n].minX;
  check(width('slim') < width('normal') && width('normal') < width('heavy'), `寬度 瘦 ${width('slim')} < 普通 ${width('normal')} < 壯 ${width('heavy')}`);

  // 3. 身高:改變比例,不是等比例縮放
  const tallBox = (h, only = null) => bbox(render(compose(sel, 1, h, { tall: true, only })), VIEW_TOP);
  const hs = [0, 0.5, 1].map((h) => ({ h, all: tallBox(h), head: tallBox(h, ['head']) }));
  for (const { h, all } of hs) check(Math.abs(all.maxY - 1330) <= 14, `身高 ${h}: 腳底固定 y=${all.maxY}`);
  const total = hs.map((x) => x.all.maxY - x.all.minY);
  check(total[0] < total[1] && total[1] < total[2], `整體高度 矮 ${total[0]} < 中 ${total[1]} < 高 ${total[2]}`);
  const headW = hs.map((x) => x.head.maxX - x.head.minX);
  const headH = hs.map((x) => x.head.maxY - x.head.minY);
  check(headW.every((v) => Math.abs(v - headW[0]) <= 2) && headH.every((v) => Math.abs(v - headH[0]) <= 2), `頭的大小不隨身高改變(寬 ${headW.join('/')} 高 ${headH.join('/')},允許 ±2)`);
  const ratio = hs.map((x, i) => headH[i] / total[i]);
  check(ratio[0] > ratio[1] && ratio[1] > ratio[2], `頭身比隨身高改變(頭佔全身 ${ratio.map((r) => r.toFixed(3)).join(' > ')}),不是等比例縮放`);
  check(hs[2].all.minY >= VIEW_TOP + 4, `最高的人頭頂 y=${hs[2].all.minY} 在畫面內`);

  // 4. 身材:女 = 腰變窄,男 = 肩胸變寬
  const rowWidth = (f) => {
    const img = render(compose({ ...sel, figure: f }, 1, 0.5, { tall: true, only: ch.id === 'f' ? ['top'] : ['top', 'bottom', 'body'] }));
    const y = (ch.id === 'f' ? 610 : 520) - VIEW_TOP;
    let lo = 1000, hi = -1;
    for (let x = 0; x < 1000; x++) if (img.pixels[(y * 1000 + x) * 4 + 3] > 8) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
    return hi - lo;
  };
  const rowW = [0, 1, 2, 3].map(rowWidth);
  if (ch.id === 'f') check(rowW[3] < rowW[0], `女 曲線:腰部寬度隨身材變窄 ${rowW.join(' → ')}`);
  else check(rowW[3] > rowW[0], `男 肌肉:肩胸寬度隨身材變寬 ${rowW.join(' → ')}`);
  for (const f of [1, 2, 3]) {
    const b = bbox(render(compose({ ...sel, figure: f }, BUILD_SCALES.heavy, 0.5, { tall: true })), VIEW_TOP);
    check(b.minX > 10 && b.maxX < 990, `身材 ${f} + 壯:左右在畫布內 x=${b.minX}–${b.maxX}`);
  }

  // 5. 全部髮型 × 服裝 × 體型 × 身高
  let combos = 0;
  let bad = 0;
  for (let hair = 0; hair <= 4; hair++)
    for (let outfit = 0; outfit <= 5; outfit++)
      for (const w of [BUILD_SCALES.slim, BUILD_SCALES.heavy])
        for (const h of [0, 1]) {
          const png = render(compose({ hair, outfit, glasses: hair % 2 === 0, figure: 3 }, w, h, { tall: true }));
          const b = bbox(png, VIEW_TOP);
          combos++;
          if (!(Math.abs(b.maxY - 1330) <= 14 && b.minX > 10 && b.maxX < 990 && b.minY >= VIEW_TOP + 2)) {
            bad++;
            console.log('   超出範圍:', { hair, outfit, w, h, b });
          }
        }
  check(bad === 0, `髮型 5 × 服裝 6 × 體型 × 身高(身材最大)共 ${combos} 種組合,腳底與邊界都正常`);
  for (let hair = 1; hair <= 4; hair++) check(!!pickShapes(layers.find((l) => l.id === 'hair_front'), { ...sel, hair }), `髮型 ${hair} 有前髮`);
  for (let outfit = 0; outfit <= 5; outfit++) {
    const hasTop = !!pickShapes(layers.find((l) => l.id === 'top'), { ...sel, outfit });
    const hasBottom = pickShapes(layers.find((l) => l.id === 'bottom'), { ...sel, outfit }) !== null;
    check(hasTop && hasBottom, `服裝 ${outfit} 有上衣與下身(洋裝的下身是空陣列,代表刻意沒有)`);
  }

  // 6. 換色
  const base = render(compose(sel, 1, 0.5)).pixels;
  for (const key of ['skin', 'hair', 'top', 'bottom']) {
    const alt = render(composeSvg(ch, layers, sel, 1, 0.5, { ...colors, [key]: '#FF00AA' })).pixels;
    let diff = 0;
    for (let i = 0; i < base.length; i += 4) if (base[i] !== alt[i] || base[i + 1] !== alt[i + 1]) diff++;
    check(diff > 500, `換色:${key} 可獨立換色(${diff} 像素改變)`);
  }

  // 7. 每個有圖的圖層單獨輸出,尺寸一致且背景透明
  let badLayer = 0;
  for (const l of layers.filter((x) => x.variants))
    for (const [key, shapes] of Object.entries(l.variants)) {
      if (shapes.length === 0) continue;
      const png = render(layerFileSvg(ch, l, shapes, 1, colors));
      if (!(png.width === 1000 && png.height === 1400 && png.pixels[3] === 0)) {
        badLayer++;
        console.log('   單層錯誤:', l.id, key);
      }
    }
  check(badLayer === 0, '所有單層 SVG 皆為 1000×1400、背景透明');

  // 8. 預覽圖(白底並排)
  const sheet = (cells, file) => {
    const h = 1500;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cells.length * 1000} ${h}" width="${cells.length * 1000}" height="${h}"><rect width="${cells.length * 1000}" height="${h}" fill="#fff"/>${cells
      .map((c, i) => `<g transform="translate(${i * 1000} ${-VIEW_TOP})">${innerOf(c)}</g>`)
      .join('')}</svg>`;
    writeFileSync(join(out, file), render(svg).asPng());
  };
  const T = { tall: true };
  sheet(names.map((n) => compose({ ...sel, glasses: true }, BUILD_SCALES[n], 0.5, T)), `${tag}_all.png`);
  sheet([0, 0.5, 1].map((h) => compose(sel, 1, h, T)), `${tag}_height.png`);
  sheet([0, 1, 2, 3, 4, 5].map((outfit) => compose({ ...sel, outfit }, 1, 0.5, T)), `${tag}_outfits.png`);
  sheet([0, 1, 2, 3, 4].map((hair) => compose({ ...sel, hair }, 1, 0.5, T)), `${tag}_hair.png`);
  sheet([0, 1, 2, 3].map((figure) => compose({ ...sel, figure }, 1, 0.5, T)), `${tag}_figure.png`);
}

// 一次只跑一個角色(resvg 在同一個程序裡連續渲染上百張會吃光記憶體):node test.mjs m|f
for (const ch of CHARACTERS.filter((c) => !process.argv[2] || c.id === process.argv[2])) runCharacter(ch);

console.log(failures.length ? `\n${failures.length} 項失敗` : '\n全部通過');
process.exit(failures.length ? 1 : 0);
