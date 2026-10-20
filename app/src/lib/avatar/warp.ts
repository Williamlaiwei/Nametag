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

// ───────── 身高:改變整體比例,不是等比例縮放 ─────────
// 腳底與鞋子固定;腿拉長最多(±30%),軀幹微調(±8%),頭、臉、頭髮、眼鏡大小不變、整個往上或下平移。
// 這樣高的人是腿比較長、頭相對較小,矮的人相反。座標是 1000×1400 畫布。

/** 垂直分區(畫布座標):shoulder 以上整體平移;shoulder–crotch 軀幹;crotch–foot 腿;foot 以下鞋子不動 */
export type Zones = { shoulder: number; crotch: number; foot: number };
export const MALE_ZONES: Zones = { shoulder: 420, crotch: 821, foot: 1240 };
export const FEMALE_ZONES: Zones = { shoulder: 410, crotch: 796, foot: 1215 };

export type HeightWarp = { a: number; b: number; headDy: number; z: Zones };

/** height 0–1(0.5 = 參考圖的身高) */
export function heightWarp(height: number, z: Zones = MALE_ZONES): HeightWarp {
  const h = Math.min(1, Math.max(0, height)) - 0.5;
  const a = h * 0.6;
  const b = h * 0.16;
  const yc = z.foot - (z.foot - z.crotch) * (1 + a);
  const ys = yc - (z.crotch - z.shoulder) * (1 + b);
  return { a, b, headDy: ys - z.shoulder, z };
}

function mapY(y: number, hw: HeightWarp): number {
  const { shoulder, crotch, foot } = hw.z;
  if (y >= foot) return y;
  const yc = foot - (foot - crotch) * (1 + hw.a);
  if (y >= crotch) return foot - (foot - y) * (1 + hw.a);
  if (y >= shoulder) return yc - (crotch - y) * (1 + hw.b);
  return y + hw.headDy;
}

/** 身體、衣服:垂直方向分段拉伸 */
export function warpPathY(d: string, hw: HeightWarp): string {
  if (hw.a === 0 && hw.b === 0) return d;
  return mapPairs(d, (x, y) => [x, mapY(y, hw)]);
}

/** 頭、頭髮、眼鏡:整塊上下平移,大小不變 */
export function shiftPathY(d: string, hw: HeightWarp): string {
  if (hw.headDy === 0) return d;
  return mapPairs(d, (x, y) => [x, y + hw.headDy]);
}

/** 預留頭頂空間:最高的人(height=1)髮頂約在 y=-90 */
export const VIEW_TOP = -100;
export const VIEW_H = 1500;

// ───────── 身材:女 = 曲線(胸、腰、臀),男 = 肌肉(肩胸、手臂) ─────────
// 對身體、衣服的橫向再做一次依高度變化的伸縮;amount 0–3(一般、稍明顯、明顯、很明顯)。
export type FigureKind = 'curvy' | 'muscle';
export type Figure = { kind: FigureKind; amount: number; bumps?: [number, number, number][] }; // bumps:這個角色自己的胸腰臀位置(比例不同的角色要改)

// [中心 y, 影響寬度, 每級增減比例]
const FIGURE_BUMPS: Record<FigureKind, [number, number, number][]> = {
  curvy: [
    [545, 40, 0.05], // 胸
    [615, 45, -0.07], // 腰
    [720, 55, 0.07], // 臀
  ],
  muscle: [[520, 80, 0.07]], // 肩胸與上臂
};
// 離中線多遠以內完整套用、多遠以外完全不動(手臂不跟著腰一起縮):[完整, 不動]。肌肉要連手臂一起變粗,所以不設限。
const FIGURE_REACH: Record<FigureKind, [number, number]> = { curvy: [95, 140], muscle: [9999, 10000] };

export function warpPathFigure(d: string, fig: Figure | undefined): string {
  if (!fig || fig.amount <= 0) return d;
  const bumps = fig.bumps ?? FIGURE_BUMPS[fig.kind];
  return mapPairs(d, (x, y) => {
    const [full, none] = FIGURE_REACH[fig.kind];
    const dx = x - CENTER_X;
    const reach = Math.min(1, Math.max(0, (none - Math.abs(dx)) / (none - full)));
    let f = 1;
    for (const [cy, sigma, k] of bumps) f += fig.amount * k * Math.exp(-(((y - cy) / sigma) ** 2));
    return [CENTER_X + dx * (1 + (f - 1) * reach), y];
  });
}
