// 美式 Emoji 風:20–30 歲(年紀階段 3)男、女各一套。素材由 scripts/avatar/us-*.source.mjs 產生。
import type { AvatarDesign } from '../layered';
import { US_FEMALE_FIGURE_BUMPS, US_FEMALE_LAYERS, US_FEMALE_ZONES } from './female';
import { US_MALE_FIGURE_BUMPS, US_MALE_LAYERS, US_MALE_ZONES } from './male';

/** key = `${年紀階段}:${m|f}` */
export const US_DESIGNS: Record<string, AvatarDesign> = {
  '3:m': { layers: US_MALE_LAYERS, zones: US_MALE_ZONES, kind: 'muscle', bumps: US_MALE_FIGURE_BUMPS },
  '3:f': { layers: US_FEMALE_LAYERS, zones: US_FEMALE_ZONES, kind: 'curvy', bumps: US_FEMALE_FIGURE_BUMPS },
};
