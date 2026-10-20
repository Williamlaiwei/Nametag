import { pathCenterX, BUILD_SCALES, VIEW_TOP, VIEW_H } from '../../src/lib/avatar/warp.ts';
import { pickShapes, resolveColor, layerPath, heightWarp } from '../../src/lib/avatar/compose.ts';

export { BUILD_SCALES, pickShapes, heightWarp, VIEW_TOP, VIEW_H };

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

/** 來源座標 → 1000×1400 畫布座標 */
export function canvasLayers(ch) {
  const { LAYERS, toCanvas } = ch.src;
  return LAYERS.map((l) => ({
    id: l.id,
    warp: l.warp,
    optional: l.optional ?? false,
    note: l.note,
    variants: l.variants
      ? Object.fromEntries(
          Object.entries(l.variants).map(([key, shapes]) => [
            key,
            shapes.map((s) => {
              const d = mapPairs(s.d, (x, y) => [toCanvas.x(x), toCanvas.y(y)]);
              const out = { d, fill: s.fill, stroke: s.stroke, sw: Math.round(s.sw * toCanvas.k * 10) / 10 };
              if (s.nf) out.nf = true;
              if (l.warp === 'shift') out.cx = Math.round(pathCenterX(d));
              return out;
            }),
          ]),
        )
      : null,
  }));
}

function groupSvg(layer, shapes, w, hw, fig, colors, withRoles) {
  const body = shapes
    .map((s) => {
      const fill = resolveColor(s.fill, colors);
      const stroke = s.stroke === 'none' ? 'none' : resolveColor(s.stroke, colors);
      const roles = withRoles ? ` data-fill="${s.fill}" data-stroke="${s.stroke}"` : '';
      return `    <path d="${layerPath(layer, s, w, hw, fig)}" fill="${fill}" stroke="${stroke}" stroke-width="${s.sw}" stroke-linejoin="round" stroke-linecap="round"${roles}/>`;
    })
    .join('\n');
  return `  <g id="${layer.id}">\n${body}\n  </g>`;
}

const open = (tall) =>
  tall
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${VIEW_TOP} 1000 ${VIEW_H}" width="1000" height="${VIEW_H}">`
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1400" width="1000" height="1400">';


/** 單層 SVG(給 build 用) */
export function layerFileSvg(ch, layer, shapes, w, colors) {
  return `${open(false)}\n${groupSvg(layer, shapes, w, heightWarp(0.5, ch.zones), undefined, colors, true)}\n</svg>\n`;
}

/** 合成:sel 選髮型 / 服裝 / 眼鏡 / 身材;height 0–1;tall 為 true 時用較高的畫布(留頭頂空間) */
export function composeSvg(ch, layers, sel, w, height, colors, { tall = false, only = null } = {}) {
  const hw = heightWarp(height, ch.zones);
  const fig = { kind: ch.figureKind, amount: sel.figure ?? 0 };
  const groups = layers
    .filter((l) => !only || only.includes(l.id))
    .map((l) => [l, pickShapes(l, sel)])
    .filter(([, shapes]) => shapes)
    .map(([l, shapes]) => groupSvg(l, shapes, w, hw, fig, colors, false))
    .join('\n');
  return `${open(tall)}\n${groups}\n</svg>\n`;
}

export function innerOf(svg) {
  return svg.replace(/^<svg[^>]*>/, '').replace('</svg>', '');
}
