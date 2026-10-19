import type { ReactElement } from 'react';
import type { FaceConfig } from '@/components/Face';
import { isFemale, type Region } from '@/lib/capture';
import { UsMaleAvatar, supportsUsMale } from '@/lib/avatar/UsMaleAvatar';

// 人物設計風格。三種風格 × 6 個年紀階段 = 18 個設計,目前都還沒有設計稿:
// 沒有登錄的組合會退回 Face.tsx 裡的預設小人。拿到設計後,只要在 AVATAR_DESIGNS 登錄即可。

export type StyleId = 'classic' | 'kr' | 'jp' | 'us';

export const STYLES: { id: StyleId; name: string; note: string }[] = [
  { id: 'classic', name: '經典(預設)', note: '手繪小人,所有組合都有' },
  { id: 'kr', name: '韓國漫畫風', note: '設計稿尚未提供,暫時用經典小人' },
  { id: 'jp', name: '日本清透畫風', note: '設計稿尚未提供,暫時用經典小人' },
  { id: 'us', name: '美式 Emoji 風格', note: '男・短髮・短長已有設計,其他組合用經典小人' },
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

/** key 格式:`${風格}:${年紀階段索引}`,例如 'us:3'。 */
export const AVATAR_DESIGNS: Record<string, AvatarRenderer | undefined> = {
  'us:3': ({ face, size, build, height, region, glasses }) =>
    supportsUsMale(face, isFemale(face.gender)) ? (
      <UsMaleAvatar face={face} size={size} build={build} height={height} region={region} glasses={glasses} />
    ) : null,
};
