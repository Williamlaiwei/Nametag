// 圖層資料的型別與選取規則,App 和素材腳本共用(純函式,不依賴 React)。
import { heightWarp, pathCenterX, shade, shiftPath, shiftPathY, warpPath, warpPathFigure, warpPathY, type Figure, type HeightWarp } from './warp.ts';

export type Shape = { d: string; fill: string; stroke: string; sw: number; cx?: number; nf?: boolean }; // nf:不跟著身材(曲線 / 肌肉)變形,例如手臂
export type Warp = 'body' | 'shift' | 'head' | 'none';
export type Layer = {
  id: string;
  warp: Warp; // body 隨體型與身高拉伸;shift 鞋子隨體型平移;head 頭髮臉眼鏡隨身高平移;none 不動
  optional: boolean;
  variants: Record<string, Shape[]> | null; // key:'' 單一款式;h1–h4 髮型;o0–o5 服裝
};

export type Selection = { hair: number; outfit: number; glasses: boolean };
export type Colors = { skin: string; hair: string; top: string; bottom: string };

/** 這一層在目前選擇下要畫的形狀;沒有就是 null */
export function pickShapes(layer: Layer, sel: Selection): Shape[] | null {
  if (!layer.variants) return null;
  switch (layer.id) {
    case 'hair_front':
    case 'hair_back':
      return sel.hair === 0 ? null : layer.variants[`h${sel.hair}`] ?? null;
    case 'top':
    case 'bottom':
      return layer.variants[`o${sel.outfit}`] ?? null;
    case 'shoes':
      return layer.variants[`o${sel.outfit}`] ?? layer.variants[''] ?? null;
    case 'glasses':
      return sel.glasses ? layer.variants[''] ?? null : null;
    default:
      return layer.variants[''] ?? null;
  }
}

export function resolveColor(v: string, c: Colors): string {
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

/** 套用體型(水平)與身高(垂直)後的路徑 */
export function layerPath(layer: Layer, s: Shape, w: number, hw: HeightWarp, fig?: Figure): string {
  switch (layer.warp) {
    case 'body': return warpPathY(warpPathFigure(warpPath(s.d, w), s.nf ? undefined : fig), hw);
    case 'shift': return shiftPath(s.d, w, s.cx ?? pathCenterX(s.d));
    case 'head': return shiftPathY(s.d, hw);
    default: return s.d;
  }
}

export { heightWarp };
