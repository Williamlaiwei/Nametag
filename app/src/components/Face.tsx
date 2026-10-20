import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AVATAR_DESIGNS, DEFAULT_STYLE, type StyleId } from '@/lib/avatarStyles';
import { ClassicAvatar, VIEW_H, VIEW_W } from '@/lib/avatar/classic/ClassicAvatar';
import { DEFAULT_AGE_STAGE, DEFAULT_REGION, type Region } from '@/lib/capture';

// 小人頭像 v2:性別、膚色、髮型、髮色、上衣、下身、服裝,加上體型寬度與身高比例。
// 設定存成一小段 JSON 放在 people.face;舊格式(沒有 v: 2)讀取時改用預設值。

export type FaceConfig = {
  v: 2;
  gender: number; // 0–7:0–3 偏男,4–7 偏女
  skin: number; // skinPalette() 的索引
  hair: number; // 0 光頭 1 寸頭 2 短髮 3 油頭 4 長髮(男女共用,見 HAIR_STYLES)
  hairTexture: number; // 女:0 直 1 卷
  hairColor: number; // 0–9
  topHue: number; // 0–14(0–2 黑灰白,3–14 色相)
  topLight: number; // 0–2
  botHue: number;
  botLight: number;
  outfit: number; // 0–5,見 capture.ts 的 MALE_OUTFIT / FEMALE_OUTFIT
  figure: number; // 身材 0–3:0 一般,越大越明顯(女:曲線,男:肌肉)
  age: number; // 年紀階段 0–5,見 AGE_STAGES;每個階段的設計不同
  years?: number; // 進階模式選的歲數(5–80);沒有就是只選了階段
};

export const DEFAULT_FACE: FaceConfig = {
  v: 2,
  gender: 1,
  skin: 2,
  hair: 2,
  hairTexture: 0,
  hairColor: 1,
  topHue: 11,
  topLight: 1,
  botHue: 10,
  botLight: 0,
  outfit: 2,
  figure: 0,
  age: DEFAULT_AGE_STAGE,
};

export function parseFace(json: string): FaceConfig | null {
  if (!json) return null;
  try {
    const f = JSON.parse(json) as Partial<FaceConfig>;
    if (f.v !== 2) return null; // 舊格式:用預設的灰色小人
    return { ...DEFAULT_FACE, ...f };
  } catch {
    return null;
  }
}

export function FaceAvatar({
  face,
  size = 64,
  build = 0.5,
  height = 0.5,
  region = DEFAULT_REGION,
  style = DEFAULT_STYLE,
  glasses = false,
}: {
  face: FaceConfig | null;
  size?: number; // 頭像的高度
  build?: number; // 0–1,對應 5 段體型
  height?: number; // 0–1,相對身高
  region?: Region;
  glasses?: boolean; // 有「眼鏡」標籤時戴眼鏡
  style?: StyleId; // 設計風格;還沒有設計稿的組合會退回下面的預設小人
}) {
  const design = face ? AVATAR_DESIGNS[`${style}:${face.age}`] : undefined;
  const drawn = face && design ? design({ face, size, build, height, region, glasses }) : null;
  if (drawn) return drawn;

  if (!face) {
    const w = (size * VIEW_W) / VIEW_H;
    return (
      <Svg width={w} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Rect x="4" y="4" width="92" height="132" rx="16" fill="#EDE4FD" />
        <Circle cx="50" cy="44" r="18" fill="#C9B6F5" />
        <Path d="M20 130 C 22 84, 78 84, 80 130 Z" fill="#C9B6F5" />
      </Svg>
    );
  }
  return <ClassicAvatar face={face} size={size} build={build} height={height} region={region} glasses={glasses} />;
}
