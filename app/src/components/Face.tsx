import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { AVATAR_DESIGNS, DEFAULT_STYLE, type StyleId } from '@/lib/avatarStyles';
import {
  buildIndex,
  DRESS_INDEX,
  FORMAL_INDEX,
  PANTS_FRAC,
  SLEEVE_FRAC,
  FIGURE_STEPS,
  clothColor,
  DEFAULT_AGE_STAGE,
  DEFAULT_REGION,
  HAIR_COLORS,
  isFemale,
  skinPalette,
  type Region,
} from '@/lib/capture';

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

const LINE = '#2B2233'; // 統一的線條顏色
const LW = 1.1; // 統一的線寬
const VIEW_W = 100;
const VIEW_H = 140;

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
  const w = (size * VIEW_W) / VIEW_H;

  const design = face ? AVATAR_DESIGNS[`${style}:${face.age}`] : undefined;
  if (face && design) return design({ face, size, build, height, region });

  if (!face) {
    return (
      <Svg width={w} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Rect x="4" y="4" width="92" height="132" rx="16" fill="#EDE4FD" />
        <Circle cx="50" cy="44" r="18" fill="#C9B6F5" />
        <Path d="M20 130 C 22 84, 78 84, 80 130 Z" fill="#C9B6F5" />
      </Svg>
    );
  }

  const female = isFemale(face.gender);
  const skinList = skinPalette(region);
  const skin = skinList[Math.min(skinList.length - 1, Math.max(0, face.skin))];
  const hair = HAIR_COLORS[Math.min(HAIR_COLORS.length - 1, Math.max(0, face.hairColor))];
  const top = clothColor(face.topHue, face.topLight);
  const bottom = clothColor(face.botHue, face.botLight);

  const bi = buildIndex(build);
  const bw = 13 + bi * 2.6; // 軀幹半寬
  const fig = Math.min(FIGURE_STEPS - 1, Math.max(0, face.figure ?? 0)) / (FIGURE_STEPS - 1);
  const sw = female ? bw : bw + 2.4 * fig; // 肩寬:男生往上加變寬
  const ww = bw * 0.86 - (female ? 3.2 * fig : 0); // 腰寬:女生往上加變窄
  const legLen = 22 + height * 10; // 腳底最多到 y≈135,留空間給鞋子
  const shoulderY = 60;
  const waistY = 96;
  const hipHalf = bw * (female ? 1.02 : 0.92) + (female ? 1 + 3.2 * fig : 0);
  const legTop = waistY + 7; // 腿從這裡開始
  const legBottom = legTop + legLen;
  const legTopW = hipHalf * 0.98 - 0.5; // 單腿頂端寬
  const legBotW = 3.4 + bi * 0.9; // 單腿腳踝寬
  const armLen = 28 + height * 6;
  const armW = 5 + bi * 0.55 + (female ? 0 : 1.2 * fig);

  /** 錐形肢體:從 (x, y) 往下 len,寬度由 w0 漸細到 w1,x 方向偏 dx。 */
  const limb = (x: number, y: number, dx: number, len: number, w0: number, w1: number, k: number) =>
    `M${x - w0 / 2} ${y} L${x + w0 / 2} ${y} Q${x + w0 / 2 + dx * 0.5} ${y + len * 0.5} ${x + dx + w1 / 2} ${y + len * k} L${x + dx - w1 / 2} ${y + len * k} Q${x - w0 / 2 + dx * 0.5} ${y + len * 0.5} ${x - w0 / 2} ${y} Z`;
  /** 單腿:side -1 左、1 右;frac 是腿的長度比例(褲子用)。 */
  const leg = (side: -1 | 1, frac: number) => {
    const xi = 50 + side * 0.6;
    const xo = 50 + side * (hipHalf + 0.2);
    const t = frac;
    const xo2 = xo + (50 + side * (hipHalf * 0.55 + legBotW / 2) - xo) * t;
    const xi2 = xi + (50 + side * (hipHalf * 0.55 - legBotW / 2) - xi) * t;
    const yb = legTop + legLen * frac;
    return `M${xi} ${legTop - 1} L${xo} ${legTop - 1} Q${xo2 + side * 1.5} ${legTop + (yb - legTop) * 0.5} ${xo2} ${yb} L${xi2} ${yb} Q${xi2 - side * 1} ${legTop + (yb - legTop) * 0.5} ${xi} ${legTop - 1} Z`;
  };

  // 服裝:袖長 / 褲長 / 禮服
  const dress = female && face.outfit === DRESS_INDEX;
  const o = Math.min(5, Math.max(0, face.outfit));
  const sleeveFrac = (female ? SLEEVE_FRAC.female : SLEEVE_FRAC.male)[o];
  const longSleeve = sleeveFrac > 0.6;
  const sleeveless = dress || sleeveFrac === 0;
  const pantsLen = (female ? PANTS_FRAC.female : PANTS_FRAC.male)[o];

  // 頭髮長度(女)
  const hs = Math.min(4, Math.max(0, face.hair));
  const femaleEnd = [0, 0, 50, 66, 86][hs];
  const maleLong = !female && hs === 4;

  return (
    <Svg width={w} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Rect x="2" y="2" width="96" height="136" rx="16" fill="#F3EEFB" />

      {/* 後面的頭髮(女生短髮到長髮、男生長髮) */}
      {(female ? femaleEnd > 0 : maleLong) && (
        <Rect
          x="31.5"
          y="14"
          width="37"
          height={(female ? femaleEnd : 60) - 14}
          rx="14"
          fill={hair}
          stroke={LINE}
          strokeWidth={LW}
        />
      )}

      {/* 手臂(膚色),袖子之後再蓋上去 */}
      <G stroke={LINE} strokeWidth={LW} strokeLinejoin="round">
        <Path d={limb(50 - sw + 1, shoulderY + 3, -3.5, armLen, armW, armW * 0.72, 1)} fill={skin} />
        <Path d={limb(50 + sw - 1, shoulderY + 3, 3.5, armLen, armW, armW * 0.72, 1)} fill={skin} />
      </G>

      {/* 腿(膚色),褲子再蓋上去 */}
      <G stroke={LINE} strokeWidth={LW} strokeLinejoin="round">
        <Path d={leg(-1, 1)} fill={skin} />
        <Path d={leg(1, 1)} fill={skin} />
      </G>
      <G fill={LINE}>
        <Ellipse cx={50 - hipHalf * 0.55 - 0.4} cy={legBottom + 1.2} rx={legBotW * 0.5 + 2} ry="2.8" />
        <Ellipse cx={50 + hipHalf * 0.55 + 0.4} cy={legBottom + 1.2} rx={legBotW * 0.5 + 2} ry="2.8" />
      </G>

      {/* 下身 */}
      {pantsLen > 0 && (
        <G fill={bottom} stroke={LINE} strokeWidth={LW} strokeLinejoin="round">
          <Path d={leg(-1, pantsLen)} />
          <Path d={leg(1, pantsLen)} />
        </G>
      )}

      {/* 軀幹 / 禮服 */}
      {dress ? (
        <G stroke={LINE} strokeWidth={LW} strokeLinejoin="round">
          <Path
            d={`M${50 - sw} ${shoulderY + 3} Q${50 - sw} ${shoulderY} ${50 - sw + 5} ${shoulderY} L${50 + sw - 5} ${shoulderY} Q${50 + sw} ${shoulderY} ${50 + sw} ${shoulderY + 3} L${50 + sw * 0.84} ${waistY - 4} Q${50 + sw + 14} 110 ${50 + sw + 11} 116 L${50 - sw - 11} 116 Q${50 - sw - 14} 110 ${50 - sw * 0.84} ${waistY - 4} Z`}
            fill={top}
          />
          <Path d={`M${50 - sw * 0.84} ${waistY - 6} L${50 + sw * 0.84} ${waistY - 6}`} stroke={bottom} strokeWidth="3" />
        </G>
      ) : (
        <Path
          d={`M${50 - sw} ${shoulderY + 4} Q${50 - sw} ${shoulderY} ${50 - sw + 5} ${shoulderY} L${50 + sw - 5} ${shoulderY} Q${50 + sw} ${shoulderY} ${50 + sw} ${shoulderY + 4} L${50 + sw * 0.86} ${waistY} L${50 + hipHalf} ${waistY + 7} L${50 - hipHalf} ${waistY + 7} L${50 - sw * 0.86} ${waistY} Z`}
          fill={top}
          stroke={LINE}
          strokeWidth={LW}
          strokeLinejoin="round"
        />
      )}

      {/* 袖子 */}
      {!sleeveless && (
        <G fill={top} stroke={LINE} strokeWidth={LW} strokeLinejoin="round">
          <Path d={limb(50 - sw + 1, shoulderY + 3, -3.5, armLen * sleeveFrac, armW + 1, armW * (longSleeve ? 0.8 : 1), 1)} />
          <Path d={limb(50 + sw - 1, shoulderY + 3, 3.5, armLen * sleeveFrac, armW + 1, armW * (longSleeve ? 0.8 : 1), 1)} />
        </G>
      )}
      {o === (female ? FORMAL_INDEX.female : FORMAL_INDEX.male) && (
        <G>
          <Path d={`M43 ${shoulderY} L50 ${shoulderY + 11} L57 ${shoulderY} Z`} fill="#ffffffee" stroke={LINE} strokeWidth="0.8" strokeLinejoin="round" />
          {!female && <Path d={`M49 ${shoulderY + 3} L51 ${shoulderY + 3} L52 ${shoulderY + 20} L50 ${shoulderY + 24} L48 ${shoulderY + 20} Z`} fill="#B91C1C" />}
        </G>
      )}
      {/* 身材細節:女生胸部、男生胸肌與手臂肌肉,隨身材滑桿變明顯 */}
      {fig > 0 && !dress && (
        <G fill="none" stroke={LINE} strokeWidth="0.9" strokeLinecap="round" opacity="0.7">
          {female ? (
            <>
              <Path d={`M${50 - sw * 0.62} ${shoulderY + 12 + fig * 2} Q${50 - sw * 0.32} ${shoulderY + 19 + fig * 4} ${50 - 1.5} ${shoulderY + 13 + fig * 2}`} />
              <Path d={`M${50 + sw * 0.62} ${shoulderY + 12 + fig * 2} Q${50 + sw * 0.32} ${shoulderY + 19 + fig * 4} ${50 + 1.5} ${shoulderY + 13 + fig * 2}`} />
            </>
          ) : (
            <>
              <Path d={`M${50 - sw * 0.7} ${shoulderY + 11} Q${50 - sw * 0.35} ${shoulderY + 16 + fig * 3} 50 ${shoulderY + 12}`} />
              <Path d={`M${50 + sw * 0.7} ${shoulderY + 11} Q${50 + sw * 0.35} ${shoulderY + 16 + fig * 3} 50 ${shoulderY + 12}`} />
              <Path d={`M50 ${shoulderY + 12} L50 ${shoulderY + 12 + fig * 14}`} />
            </>
          )}
        </G>
      )}
      {fig > 0 && !female && (
        <G fill={sleeveFrac > 0.3 ? top : skin} stroke={LINE} strokeWidth={LW}>
          <Ellipse cx={50 - sw - 1.5} cy={shoulderY + 13} rx={armW / 2 + 0.6 + fig * 1.6} ry={5 + fig * 1.5} />
          <Ellipse cx={50 + sw + 1.5} cy={shoulderY + 13} rx={armW / 2 + 0.6 + fig * 1.6} ry={5 + fig * 1.5} />
        </G>
      )}
      {/* 手 */}
      <G fill={skin} stroke={LINE} strokeWidth={LW}>
        <Circle cx={50 - sw + 1 - 3.5} cy={shoulderY + 3 + armLen + 1.5} r="2.7" />
        <Circle cx={50 + sw - 1 + 3.5} cy={shoulderY + 3 + armLen + 1.5} r="2.7" />
      </G>

      {/* 脖子、耳朵與頭 */}
      <Path d="M45 48 L45 62 Q50 66 55 62 L55 48 Z" fill={skin} stroke={LINE} strokeWidth={LW} strokeLinejoin="round" />
      <G fill={skin} stroke={LINE} strokeWidth={LW}>
        <Circle cx="33.3" cy="37" r="2.6" />
        <Circle cx="66.7" cy="37" r="2.6" />
      </G>
      <Path
        d="M50 15 C 65 15 68.5 30 64.5 42 C 61.5 50 56 53.5 50 53.5 C 44 53.5 38.5 50 35.5 42 C 31.5 30 35 15 50 15 Z"
        fill={skin}
        stroke={LINE}
        strokeWidth={LW}
        strokeLinejoin="round"
      />

      {/* 前面的頭髮:外緣貼著臉的輪廓,髮際線依髮型不同 */}
      <G fill={hair} stroke={LINE} strokeWidth={LW} strokeLinejoin="round">
        {hs === 1 && <Path d="M34.2 34 C32 8 68 8 65.8 34 C63.5 25 57.5 22 50 22 C42.5 22 36.5 25 34.2 34 Z" />}
        {hs === 3 && !female && (
          <Path d="M33.6 38 C30 2 70 2 66.4 38 C65 28 57 19.5 45 21 C38 22 34.6 28 33.6 38 Z" />
        )}
        {((!female && (hs === 2 || hs === 4)) || (female && hs >= 2)) && (
          <Path d="M33.6 38 C31 3 69 3 66.4 38 C64 30 58 26 50 26 C42 26 36 30 33.6 38 Z" />
        )}
      </G>
      {hs === 3 && !female && (
        <Path d="M40 17 C48 12 58 14 63 22" stroke="#ffffff77" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* 眉毛、眼睛、腮紅與嘴 */}
      <G stroke={LINE} strokeWidth="1.3" strokeLinecap="round" fill="none">
        <Path d="M39.5 30.5 Q43 28.8 46.5 30.3" />
        <Path d="M53.5 30.3 Q57 28.8 60.5 30.5" />
      </G>
      <Ellipse cx="43" cy="36" rx="2.3" ry="3" fill={LINE} />
      <Ellipse cx="57" cy="36" rx="2.3" ry="3" fill={LINE} />
      <Circle cx="43.8" cy="34.8" r="0.9" fill="#fff" />
      <Circle cx="57.8" cy="34.8" r="0.9" fill="#fff" />
      {female && (
        <G stroke={LINE} strokeWidth="1.2" strokeLinecap="round">
          <Path d="M40.5 33.6 L38.5 32.2" />
          <Path d="M59.5 33.6 L61.5 32.2" />
        </G>
      )}
      <G fill="#FF8FA3" opacity="0.35">
        <Circle cx="39" cy="43" r="3" />
        <Circle cx="61" cy="43" r="3" />
      </G>
      <Path d="M49.2 40.5 Q50.8 42.5 49.4 43" stroke={LINE} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      {glasses && (
        <G stroke="#2B2233" strokeWidth="1.4" fill="#ffffff55">
          <Circle cx="43" cy="36" r="5.5" />
          <Circle cx="57" cy="36" r="5.5" />
          <Path d="M48.5 36 L51.5 36" />
        </G>
      )}
      <Path d="M45.5 46.5 Q50 50.5 54.5 46.5" stroke={LINE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}
