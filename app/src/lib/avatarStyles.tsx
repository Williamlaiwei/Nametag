import type { ReactElement } from 'react';
import type { FaceConfig } from '@/components/Face';
import { isFemale, type Region } from '@/lib/capture';
import { LayeredAvatar, designSupports, type AvatarDesign } from '@/lib/avatar/layered';
import { JP_DESIGNS } from '@/lib/avatar/jp';
import { KR_DESIGNS } from '@/lib/avatar/kr';
import { US_DESIGNS } from '@/lib/avatar/us';

// 人物設計風格。三種風格 × 6 個年紀階段 × 男女。沒有素材的組合會退回 Face.tsx 裡的預設小人;新素材登錄在 DESIGNS。

export type StyleId = 'classic' | 'kr' | 'jp' | 'us';

export const STYLES: { id: StyleId; name: string; note: string }[] = [
  { id: 'classic', name: '經典(預設)', note: '手繪小人,所有組合都有' },
  { id: 'kr', name: '韓國漫畫風', note: '20–30 歲男生已有設計(目前 1 種髮型、1 套服裝),其他組合用經典小人' },
  { id: 'jp', name: '日本清透畫風', note: '設計稿尚未提供,暫時用經典小人' },
  { id: 'us', name: '美式 Emoji 風格', note: '20–30 歲男女已有設計(全部髮型、服裝、身材),其他年紀用經典小人' },
];

export const DEFAULT_STYLE: StyleId = 'classic';

export type AvatarRenderProps = {
  face: FaceConfig;
  size: number;
  build: number;
  height: number;
  region: Region;
  glasses: boolean;
};

/** 回傳 null = 這個組合沒有素材,由呼叫端退回經典小人 */
export type AvatarRenderer = (p: AvatarRenderProps) => ReactElement | null;

const DESIGNS: Record<string, Record<string, AvatarDesign>> = { us: US_DESIGNS, kr: KR_DESIGNS, jp: JP_DESIGNS };

/** key 格式:`${風格}:${年紀階段索引}`,例如 'us:3'。回傳 null = 這個組合沒有素材(性別、髮型或服裝不支援),退回經典小人 */
const layered = (style: string): AvatarRenderer => (p) => {
  const design = DESIGNS[style]?.[`${p.face.age}:${isFemale(p.face.gender) ? 'f' : 'm'}`];
  if (!design || !designSupports(design, p.face.hair, p.face.outfit)) return null;
  return <LayeredAvatar design={design} {...p} />;
};

/** 多風格分層人物先停用(畫風難統一):false 時全部用經典小人、設定頁不顯示風格選項。素材與程式都保留,改成 true 即恢復 */
export const MULTI_STYLE_ENABLED = false;

export const AVATAR_DESIGNS: Record<string, AvatarRenderer | undefined> = MULTI_STYLE_ENABLED ? {
  ...Object.fromEntries(['us', 'kr', 'jp'].flatMap((st) => [0, 1, 2, 3, 4, 5].map((a) => [`${st}:${a}`, layered(st)]))),
} : {};
