import { useMemo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import type { FaceConfig } from '@/components/Face';
import { HAIR_COLORS, clothColor, isFemale, skinPalette, type Region } from '@/lib/capture';
import { heightWarp, layerPath, pickShapes, resolveColor, type Colors } from './compose.ts';
import { US_FEMALE_LAYERS } from './usFemale';
import { US_MALE_LAYERS } from './usMale';
import { CANVAS_W, FEMALE_ZONES, MALE_ZONES, VIEW_H, VIEW_TOP, buildScale, type Figure } from './warp.ts';

// 美式 Emoji 風 · 20–30 歲(年紀階段 3)。男、女各一套:髮型 0–4、服裝 0–5、身材 0–3、體型、身高、眼鏡都有。
// 素材與產生方式見 scripts/avatar/ 與 assets/avatar/manifest.json。其他年紀還沒有素材,由 Face.tsx 退回經典小人。

export function UsAvatar({
  face,
  size,
  build,
  height,
  region,
  glasses,
}: {
  face: FaceConfig;
  size: number;
  build: number;
  height: number;
  region: Region;
  glasses: boolean;
}) {
  const female = isFemale(face.gender);
  const layers = female ? US_FEMALE_LAYERS : US_MALE_LAYERS;
  const w = buildScale(build);
  const skinList = skinPalette(region);
  const colors: Colors = {
    skin: skinList[Math.min(skinList.length - 1, Math.max(0, face.skin))],
    hair: HAIR_COLORS[Math.min(HAIR_COLORS.length - 1, Math.max(0, face.hairColor))],
    top: clothColor(face.topHue, face.topLight),
    bottom: clothColor(face.botHue, face.botLight),
  };
  const figureLevel = face.figure ?? 0;
  const key = `${female}|${w}|${height}|${face.hair}|${face.outfit}|${figureLevel}|${glasses}|${colors.skin}|${colors.hair}|${colors.top}|${colors.bottom}`;

  const groups = useMemo(() => {
    const hw = heightWarp(height, female ? FEMALE_ZONES : MALE_ZONES);
    const fig: Figure = { kind: female ? 'curvy' : 'muscle', amount: figureLevel };
    const sel = { hair: face.hair, outfit: face.outfit, glasses };
    return layers.map((l) => {
      const shapes = pickShapes(l, sel);
      if (!shapes || shapes.length === 0) return null;
      return (
        <G key={l.id}>
          {shapes.map((s, i) => (
            <Path
              key={i}
              d={layerPath(l, s, w, hw, fig)}
              fill={resolveColor(s.fill, colors)}
              stroke={s.stroke === 'none' ? 'none' : resolveColor(s.stroke, colors)}
              strokeWidth={s.sw}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </G>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 畫布上方留出頭頂空間給高個子;身高只改變比例(腿長、頭身比),不是整體放大縮小
  return (
    <Svg width={(size * CANVAS_W) / VIEW_H} height={size} viewBox={`0 ${VIEW_TOP} ${CANVAS_W} ${VIEW_H}`}>
      {groups}
    </Svg>
  );
}
