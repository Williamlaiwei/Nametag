import * as male from './us-male.source.mjs';
import * as female from './us-female.source.mjs';
import { loadJsonSource } from './json-source.mjs';
import { MALE_ZONES, FEMALE_ZONES } from '../../src/lib/avatar/warp.ts';

const krMale = loadJsonSource('kr-male.json');

/**
 * 每個角色:風格、年紀階段、性別、來源、垂直分區、身材種類、預設選擇。
 * 手描(us-*.source.mjs)與自動分層(raster/*.mjs → data/*.json)都走同一套 build / test。
 */
export const CHARACTERS = [
  { id: 'm', style: 'us', age: 3, gender: 'm', name: 'male', exportName: 'US_MALE', file: 'us/male.ts', src: male, zones: MALE_ZONES, figureKind: 'muscle', sel: { hair: 2, outfit: 2, glasses: false, figure: 0 }, reference: 'docs/reference/Gemini_Generated_Image_ck5hsuck5hsuck5h.jpg' },
  { id: 'f', style: 'us', age: 3, gender: 'f', name: 'female', exportName: 'US_FEMALE', file: 'us/female.ts', src: female, zones: FEMALE_ZONES, figureKind: 'curvy', sel: { hair: 4, outfit: 1, glasses: false, figure: 0 }, reference: 'Image/American girl.jpg' },
  { id: 'm', style: 'kr', age: 3, gender: 'm', name: 'kr-male', exportName: 'KR_MALE', file: 'kr/male.ts', src: krMale, zones: krMale.meta.zones, figureKind: 'muscle', figureBumps: [[445, 80, 0.07]], sel: { hair: 2, outfit: 2, glasses: false, figure: 0 }, reference: krMale.meta.source },
];
