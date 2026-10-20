// 單人立繪(白底)→ 區域分類:背景 / 外框線 / 膚色 / 頭髮 / 上衣 / 下身 / 鞋 / 五官。
// 位置參數(下巴、肩、腰、腳踝)用「人物高度的比例」表示,見各角色的設定檔。
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

export function loadScaled(src, f) {
  const raw = jpeg.decode(readFileSync(src), { useTArray: true });
  const W = Math.floor(raw.width / f), H = Math.floor(raw.height / f);
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0;
      for (let j = 0; j < f; j++)
        for (let i = 0; i < f; i++) {
          const o = ((y * f + j) * raw.width + (x * f + i)) * 4;
          r += raw.data[o]; g += raw.data[o + 1]; b += raw.data[o + 2];
        }
      const n = f * f, o = (y * W + x) * 4;
      data[o] = r / n; data[o + 1] = g / n; data[o + 2] = b / n; data[o + 3] = 255;
    }
  return { W, H, data };
}

export const C = { BG: 0, LINE: 1, SKIN: 2, HAIR: 3, TOP: 4, BOTTOM: 5, SHOES: 6, FEATURE: 7, EYEW: 8 };
const NAMES = ['bg', 'line', 'skin', 'hair', 'top', 'bottom', 'shoes', 'feature'];

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/** 回傳 { cls: Uint8Array, bbox } 。cfg 的位置都用「人物高度的比例」 */
export function segment(img, cfg) {
  const { W, H, data } = img;
  const N = W * H;
  const R = (i) => data[i * 4], G = (i) => data[i * 4 + 1], B = (i) => data[i * 4 + 2];
  const near = (i) => Math.min(R(i), G(i), B(i)) > cfg.bgMin;
  // 背景:從四周往內填滿近白色
  const bg = new Uint8Array(N);
  const stack = [];
  const push = (x, y) => { const i = y * W + x; if (!bg[i] && near(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i / W) | 0;
    if (x > 0) push(x - 1, y);
    if (x < W - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < H - 1) push(x, y + 1);
  }
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!bg[y * W + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const bbox = { minX, minY, maxX, maxY, h: maxY - minY };
  const Y = (f) => minY + f * bbox.h;

  const cls = new Uint8Array(N);
  const isSkin = (i) => {
    const r = R(i), g = G(i), b = B(i);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return r > 170 && r >= g && g >= b - 6 && mx - mn > 30 && mx - mn < 110 && (r - g) > 6 && (r - b) > 28;
  };
  const isLine = (i) => {
    const r = R(i), g = G(i), b = B(i);
    return luma(r, g, b) < cfg.lineLuma && Math.max(r, g, b) - Math.min(r, g, b) < cfg.lineChroma;
  };
  const chinY = Y(cfg.chin), shoulderY = Y(cfg.shoulder), waistY = Y(cfg.waist), ankleY = Y(cfg.ankle);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (bg[i]) { cls[i] = C.BG; continue; }
      if (isLine(i)) cls[i] = C.LINE;
      else if (y >= ankleY) cls[i] = C.SHOES;
      else if (isSkin(i) && !(Math.abs(y - waistY) < cfg.waistBand && Math.abs(x - (minX + maxX) / 2) < cfg.torsoHalf)) cls[i] = C.SKIN;
      else if (y < chinY) cls[i] = C.HAIR; // 頭部範圍內非膚色 = 頭髮(之後再把五官分出去)
      else if (y > shoulderY && R(i) > B(i) + 14) cls[i] = C.SKIN; // 皮膚與外框線混色的邊緣像素
      else if (Math.abs(y - waistY) < cfg.waistBand) cls[i] = B(i) > R(i) + 18 ? C.BOTTOM : C.TOP; // 腰線附近用顏色判斷(藍 = 下身),不靠位置
      else if (y < waistY) cls[i] = C.TOP;
      else if (y < ankleY) cls[i] = C.BOTTOM;
      else cls[i] = C.SHOES;
    }
  // 手臂、手和袖子:在肩膀以下的膚色保持 SKIN;袖子顏色(非膚色)在 waist 以上 = TOP
  // 外框線:歸給最近的非線條區域
  const dist = new Int32Array(N).fill(-1);
  const q = [];
  for (let i = 0; i < N; i++) if (cls[i] !== C.LINE && cls[i] !== C.BG) { dist[i] = i; q.push(i); }
  const owner = new Int32Array(N).fill(-1);
  for (const i of q) owner[i] = i;
  let head = 0;
  while (head < q.length) {
    const i = q[head++], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (cls[j] === C.LINE && owner[j] < 0) { owner[j] = owner[i]; q.push(j); }
    }
  }
  const lineOwner = new Uint8Array(N); // 外框線像素所屬的區域
  for (let i = 0; i < N; i++) lineOwner[i] = cls[i] === C.LINE ? (owner[i] >= 0 ? cls[owner[i]] : C.SKIN) : cls[i];

  // 頭部:最大的深色連通塊 = 頭髮,其餘(眉、眼、嘴)= 五官
  const hairCand = new Uint8Array(N);
  for (let y = 0; y < chinY; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!bg[i] && (cls[i] === C.HAIR || cls[i] === C.LINE)) hairCand[i] = 1; }
  // 先侵蝕一圈把頭髮與眉眼之間的細連結切斷,找最大塊之後再膨脹回去(只在原本的深色範圍內)
  const eroded = new Uint8Array(N);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; eroded[i] = hairCand[i] && hairCand[i - 1] && hairCand[i + 1] && hairCand[i - W] && hairCand[i + W] ? 1 : 0; }
  const seed = eroded;
  const comp = new Int32Array(N).fill(-1);
  let best = -1, bestSize = 0, id = 0;
  for (let s = 0; s < N; s++) {
    if (!seed[s] || comp[s] >= 0) continue;
    const st = [s]; comp[s] = id; let size = 0;
    while (st.length) {
      const i = st.pop(); size++;
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (seed[j] && comp[j] < 0) { comp[j] = id; st.push(j); }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }
  // 下身只留最大的一塊(手的陰影不算)
  {
    const seen = new Int32Array(N).fill(-1);
    let bestId = -1, bestN = 0, cid = 0;
    for (let s0 = 0; s0 < N; s0++) {
      if (cls[s0] !== C.BOTTOM || seen[s0] >= 0) continue;
      const st = [s0]; seen[s0] = cid; let n = 0;
      while (st.length) {
        const i = st.pop(); n++;
        const x = i % W, y = (i / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (cls[j] === C.BOTTOM && seen[j] < 0) { seen[j] = cid; st.push(j); }
        }
      }
      if (n > bestN) { bestN = n; bestId = cid; }
      cid++;
    }
    for (let i = 0; i < N; i++) if (cls[i] === C.BOTTOM && seen[i] !== bestId) cls[i] = C.SKIN;
  }
  // 最大塊膨脹回去(3 圈,限制在深色範圍內)
  const isHair = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (comp[i] === best) isHair[i] = 1;
  for (let it = 0; it < 3; it++) {
    const add = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!isHair[i] && hairCand[i] && (isHair[i - 1] || isHair[i + 1] || isHair[i - W] || isHair[i + W])) add.push(i); }
    for (const i of add) isHair[i] = 1;
  }
  // 眉毛以下、臉的寬度以內的深色(眼睛、睫毛、被瀏海蓋到的部分)不算頭髮,算五官
  if (cfg.brow != null) {
    const browY = Y(cfg.brow), mid = (minX + maxX) / 2 + (cfg.headShift ?? 0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (isHair[i] && y >= browY && Math.abs(x - mid) < cfg.faceHalf) isHair[i] = 0; }
  }
  const final = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (cls[i] === C.BG) { final[i] = C.BG; continue; }
    const y = (i / W) | 0;
    if (y < chinY && hairCand[i]) final[i] = isHair[i] ? C.HAIR : luma(R(i), G(i), B(i)) > 150 ? C.EYEW : C.FEATURE;
    else if (cls[i] === C.LINE) final[i] = lineOwner[i] === C.HAIR && y < chinY ? C.FEATURE : lineOwner[i] === C.LINE ? C.SKIN : lineOwner[i];
    else final[i] = cls[i];
  }
  // 線條像素另外記:isLinePx
  const isLinePx = new Uint8Array(N);
  for (let i = 0; i < N; i++) isLinePx[i] = cls[i] === C.LINE || (hairCand[i] && cls[i] === C.HAIR && false) ? 1 : 0;
  return { cls: final, isLinePx, bbox, W, H, chinY, shoulderY, waistY, ankleY };
}

export function debugPng(seg, file) {
  const { W, H, cls } = seg;
  const pal = [[255, 255, 255], [20, 20, 20], [245, 180, 140], [120, 60, 160], [60, 190, 90], [60, 110, 220], [230, 120, 40], [200, 40, 40], [250, 250, 120]];
  const png = new PNG({ width: W, height: H });
  for (let i = 0; i < W * H; i++) {
    const c = pal[cls[i]];
    png.data[i * 4] = c[0]; png.data[i * 4 + 1] = c[1]; png.data[i * 4 + 2] = c[2]; png.data[i * 4 + 3] = 255;
  }
  writeFileSync(file, PNG.sync.write(png));
}
