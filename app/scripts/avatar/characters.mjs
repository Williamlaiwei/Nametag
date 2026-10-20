import * as male from './us-male.source.mjs';
import * as female from './us-female.source.mjs';
import { MALE_ZONES, FEMALE_ZONES } from '../../src/lib/avatar/warp.ts';

/** 每個角色:來源、垂直分區、身材種類、預設選擇 */
export const CHARACTERS = [
  { id: 'm', name: 'male', exportName: 'US_MALE', file: 'usMale.ts', src: male, zones: MALE_ZONES, figureKind: 'muscle', sel: { hair: 2, outfit: 2, glasses: false, figure: 0 } },
  { id: 'f', name: 'female', exportName: 'US_FEMALE', file: 'usFemale.ts', src: female, zones: FEMALE_ZONES, figureKind: 'curvy', sel: { hair: 4, outfit: 1, glasses: false, figure: 0 } },
];
