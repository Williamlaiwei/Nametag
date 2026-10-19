import { useMemo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import type { FaceConfig } from '@/components/Face';
import { HAIR_COLORS, clothColor, skinPalette, type Region } from '@/lib/capture';
import { US_MALE_LAYERS, type Layer, type Shape } from './usMale';
import { CANVAS_H, CANVAS_W, CENTER_X, buildScale, pathCenterX, shade, shiftPath, warpPath } from './warp';

// 美式 Emoji 風 · 男 · 20–30 歲。素材與產生方式見 scripts/avatar/ 與 assets/avatar/manifest.json。
// 目前只有「短髮 + 短長(T 恤 + 長褲)」這一組外觀;其他組合 supports() 回傳 false,由 Face.tsx 退回經典小人。

const FOOT_Y = 1330;

/** 這張臉是否有對應素材(男、短髮或光頭、短長服裝) */
export function supportsUsMale(face: FaceConfig, female: boolean): boolean {
  return !female && (face.hair === 2 || face.hair === 0) && face.outfit === 2;
}

type Colors = { skin: string; hair: string; top: string; bottom: string };

function resolve(v: string, c: Colors): string {
  switch (v) {
    case 'skin': return c.skin;
    case 'skinShade': return shade(c.skin, -0.16);
    case 'hair': return c.hair;
    case 'hairShade': return shade(c.hair, -0.28);
    case 'top': return c.top;
    case 'topShade': return shade(c.top, -0.2);
    case 'bottom': return c.bottom;
    case 'bottomShade': return shade(c.bottom, -0.2);
    default: return v;
  }
}

function shapeD(layer: Layer, s: Shape, w: number): string {
  if (layer.warp === 'body') return warpPath(s.d, w);
  if (layer.warp === 'shift') return shiftPath(s.d, w, s.cx ?? pathCenterX(s.d));
  return s.d;
}

export function UsMaleAvatar({
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
  const w = buildScale(build);
  const skinList = skinPalette(region);
  const colors: Colors = {
    skin: skinList[Math.min(skinList.length - 1, Math.max(0, face.skin))],
    hair: HAIR_COLORS[Math.min(HAIR_COLORS.length - 1, Math.max(0, face.hairColor))],
    top: clothColor(face.topHue, face.topLight),
    bottom: clothColor(face.botHue, face.botLight),
  };
  const bald = face.hair === 0;
  const key = `${w}|${colors.skin}|${colors.hair}|${colors.top}|${colors.bottom}|${glasses}|${bald}`;

  const groups = useMemo(
    () =>
      US_MALE_LAYERS.filter((l) => l.shapes && (!l.optional || glasses) && !(bald && l.id === 'hair_front')).map((l) => (
        <G key={l.id}>
          {l.shapes!.map((s, i) => (
            <Path
              key={i}
              d={shapeD(l, s, w)}
              fill={resolve(s.fill, colors)}
              stroke={s.stroke === 'none' ? 'none' : resolve(s.stroke, colors)}
              strokeWidth={s.sw}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </G>
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  // 身高:以腳底為基準縮放整個人
  const sy = 0.92 + 0.16 * Math.min(1, Math.max(0, height));
  return (
    <Svg width={(size * CANVAS_W) / CANVAS_H} height={size} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
      <G transform={`translate(${CENTER_X} ${FOOT_Y}) scale(${sy}) translate(${-CENTER_X} ${-FOOT_Y})`}>{groups}</G>
    </Svg>
  );
}
