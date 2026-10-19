// 首頁的三種模式。見 docs/scenarios.md。
// 生活版:記人 + 備註(時間戳);約會版:好感度 -5 到 +99,多出家庭 / 收入等欄位;主辦版:公開,給賓客看。

export type ModeId = 'life' | 'dating' | 'host';

export const MODES: { id: ModeId; name: string; note: string }[] = [
  { id: 'life', name: '生活', note: '工作、學生、業務、交朋友' },
  { id: 'dating', name: '約會', note: '好感度與個人資訊,私人' },
  { id: 'host', name: '主辦', note: '公開給賓客看,沒有私人評價' },
];

export const DEFAULT_MODE: ModeId = 'life';

export function isModeId(v: string | null | undefined): v is ModeId {
  return MODES.some((m) => m.id === v);
}

// 約會版的好感度範圍。生活版的重要度仍是 0.5–5 星(見 score.ts)。
export const LIKING_MIN = -5;
export const LIKING_MAX = 99;

export function clampLiking(v: number): number {
  return Math.min(LIKING_MAX, Math.max(LIKING_MIN, Math.round(v)));
}

export function likingLabel(v: number): string {
  if (v < 0) return '沒感覺';
  if (v < 20) return '普通';
  if (v < 50) return '有好感';
  if (v < 80) return '很喜歡';
  return '非常喜歡';
}

export function likingColor(v: number): string {
  if (v < 0) return '#9CA3AF';
  if (v < 20) return '#60A5FA';
  if (v < 50) return '#34D399';
  if (v < 80) return '#F59E0B';
  return '#EF4444';
}

/** 備註加上時間戳:`2026-10-20 19:30 內容` */
export function stampNote(text: string, now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())} ${text}`;
}
