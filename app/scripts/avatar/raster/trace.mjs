// 遮罩 → 向量路徑(1000×1400 畫布座標,只含 M L C Z)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ImageTracer = require('imagetracerjs');

/** mask: Uint8Array(W*H) 1 = 要的區域。回傳 d 字串;xf 把像素座標轉成畫布座標 */
export function maskToPath(mask, W, H, xf, opts = {}) {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const v = mask[i] ? 0 : 255;
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  }
  const svg = ImageTracer.imagedataToSVG(
    { width: W, height: H, data },
    {
      pal: [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
      colorsampling: 0, numberofcolors: 2, colorquantcycles: 1,
      pathomit: opts.pathomit ?? 22, ltres: opts.ltres ?? 1.8, qtres: opts.qtres ?? 1.8,
      blurradius: 0, strokewidth: 0, roundcoords: 1, viewbox: true, desc: false,
    },
  );
  const out = [];
  for (const m of svg.matchAll(/<path[^>]*fill="rgb\((\d+),(\d+),(\d+)\)"[^>]*d="([^"]+)"/g)) {
    if (m[1] !== '0') continue; // 只要黑色(= 遮罩內)
    out.push(convert(m[4], xf));
  }
  return out.join(' ');
}

function convert(d, xf) {
  const t = d.match(/[MLQZ]|-?\d*\.?\d+/g);
  const o = [];
  let cx = 0, cy = 0;
  const P = (x, y) => { const [a, b] = xf(x, y); return [Math.round(a * 10) / 10, Math.round(b * 10) / 10]; };
  for (let i = 0; i < t.length; ) {
    const c = t[i++];
    if (c === 'M' || c === 'L') {
      const x = parseFloat(t[i++]), y = parseFloat(t[i++]);
      const [a, b] = P(x, y);
      o.push(`${c} ${a} ${b}`); cx = x; cy = y;
    } else if (c === 'Q') {
      const qx = parseFloat(t[i++]), qy = parseFloat(t[i++]), x = parseFloat(t[i++]), y = parseFloat(t[i++]);
      const c1 = P(cx + (2 / 3) * (qx - cx), cy + (2 / 3) * (qy - cy));
      const c2 = P(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y));
      const e = P(x, y);
      o.push(`C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${e[0]} ${e[1]}`); cx = x; cy = y;
    } else if (c === 'Z') o.push('Z');
  }
  return o.join(' ');
}
