import { useMemo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import type { FaceConfig } from '@/components/Face';
import { HAIR_COLORS, clothColor, isFemale, skinPalette, type Region } from '@/lib/capture';
import { heightWarp, layerPath, pickShapes, resolveColor, type Colors } from './compose.ts';
import { CANVAS_W, VIEW_H, VIEW_TOP, buildScale, type Figure, type Zones } from './warp.ts';
import type { Layer } from './compose.ts';

// 分層向量人物:一套素材 = 一個「風格 × 年紀 × 性別」。素材與產生方式見 scripts/avatar/ 與 assets/avatar/manifest.json。
// 沒有素材的組合由 Face.tsx 退回經典小人。

export type AvatarDesign = {
  layers: Layer[];
  zones: Zones;
  kind: Figure['kind'];
  bumps?: Figure['bumps'];
};

/** 這個設計有沒有目前選的髮型與服裝(沒有就該退回經典小人);眼鏡缺素材時只是不畫 */
export function designSupports(d: AvatarDesign, hair: number, outfit: number): boolean {
  const has = (id: string, key: string) => d.layers.some((l) => l.id === id && l.variants && key in l.variants);
  const hairOk = hair === 0 || has('hair_front', `h${hair}`) || has('hair_back', `h${hair}`);
  const outfitOk = has('top', `o${outfit}`) || has('bottom', `o${outfit}`);
  return hairOk && outfitOk;
}

export function LayeredAvatar({
  design,
  face,
  size,
  build,
  height,
  region,
  glasses,
}: {
  design: AvatarDesign;
  face: FaceConfig;
  size: number;
  build: number;
  height: number;
  region: Region;
  glasses: boolean;
}) {
  const female = isFemale(face.gender);
  const { layers, zones, kind, bumps } = design;
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
    const hw = heightWarp(height, zones);
    const fig: Figure = { kind, amount: figureLevel, bumps };
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
