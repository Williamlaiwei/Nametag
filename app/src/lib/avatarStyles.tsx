import type { ReactElement } from 'react';
import type { FaceConfig } from '@/components/Face';
import type { Region } from '@/lib/capture';

// 人物設計風格。三種風格 × 6 個年紀階段 = 18 個設計,目前都還沒有設計稿:
// 沒有登錄的組合會退回 Face.tsx 裡的預設小人。拿到設計後,只要在 AVATAR_DESIGNS 登錄即可。

export type StyleId = 'kr' | 'jp' | 'us';

export const STYLES: { id: StyleId; name: string; note: string }[] = [
  { id: 'kr', name: '韓國漫畫風', note: '設計稿尚未提供' },
  { id: 'jp', name: '日本清透畫風', note: '設計稿尚未提供' },
  { id: 'us', name: '美式 Emoji 風格', note: '設計稿尚未提供' },
];

export const DEFAULT_STYLE: StyleId = 'kr';

export type AvatarRenderProps = {
  face: FaceConfig;
  size: number;
  build: number;
  height: number;
  region: Region;
};

export type AvatarRenderer = (p: AvatarRenderProps) => ReactElement;

/** key 格式:`${風格}:${年紀階段索引}`,例如 'kr:3'。目前是空的。 */
export const AVATAR_DESIGNS: Record<string, AvatarRenderer | undefined> = {};
