// 重要度:以半顆星為單位,0 = 還沒打分,1 到 10 = 0.5 到 5 顆星。屬於私人筆記,永遠只存在這支手機。

export const MAX_SCORE = 10;

type Tier = { label: string; color: string };

// 每一整顆星一個等級,半顆星落在同一級
const TIERS: Tier[] = [
  { label: '路人', color: '#9CA3AF' },
  { label: '點頭之交', color: '#60A5FA' },
  { label: '有印象', color: '#34D399' },
  { label: '想再見', color: '#F59E0B' },
  { label: '很重要', color: '#EF4444' },
];

export function clampScore(v: number): number {
  return Math.min(MAX_SCORE, Math.max(0, Math.round(v)));
}

export function scoreTier(score: number): Tier | null {
  if (score <= 0) return null;
  return TIERS[Math.min(TIERS.length - 1, Math.ceil(score / 2) - 1)];
}

export function scoreLabel(score: number): string {
  return scoreTier(score)?.label ?? '還沒打分';
}

export function scoreColor(score: number): string {
  return scoreTier(score)?.color ?? '#EADFD3';
}

/** 例如 7 -> "3.5" */
export function scoreStars(score: number): string {
  return (score / 2).toString();
}

/** 篩選門檻,以星星表示。 */
export const FILTERS: { label: string; min: number }[] = [
  { label: '全部', min: 0 },
  { label: '3 星以上', min: 6 },
  { label: '4 星以上', min: 8 },
  { label: '還沒打分', min: -1 },
];
