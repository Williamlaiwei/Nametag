import { LAYERS, toCanvas, DEFAULT_COLORS } from './us-male.source.mjs';
import { warpPath, shiftPath, pathCenterX, shade, BUILD_SCALES } from '../../src/lib/avatar/warp.ts';

export { BUILD_SCALES, DEFAULT_COLORS };

function mapPairs(d, fn) {
  const t = d.match(/[MLCZ]|-?\d*\.?\d+/g);
  const o = [];
  for (let i = 0; i < t.length; ) {
    if (/[MLCZ]/.test(t[i])) o.push(t[i++]);
    else {
      const [x, y] = fn(parseFloat(t[i]), parseFloat(t[i + 1]));
      o.push(`${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`);
      i += 2;
    }
  }
  return o.join(' ');
}

/** 參考圖座標 → 1000×1400 畫布座標 */
export function canvasLayers() {
  return LAYERS.map((l) => ({
    id: l.id,
    warp: l.warp,
    optional: l.optional ?? false,
    note: l.note,
    shapes: l.shapes
      ? l.shapes.map((s) => {
          const d = mapPairs(s.d, (x, y) => [toCanvas.x(x), toCanvas.y(y)]);
          const out = { d, fill: s.fill, stroke: s.stroke, sw: Math.round(s.sw * toCanvas.k * 10) / 10 };
          if (l.warp === 'shift') out.cx = Math.round(pathCenterX(d));
          return out;
        })
      : null,
  }));
}

/** 顏色角色的名字 → 實際顏色 */
export function resolveColor(v, c) {
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

export function warpedD(layer, shape, w) {
  if (layer.warp === 'body') return warpPath(shape.d, w);
  if (layer.warp === 'shift') return shiftPath(shape.d, w, shape.cx);
  return shape.d;
}

export function layerSvgGroup(layer, w, colors, withRoles = true) {
  if (!layer.shapes) return '';
  const body = layer.shapes
    .map((s) => {
      const fill = resolveColor(s.fill, colors);
      const stroke = s.stroke === 'none' ? 'none' : resolveColor(s.stroke, colors);
      const roles = withRoles ? ` data-fill="${s.fill}" data-stroke="${s.stroke}"` : '';
      return `    <path d="${warpedD(layer, s, w)}" fill="${fill}" stroke="${stroke}" stroke-width="${s.sw}" stroke-linejoin="round" stroke-linecap="round"${roles}/>`;
    })
    .join('\n');
  return `  <g id="${layer.id}">\n${body}\n  </g>`;
}

const HEAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1400" width="1000" height="1400">';

export function layerSvg(layer, w, colors) {
  return `${HEAD}\n${layerSvgGroup(layer, w, colors)}\n</svg>\n`;
}

export function composeSvg(layers, w, colors, { glasses = false, background = null } = {}) {
  const bg = background ? `  <rect width="1000" height="1400" fill="${background}"/>\n` : '';
  const groups = layers
    .filter((l) => l.shapes && (!l.optional || glasses))
    .map((l) => layerSvgGroup(l, w, colors, false))
    .join('\n');
  return `${HEAD}\n${bg}${groups}\n</svg>\n`;
}
