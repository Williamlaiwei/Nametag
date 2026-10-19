// 快速記錄用的純邏輯:性別、身高、調色盤、選項。沒有任何 UI 與儲存,方便單獨檢查。

// ---------- 性別 ----------

/** 性別滑桿 8 段:0–3 偏男,4–7 偏女。 */
export const GENDER_STEPS = 8;

export function isFemale(gender: number): boolean {
  return gender >= GENDER_STEPS / 2;
}

// ---------- 身高 ----------

const MALE_RANGE: [number, number] = [150, 190]; // 性別段 0
const FEMALE_RANGE: [number, number] = [140, 180]; // 性別段 7

/** 身高範圍隨性別滑桿線性內插。 */
export function heightRange(gender: number): [number, number] {
  const t = Math.min(1, Math.max(0, gender / (GENDER_STEPS - 1)));
  return [
    Math.round(MALE_RANGE[0] + (FEMALE_RANGE[0] - MALE_RANGE[0]) * t),
    Math.round(MALE_RANGE[1] + (FEMALE_RANGE[1] - MALE_RANGE[1]) * t),
  ];
}

/** t:0 到 1 的相對身高(存進 people.height)。 */
export function heightCm(gender: number, t: number): number {
  const [lo, hi] = heightRange(gender);
  return Math.round(lo + Math.min(1, Math.max(0, t)) * (hi - lo));
}

export function heightToT(gender: number, cm: number): number {
  const [lo, hi] = heightRange(gender);
  return Math.min(1, Math.max(0, (cm - lo) / (hi - lo)));
}

export const ROUGH_HEIGHT = ['矮', '差不多', '高', '很高'];

export function roughIndex(t: number): number {
  return Math.min(ROUGH_HEIGHT.length - 1, Math.max(0, Math.round(t * (ROUGH_HEIGHT.length - 1))));
}

export function roughToT(index: number): number {
  return index / (ROUGH_HEIGHT.length - 1);
}

// ---------- 體型 ----------

export const BUILD_LABELS = ['瘦', '偏瘦', '普通', '偏壯', '壯'];

export function buildIndex(build: number): number {
  return Math.min(BUILD_LABELS.length - 1, Math.max(0, Math.round(build * (BUILD_LABELS.length - 1))));
}

export function buildToValue(index: number): number {
  return index / (BUILD_LABELS.length - 1);
}

// ---------- 顏色 ----------

function hex(n: number): string {
  return Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
}

export function lerpHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => hex(v + (pb[i] - v) * t)).join('');
}

export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return '#' + [f(0), f(8), f(4)].map((v) => hex(v * 255)).join('');
}

// 膚色:統一 8 段自然膚色;依地區在某一段範圍多 3 段細分。
const SKIN_BASE = ['#FFE3D0', '#F9D3B8', '#F1C19E', '#E3A97C', '#C98B5E', '#A8683F', '#7A4A2B', '#4F2E1B'];

export type Region = 'asia' | 'other';
export const DEFAULT_REGION: Region = 'asia';

export function skinPalette(region: Region = DEFAULT_REGION): string[] {
  // 亞洲:在偏淺到中間(第 2–5 段之間)多 3 段;其他地區:在偏深(第 5–8 段之間)多 3 段
  const insertAfter = region === 'asia' ? [1, 2, 3] : [4, 5, 6];
  const out: string[] = [];
  SKIN_BASE.forEach((c, i) => {
    out.push(c);
    if (insertAfter.includes(i)) out.push(lerpHex(c, SKIN_BASE[i + 1], 0.5));
  });
  return out;
}

export const HUE_STEPS = 12;
export const LIGHT_STEPS = 2;
const LIGHTNESS = [0.34, 0.68]; // 0 = 暗,1 = 亮;拖色相滑桿時手指往下 = 暗、往上 = 亮

/** 滑桿最左邊 1/5(3 格)是黑、灰、白,其餘 12 格是色相。 */
export const NEUTRALS = ['#1F1F1F', '#8A8A8F', '#F4F4F5'];
export const COLOR_STEPS = NEUTRALS.length + HUE_STEPS; // 15

