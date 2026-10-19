// 體型變形:純函式,App 和素材產生腳本共用,確保預覽圖和畫面一致。
// 路徑只用絕對座標的 M / L / C / Z。

export const CANVAS_W = 1000;
export const CANVAS_H = 1400;
export const CENTER_X = 500;

/** 三個體型的水平倍率:瘦、普通、壯 */
export const BUILD_SCALES = { slim: 0.86, normal: 1, heavy: 1.3 } as const;

// 脖子附近(離中線 47 以內)不動,往外 66 內逐漸放到全倍率,所以領口、胯下不會被拉歪。
const RAMP_START = 47;
const RAMP_LEN = 66;

/** build 0–1(5 段體型的連續值)換成水平倍率 */
export function buildScale(build: number): number {
  const b = Math.min(1, Math.max(0, build));
  return b < 0.5
    ? BUILD_SCALES.slim + (BUILD_SCALES.normal - BUILD_SCALES.slim) * (b / 0.5)
    : BUILD_SCALES.normal + (BUILD_SCALES.heavy - BUILD_SCALES.normal) * ((b - 0.5) / 0.5);
}

function factor(dx: number, w: number): number {
  const t = Math.min(1, Math.max(0, (Math.abs(dx) - RAMP_START) / RAMP_LEN));
  return 1 + (w - 1) * t;
}

function mapPairs(d: string, fn: (x: number, y: number) => [number, number]): string {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MLCZ]/.test(t)) {
      out.push(t);
      i += 1;
    } else {
      const [x, y] = fn(parseFloat(tokens[i]), parseFloat(tokens[i + 1]));
      out.push(`${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`);
      i += 2;
    }
  }
  return out.join(' ');
}

/** 身體、衣服:以中線為準左右拉寬或收窄 */
export function warpPath(d: string, w: number): string {
  if (w === 1) return d;
  return mapPairs(d, (x, y) => {
    const dx = x - CENTER_X;
    return [CENTER_X + dx * factor(dx, w), y];
  });
}

/** 鞋子:整隻平移(跟著腿的位置),不改變鞋的大小 */
export function shiftPath(d: string, w: number, centerX: number): string {
  if (w === 1) return d;
  const dxc = centerX - CENTER_X;
  const shift = dxc * (factor(dxc, w) - 1);
  return mapPairs(d, (x, y) => [x + shift, y]);
}

/** 路徑的水平中心(用在鞋子) */
export function pathCenterX(d: string): number {
  let lo = Infinity;
  let hi = -Infinity;
  mapPairs(d, (x, y) => {
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
    return [x, y];
  });
  return (lo + hi) / 2;
}

/** 顏色:amt > 0 變亮,< 0 變暗 */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt);
    return Math.max(0, Math.min(255, Math.round(v)));
  });
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}
