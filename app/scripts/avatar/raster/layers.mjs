// 單人立繪 → 分層向量(給 characters.mjs 用)。
// 流程:分類(seg.mjs)→ 每個區域取遮罩 → 描成路徑(trace.mjs)→ 依圖層順序輸出 JSON。
// 顏色角色:skin / hair / top / bottom 可換色,*Shade 是同一個顏色的暗部;外框線、五官、鞋是固定色。
import { loadScaled, segment, C } from './seg.mjs';
import { maskToPath } from './trace.mjs';

const LINE = '#2B2830';
const EYE_WHITE = '#F3EEEC';

const luma = (d, i) => 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];

/**
 * cfg: { image, scale, seg: {…位置與門檻}, shoes: 固定色, zones: {shoulder, crotch, foot}(畫布座標) }
 * 回傳 { head, body, top, bottom, shoes, hair } 每個是 shape 陣列
 */
export function buildLayers(cfg) {
  const img = loadScaled(cfg.image, cfg.scale ?? 2);
  const seg = segment(img, cfg.seg);
  const { W, H, cls, isLinePx, bbox } = seg;
  const N = W * H;
  const k = 1180 / bbox.h; // 頭頂 → 150,腳底 → 1330
  const cx = (bbox.minX + bbox.maxX) / 2;
  const xf = (x, y) => [500 + k * (x - cx), 150 + k * (y - bbox.minY)];

  const mask = (fn) => {
    const m = new Uint8Array(N);
    for (let i = 0; i < N; i++) m[i] = fn(i, (i / W) | 0) ? 1 : 0;
    return m;
  };
  const erode = (m) => {
    const o = new Uint8Array(N);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; o[i] = m[i] && m[i - 1] && m[i + 1] && m[i - W] && m[i + W] ? 1 : 0; }
    return o;
  };
  const dilate = (m) => {
    const o = new Uint8Array(N);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; o[i] = m[i] || m[i - 1] || m[i + 1] || m[i - W] || m[i + W] ? 1 : 0; }
    return o;
  };
  const open = (m) => dilate(erode(m)); // 去掉 1–2 像素寬的雜點與虛線
  const median = (arr) => (arr.sort((a, b) => a - b), arr[arr.length >> 1]);
  const classMedian = (c) => {
    const a = [];
    for (let i = 0; i < N; i++) if (cls[i] === c && !isLinePx[i]) a.push(luma(img.data, i));
    return median(a);
  };

  const layers = {};
  const add = (layer, d, fill) => { if (d) (layers[layer] ??= []).push({ d, fill, stroke: 'none', sw: 0 }); };
  const part = (layer, c, role, shadeRole, delta, yFn = () => true) => {
    add(layer, maskToPath(open(mask((i, y) => cls[i] === c && yFn(y))), W, H, xf), role);
    if (shadeRole) {
      const med = classMedian(c);
      add(layer, maskToPath(mask((i, y) => cls[i] === c && yFn(y) && !isLinePx[i] && luma(img.data, i) < med - delta), W, H, xf), shadeRole);
    }
    add(layer, maskToPath(mask((i, y) => cls[i] === c && yFn(y) && isLinePx[i]), W, H, xf), LINE);
  };

  const chin = seg.chinY;
  const d = cfg.shadeDelta ?? { skin: 14, top: 14, bottom: 22 };
  part('body', C.SKIN, 'skin', 'skinShade', d.skin, (y) => y >= chin - 3);
  part('bottom', C.BOTTOM, 'bottom', 'bottomShade', d.bottom);
  part('top', C.TOP, 'top', 'topShade', d.top);
  part('shoes', C.SHOES, cfg.shoes ?? '#8F8A84', null, 0);
  part('head', C.SKIN, 'skin', 'skinShade', d.skin, (y) => y < chin + 3);
  add('head', maskToPath(mask((i) => cls[i] === C.EYEW), W, H, xf), EYE_WHITE);
  add('head', maskToPath(mask((i) => cls[i] === C.FEATURE), W, H, xf), LINE);
  add('hair', maskToPath(mask((i) => cls[i] === C.HAIR), W, H, xf), 'hair');
  return layers;
}