/** 衣服顏色:前 3 格是黑灰白(不分亮暗),之後是色相 12 段 × 亮度 2 階。 */
export function clothColor(idx: number, light: number): string {
  if (idx < NEUTRALS.length) return NEUTRALS[Math.max(0, idx)];
  const h = idx - NEUTRALS.length;
  return hslToHex((h * 360) / HUE_STEPS, 0.65, LIGHTNESS[Math.min(LIGHT_STEPS - 1, Math.max(0, light))]);
}

export function hueTrack(light: number): string[] {
  return Array.from({ length: COLOR_STEPS }, (_, i) => clothColor(i, light));
}

export function colorName(idx: number, light: number): string {
  if (idx < NEUTRALS.length) return ['黑', '灰', '白'][idx];
  return `${['紅', '橘', '黃', '黃綠', '綠', '青綠', '青', '天藍', '藍', '紫', '洋紅', '粉紅'][idx - NEUTRALS.length]}・${light ? '亮' : '暗'}`;
}

/** 髮色滑桿先關閉(用預設髮色),之後要開再把這個改成 true。 */
export const SHOW_HAIR_COLOR = false;

/** 髮色:10 段單一光譜,不做亮度維度。 */
export const HAIR_COLORS = [
  '#1A1A1A',
  '#3B2A20',
  '#5A3A22',
  '#8B5A2B',
  '#C19A4B',
  '#E6C98A',
  '#B7472A',
  '#8E8E93',
  '#E5E5EA',
  '#7C3AED',
];

// ---------- 髮型與服裝 ----------

/** 髮型滑桿,由左到右(男女共用)。 */
export const HAIR_STYLES = ['光頭', '寸頭', '短髮', '油頭', '長髮'];
export const MALE_HAIR = HAIR_STYLES;
export const FEMALE_LENGTH = ['短', '中', '長'];
export const FEMALE_TEXTURE = ['直', '卷'];
// 服裝滑桿,由左到右。男:汗衫 → … → Casual → 正裝;女:小可愛 → … → Casual → 正裝 → 禮服(禮服在最右邊)。
export const MALE_OUTFIT = ['汗衫', '短短', '短長', '長長', 'Casual', '正裝']; // 上衣袖長 + 褲長
export const FEMALE_OUTFIT = ['小可愛', '短褲', '長長', 'Casual', '正裝', '禮服'];
/** 正裝與女生禮服在滑桿上的位置。 */
export const FORMAL_INDEX = { male: 5, female: 4 };
export const DRESS_INDEX = 5;
/** 袖長比例(0 = 無袖)與褲長比例(0 = 裙子 / 禮服),依服裝索引。 */
export const SLEEVE_FRAC = { male: [0, 0.42, 0.42, 0.95, 0.7, 0.95], female: [0, 0.42, 0.95, 0.7, 0.95, 0] };
export const PANTS_FRAC = { male: [0.42, 0.42, 1, 1, 0.78, 1], female: [0.62, 0.62, 1, 0.78, 1, 0] };
/** 預設服裝:男 短長、女 短褲。 */
export const DEFAULT_OUTFIT = { male: 2, female: 1 };

// ---------- 圓盤第二軸 ----------

export type DiscAxis = { label: string; low: string; high: string };
export const DISC_AXES: DiscAxis[] = [
  { label: '熟悉度', low: '不熟', high: '很熟' },
  { label: '喜不喜歡', low: '不喜歡', high: '喜歡' },
  { label: '年紀', low: '年輕', high: '年長' },
];

// ---------- 年紀階段 ----------

/** 年紀滑桿的 6 個階段,每個階段的外觀設計不同(設計稿之後再補,目前共用同一個預設小人)。 */
export const AGE_STAGES = ['10歲以下', '10–15', '15–20', '20–30', '30–35', '35以上'];
export const DEFAULT_AGE_STAGE = 3;

/** 身材:男女各一條,0 = 一般,往上越明顯。 */
export const FIGURE_STEPS = 4;
export const FIGURE_LABELS = ['一般', '稍明顯', '明顯', '很明顯'];
