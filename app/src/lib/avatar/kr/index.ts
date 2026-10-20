// 韓國漫畫風:20–30 歲男生(由 Image/Batch 1-6.jpg 描圖產生,見 scripts/avatar/raster/)。女生與其他年紀還沒有。
import type { AvatarDesign } from '../layered';
import { KR_MALE_FIGURE_BUMPS, KR_MALE_LAYERS, KR_MALE_ZONES } from './male';

/** key = `${年紀階段}:${m|f}` */
export const KR_DESIGNS: Record<string, AvatarDesign> = {
  '3:m': { layers: KR_MALE_LAYERS, zones: KR_MALE_ZONES, kind: 'muscle', bumps: KR_MALE_FIGURE_BUMPS },
};
