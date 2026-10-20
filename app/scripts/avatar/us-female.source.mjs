// 美式 Emoji 風 · 女 · 20–30 歲 · 向量描摹。
// 座標用「工作座標」:把 Image/American girl.jpg 左邊的基準人物裁出、放大 1.4 倍後的像素
// (換算:原圖 x = 15 + wx/1.4,y = 75 + wy/1.4)。由 lib.mjs 換算到 1000×1400 畫布。
// 髮型 h0–h4、服裝 o0–o5 與 App 的順序一致:
//   髮型 0 光頭 1 寸頭 2 短髮(鮑伯)3 油頭 4 長髮(參考圖本人)
//   服裝 0 小可愛 1 短褲 2 長長 3 Casual 4 正裝 5 禮服

const OUT = '#3B211B';
const AXIS = 292; // 中線 x=146 → x' = 292 - x

function mapPairs(d, fn) {
  const t = d.match(/[MLCZ]|-?\d*\.?\d+/g);
  const o = [];
  for (let i = 0; i < t.length; ) {
    if (/[MLCZ]/.test(t[i])) o.push(t[i++]);
    else {
      const [x, y] = fn(parseFloat(t[i]), parseFloat(t[i + 1]));
      o.push(`${x} ${y}`);
      i += 2;
    }
  }
  return o.join(' ');
}
const mirror = (d) => mapPairs(d, (x, y) => [AXIS - x, y]);

function ellipse(cx, cy, rx, ry) {
  const k = 0.5523;
  return `M ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} C ${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} C ${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} C ${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} Z`;
}
const poly = (pts) => 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ') + ' Z';

const SW = 3.3; // 主輪廓線寬(工作座標)
const skin = (d) => ({ d, fill: 'skin', stroke: OUT, sw: SW });
const line = (d, color = OUT, sw = 2.4) => ({ d, fill: 'none', stroke: color, sw });
const shape = (d, fill, sw = SW, stroke = OUT) => ({ d, fill, stroke, sw });
const both = (shapes) => shapes.flatMap((s) => [s, { ...s, d: mirror(s.d) }]);

/** 折線上依 y 內插 x(點的 y 由小到大) */
function interpY(pts, y) {
  if (y <= pts[0][1]) return pts[0][0];
  for (let i = 1; i < pts.length; i++) {
    if (y <= pts[i][1]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    }
  }
  return pts[pts.length - 1][0];
}

// ───────── 腿與褲子的共用輪廓 ─────────
const WAIST_Y = 441;
const CROTCH_Y = 526;
const HEM_Y = 822;
// 左腿外緣、內緣(由上到下)
const LEG_OUTER = [[85, 441], [79, 480], [76, 520], [75, 580], [79, 640], [73, 700], [71, 780], [71, 822]];
const LEG_INNER = [[146, 526], [138, 580], [129, 640], [126, 700], [121, 780], [118, 822]];
const outerAt = (y) => interpY(LEG_OUTER, y);
const innerAt = (y) => interpY(LEG_INNER, y);

/** 褲子輪廓;hem = 下緣 y;flare = 褲管外緣往外加寬、flareIn = 內緣往內(負值)加寬,到下緣最大 */
function pantsOutline(hem, flare = 0, flareIn = 0) {
  const t = (y, from) => (y - from) / (hem - from);
  const oPts = LEG_OUTER.filter(([, y]) => y > WAIST_Y && y < hem).map(([x, y]) => [x - flare * t(y, WAIST_Y), y]);
  const iPts = LEG_INNER.filter(([, y]) => y < hem).map(([x, y]) => [x + flareIn * t(y, CROTCH_Y), y]);
  const oEnd = [outerAt(hem) - flare, hem];
  const iEnd = [innerAt(hem) + flareIn, hem];
  const m = ([x, y]) => [AXIS - x, y];
  const leftDown = [[85, WAIST_Y], ...oPts, oEnd, iEnd, ...[...iPts].reverse()];
  const rightUp = [...iPts.slice(1).map(m), m(iEnd), m(oEnd), ...[...oPts].reverse().map(m), [207, WAIST_Y]];
  return poly([...leftDown, ...rightUp]);
}

// ───────── 身體(膚色) ─────────
const armL =
  'M 64 300 C 52 322 46 336 44 348 C 40 380 32 430 28 478 C 24 500 16 520 16 538 C 16 556 24 570 34 572 C 44 572 48 560 46 546 C 50 534 54 520 56 500 C 62 470 72 440 80 410 C 86 390 88 370 90 352 Z';
const armEdge =
  'M 64 300 C 52 322 46 336 44 348 C 40 380 32 430 28 478 C 24 500 16 520 16 538 C 16 556 24 570 34 572 C 44 572 48 560 46 546 C 50 534 54 520 56 500 C 62 470 72 440 80 410 C 86 390 88 370 90 352';
const legPoly = poly([
  [82, 450], [146, 450], ...LEG_INNER, [71, 822], ...[...LEG_OUTER].reverse().filter(([, y]) => y < 822),
]);

const bodyShapes = [
  skin(legPoly),
  skin(mirror(legPoly)),
  { d: poly([[112, 258], [180, 258], [230, 296], [207, 446], [85, 446], [62, 296]]), fill: 'skin', stroke: 'none', sw: 0 },
  { d: 'M 123 232 L 123 268 L 169 268 L 169 232 Z', fill: 'skin', stroke: 'none', sw: 0 },
  { d: 'M 123 232 L 169 232 L 169 252 C 160 262 132 262 123 252 Z', fill: 'skinShade', stroke: 'none', sw: 0 },
  line('M 123 232 L 123 268', OUT, SW),
  line('M 169 232 L 169 268', OUT, SW),
  line('M 112 258 L 62 296', OUT, SW),
  line('M 180 258 L 230 296', OUT, SW),
  // 手臂:不跟著身材(曲線)變形,只跟著體型與身高
  ...[
    { d: armL, fill: 'skin', stroke: 'none', sw: 0 },
    { d: mirror(armL), fill: 'skin', stroke: 'none', sw: 0 },
    line(armEdge, OUT, SW),
    line(mirror(armEdge), OUT, SW),
    line('M 34 572 C 34 560 32 548 30 538', OUT, 2.2),
    line(mirror('M 34 572 C 34 560 32 548 30 538'), OUT, 2.2),
    line('M 46 396 C 51 399 56 399 60 395', 'skinShade', 2),
    line(mirror('M 46 396 C 51 399 56 399 60 395'), 'skinShade', 2),
  ].map((s) => ({ ...s, nf: true })),
];

// ───────── 下身 ─────────
const pocket = 'M 90 446 C 100 466 112 470 124 448';
const fly = 'M 146 446 L 146 520';
const denimDetails = [
  line('M 87 450 L 205 450', 'bottomShade', 2.4),
  line(fly, 'bottomShade', 2.4),
  line(pocket, 'bottomShade', 2.4),
  line(mirror(pocket), 'bottomShade', 2.4),
];

// 寬褲(小可愛)
const wideJeans = [
  shape(pantsOutline(HEM_Y, 12, -6), 'bottom'),
  ...denimDetails,
  line('M 78 660 C 92 668 108 666 122 656', 'bottomShade', 2.4),
  line(mirror('M 78 660 C 92 668 108 666 122 656'), 'bottomShade', 2.4),
];

// 牛仔短褲(短褲):捲邊
const denimShorts = [
  shape(pantsOutline(590, 0, 0), 'bottom'),
  ...denimDetails,
  line(`M ${outerAt(570)} 570 L ${innerAt(570)} 570`, 'bottomShade', 2.4),
  line(`M ${AXIS - outerAt(570)} 570 L ${AXIS - innerAt(570)} 570`, 'bottomShade', 2.4),
];

// 運動褲(長長):褲管較鬆,腳踝束口
const sweatPants = [
  shape(pantsOutline(HEM_Y, 5, -3), 'bottom'),
  line('M 87 450 L 205 450', 'bottomShade', 2.4),
  line('M 146 450 L 146 520', 'bottomShade', 2.4),
  line(`M ${outerAt(800) - 4} 800 L ${innerAt(800) + 2} 800`, 'bottomShade', 3),
  line(`M ${AXIS - (outerAt(800) - 4)} 800 L ${AXIS - (innerAt(800) + 2)} 800`, 'bottomShade', 3),
  line('M 80 560 L 82 800', 'bottomShade', 2),
  line(mirror('M 80 560 L 82 800'), 'bottomShade', 2),
];

// 包裹式及膝裙(Casual)
const wrapSkirt = [
  shape('M 86 436 L 206 436 C 214 500 228 590 236 656 C 200 666 92 666 56 656 C 64 590 78 500 86 436 Z', 'bottom'),
  line('M 150 436 C 140 520 124 600 112 662', 'bottomShade', 2.6),
  line('M 86 442 L 206 442', 'bottomShade', 2.6),
  { d: ellipse(110, 450, 4, 4), fill: 'bottomShade', stroke: 'none', sw: 0 },
];

// 西裝褲(正裝):直筒,有褲線
const suitPants = [
  shape(pantsOutline(HEM_Y, 4, -2), 'bottom'),
  line('M 87 450 L 205 450', 'bottomShade', 2.6),
  line('M 146 450 L 146 520', 'bottomShade', 2.4),
  line('M 100 520 C 98 620 96 720 96 820', 'bottomShade', 2.2),
  line(mirror('M 100 520 C 98 620 96 720 96 820'), 'bottomShade', 2.2),
];

const BOTTOMS = { o0: wideJeans, o1: denimShorts, o2: sweatPants, o3: wrapSkirt, o4: suitPants, o5: [] };

// ───────── 上衣 ─────────
const SLEEVE_OUTER = [[62, 296], [52, 312], [46, 332], [44, 348], [40, 380], [32, 430], [28, 478], [24, 505]];
const SLEEVE_INNER = [[90, 352], [88, 372], [86, 392], [80, 412], [72, 440], [62, 472], [56, 500]];
const sleeveEndY = (s) => 332 + ((s - 0.42) / 0.53) * 168;

/** neck: round 圓領 / V 深 V / bow 蝴蝶結領(領口先留圓,蝴蝶結另外畫) */
function shirtPath(s, neck, hemY = 442) {
  const ye = sleeveEndY(s);
  const outer = SLEEVE_OUTER.filter(([, y]) => y < ye);
  const xo = interpY(SLEEVE_OUTER, ye);
  const yi = ye + 20;
  const xi = interpY(SLEEVE_INNER, yi);
  const inner = SLEEVE_INNER.filter(([, y]) => y < yi);
  const left = [...outer, [xo, ye], [xi, yi], ...inner.reverse()];
  const right = left.map(([x, y]) => [AXIS - x, y]).reverse();
  const neckline = neck === 'V' ? 'L 160 300 L 146 316 L 132 300 L 112 258' : 'C 166 288 126 288 112 258';
  const lp = left.map(([x, y]) => `L ${x} ${y}`).join(' ');
  const rp = right.map(([x, y]) => `L ${x} ${y}`).join(' ');
  const hw = hemY - 442;
  const side = `L 90 352 C 98 370 101 392 97 412 C 93 428 89 436 ${86 - hw * 0.1} ${hemY} C 120 ${hemY + 6} 172 ${hemY + 6} ${206 + hw * 0.1} ${hemY} C 203 436 199 428 195 412 C 191 392 194 370 202 352`;
  return `M 112 258 ${lp} ${side} ${rp} L 180 258 ${neckline} Z`;
}

const bustShade = 'M 104 352 C 124 362 168 362 188 352';
const teeShapes = [
  shape(shirtPath(0.42, 'round'), 'top'),
  line('M 116 262 C 132 280 160 280 176 262', 'topShade', 3),
  line(bustShade, 'topShade', 2.2),
  line('M 62 296 C 66 320 80 340 90 352', 'topShade', 2.2),
  line(mirror('M 62 296 C 66 320 80 340 90 352'), 'topShade', 2.2),
];

const camisole = [
  shape('M 100 306 C 118 326 174 326 192 306 C 198 346 198 396 206 440 C 170 448 122 448 86 440 C 94 396 94 346 100 306 Z', 'top'),
  shape('M 104 308 L 119 254 L 130 254 L 120 318 Z', 'top', 2.6),
  shape(mirror('M 104 308 L 119 254 L 130 254 L 120 318 Z'), 'top', 2.6),
  line('M 96 436 C 120 442 172 442 196 436', 'topShade', 2.2),
];

const HOODIE_FOLD = 'M 112 372 C 108 392 108 410 112 428';
const hoodie = [
  shape('M 106 252 C 98 292 194 292 186 252 C 176 266 116 266 106 252 Z', 'topShade', 2.6),
  shape(shirtPath(0.95, 'round', 452), 'top'),
  line('M 116 266 C 132 286 160 286 176 266', 'topShade', 3),
  shape('M 106 400 L 186 400 L 194 440 L 98 440 Z', 'topShade', 2.6),
  line('M 132 270 L 130 330', 'topShade', 3),
  line('M 160 270 L 162 330', 'topShade', 3),
  line('M 54 505 L 82 512', 'topShade', 4),
  line(mirror('M 54 505 L 82 512'), 'topShade', 4),
  line('M 62 296 C 66 320 80 340 90 352', 'topShade', 2.2),
  line(mirror('M 62 296 C 66 320 80 340 90 352'), 'topShade', 2.2),
];

const blouse = [
  shape(shirtPath(0.95, 'round'), 'top'),
  line('M 116 264 C 132 282 160 282 176 264', 'topShade', 2.6),
  // 蝴蝶結
  shape('M 146 280 C 126 262 114 282 126 294 C 134 300 142 290 146 280 Z', 'topShade', 2.4),
  shape('M 146 280 C 166 262 178 282 166 294 C 158 300 150 290 146 280 Z', 'topShade', 2.4),
  shape('M 142 282 L 150 282 L 152 296 L 140 296 Z', 'top', 2.2),
  line('M 142 296 L 134 330', 'topShade', 2.6),
  line('M 150 296 L 160 330', 'topShade', 2.6),
  line('M 54 500 L 82 508', 'topShade', 4),
  line(mirror('M 54 500 L 82 508'), 'topShade', 4),
  line(bustShade, 'topShade', 2),
];

const SHIRT_BLUE = '#BFD6EA';
const blazer = [
  // 內搭襯衫
  shape('M 124 258 L 168 258 L 160 308 L 146 330 L 132 308 Z', SHIRT_BLUE, 2.6),
  // 外套
  shape(shirtPath(0.95, 'V', 468), 'top'),
  line('M 112 258 L 132 318 L 140 468', 'topShade', 2.6),
  line('M 180 258 L 160 318 L 152 468', 'topShade', 2.6),
  line('M 126 260 L 146 292 L 166 260', OUT, 2.2),
  { d: ellipse(146, 410, 3.5, 3.5), fill: '#2A2530', stroke: 'none', sw: 0 },
  line('M 54 500 L 82 508', 'topShade', 4),
  line(mirror('M 54 500 L 82 508'), 'topShade', 4),
];

const PINK = '#E65C9C';
const dress = [
  // 洋裝:V 領無袖、腰間腰帶、A 字裙
  shape(
    'M 118 256 L 130 256 L 146 300 L 162 256 L 174 256 L 198 300 C 200 340 196 380 204 418 C 226 520 240 600 244 650 C 200 664 92 664 48 650 C 52 600 66 520 88 418 C 96 380 92 340 94 300 Z',
    'top',
  ),
  shape('M 90 412 L 202 412 L 204 428 L 88 428 Z', PINK, 2.6),
  line('M 146 300 L 146 412', 'topShade', 2.2),
  line('M 120 430 C 108 520 96 600 80 654', 'topShade', 2.2),
  line('M 172 430 C 184 520 196 600 212 654', 'topShade', 2.2),
];

const TOPS = { o0: camisole, o1: teeShapes, o2: hoodie, o3: blouse, o4: blazer, o5: dress };

// ───────── 鞋 ─────────
const sneakerL =
  'M 84 824 L 124 824 C 128 848 128 862 122 872 C 100 884 60 890 42 884 C 32 880 34 862 52 850 C 70 836 78 832 84 824 Z';
const soleL =
  'M 36 866 C 34 880 50 890 70 888 C 100 884 118 876 126 862 L 124 874 C 112 886 76 894 54 892 C 38 890 33 876 36 866 Z';
const lacesL = 'M 80 836 L 104 842 M 76 846 L 104 852';
const sneakers = [
  { d: sneakerL, fill: '#5B7FA3', stroke: OUT, sw: SW, shoe: 'L' },
  { d: soleL, fill: '#E8E1D2', stroke: OUT, sw: 2.6, shoe: 'L' },
  { d: lacesL, fill: 'none', stroke: '#F5F1E6', sw: 2.6, shoe: 'L' },
  { d: mirror(sneakerL), fill: '#5B7FA3', stroke: OUT, sw: SW, shoe: 'R' },
  { d: mirror(soleL), fill: '#E8E1D2', stroke: OUT, sw: 2.6, shoe: 'R' },
  { d: mirror(lacesL), fill: 'none', stroke: '#F5F1E6', sw: 2.6, shoe: 'R' },
];
const flatL =
  'M 82 826 L 124 826 C 126 850 124 866 118 874 C 98 884 62 888 46 882 C 38 878 40 864 54 852 C 68 840 78 832 82 826 Z';
const flats = [
  { d: flatL, fill: '#3A2A2A', stroke: OUT, sw: SW, shoe: 'L' },
  { d: mirror(flatL), fill: '#3A2A2A', stroke: OUT, sw: SW, shoe: 'R' },
];
const pumpL =
  'M 84 826 L 124 826 L 122 850 C 112 868 80 880 52 880 C 40 880 38 868 50 860 C 66 850 78 838 84 826 Z M 112 852 L 118 890 L 108 890 L 104 862 Z';
const pumps = (color) => [
  { d: pumpL, fill: color, stroke: OUT, sw: SW, shoe: 'L' },
  { d: mirror(pumpL), fill: color, stroke: OUT, sw: SW, shoe: 'R' },
];
const SHOES = { '': sneakers, o3: flats, o4: pumps('#1E1C24'), o5: pumps(PINK) };

// ───────── 頭 ─────────
const earL = 'M 100 168 C 90 162 84 172 86 186 C 88 198 96 204 102 200 Z';
const headShapes = [
  skin(earL),
  skin(mirror(earL)),
  line('M 94 174 C 91 182 93 190 98 194', 'skinShade', 1.8),
  line(mirror('M 94 174 C 91 182 93 190 98 194'), 'skinShade', 1.8),
  skin('M 100 140 C 98 160 98 185 104 205 C 114 232 130 242 148 242 C 166 242 182 232 192 205 C 198 185 198 160 196 140 C 196 108 176 92 148 92 C 120 92 100 108 100 140 Z'),
  // 眼睛
  { d: ellipse(119, 167, 17, 11), fill: '#FFFFFF', stroke: OUT, sw: 2.4 },
  { d: ellipse(173, 167, 17, 11), fill: '#FFFFFF', stroke: OUT, sw: 2.4 },
  { d: ellipse(119, 167, 9.5, 9.5), fill: '#5B3A2A', stroke: 'none', sw: 0 },
  { d: ellipse(173, 167, 9.5, 9.5), fill: '#5B3A2A', stroke: 'none', sw: 0 },
  { d: ellipse(119, 167, 4.6, 4.6), fill: '#2B1A14', stroke: 'none', sw: 0 },
  { d: ellipse(173, 167, 4.6, 4.6), fill: '#2B1A14', stroke: 'none', sw: 0 },
  { d: ellipse(115, 163, 2.6, 2.6), fill: '#FFFFFF', stroke: 'none', sw: 0 },
  { d: ellipse(169, 163, 2.6, 2.6), fill: '#FFFFFF', stroke: 'none', sw: 0 },
  line('M 103 163 L 94 158', OUT, 2.2),
  line('M 189 163 L 198 158', OUT, 2.2),
  // 眉毛
  { d: 'M 99 150 C 108 140 124 138 136 144 C 124 142 110 146 100 156 Z', fill: 'hairShade', stroke: 'none', sw: 0 },
  { d: 'M 193 150 C 184 140 168 138 156 144 C 168 142 182 146 192 156 Z', fill: 'hairShade', stroke: 'none', sw: 0 },
  // 鼻、嘴
  line('M 145 172 C 143 184 139 192 134 194 C 140 198 150 198 154 194', 'skinShade', 2.2),
  { d: 'M 127 203 C 140 216 156 216 168 203 C 160 201 134 201 127 203 Z', fill: '#7B2D26', stroke: OUT, sw: 2.2 },
  { d: 'M 131 205 C 142 210 153 210 164 205 C 156 203.6 139 203.6 131 205 Z', fill: '#FFFFFF', stroke: 'none', sw: 0 },
];

// ───────── 頭髮 ─────────
const HAIR_LINES = (d) => ({ d, fill: 'none', stroke: 'hairShade', sw: 2.4 });
const longBack = [
  shape(
    'M 150 57 C 112 56 76 78 66 108 C 52 150 44 190 46 220 C 38 252 46 286 56 314 C 70 330 84 322 96 332 L 196 332 C 208 322 224 330 238 314 C 248 286 256 252 246 220 C 248 190 240 150 226 108 C 218 78 188 58 150 57 Z',
    'hair',
  ),
  HAIR_LINES('M 62 150 C 56 190 58 230 64 262'),
  HAIR_LINES('M 230 150 C 236 190 234 230 228 262'),
  HAIR_LINES('M 78 280 C 84 296 92 306 100 312'),
  HAIR_LINES('M 214 280 C 208 296 200 306 192 312'),
];
const bobBack = [
  shape(
    'M 150 74 C 112 74 90 100 88 140 C 86 175 90 205 98 224 C 108 236 120 236 126 226 L 166 226 C 172 236 184 236 194 224 C 202 205 206 175 204 140 C 202 100 180 74 150 74 Z',
    'hair',
  ),
];
const capFill =
  'M 100 150 C 94 118 100 94 122 82 C 142 72 176 70 198 82 C 214 94 218 120 214 150 C 212 128 200 112 180 108 C 160 104 134 104 118 118 C 108 128 104 140 100 150 Z';
const capLine = 'M 214 150 C 212 128 200 112 180 108 C 160 104 134 104 118 118 C 108 128 104 140 100 150';
const longFront = [
  shape(capFill, 'hair', 2.6, 'none'),
  line(capLine, OUT, 2.6),
  HAIR_LINES('M 128 100 C 148 92 176 94 196 104'),
  HAIR_LINES('M 118 112 C 150 100 190 108 210 130'),
];
const bobFront = [
  shape('M 98 152 C 92 118 98 92 122 80 C 142 70 176 68 200 80 C 216 92 220 120 216 152 C 208 134 196 124 182 122 C 166 120 150 132 134 124 C 118 118 106 130 98 152 Z', 'hair', 2.6, 'none'),
  line('M 216 152 C 208 134 196 124 182 122 C 166 120 150 132 134 124 C 118 118 106 130 98 152', OUT, 2.6),
  HAIR_LINES('M 124 96 C 150 86 178 90 198 100'),
];
const buzzFront = [
  shape('M 100 140 C 98 108 118 92 148 92 C 178 92 198 108 196 140 C 188 122 176 112 148 110 C 120 112 108 122 100 140 Z', 'hair', 2.6, 'none'),
  line('M 100 140 C 108 122 120 112 148 110 C 176 112 188 122 196 140', OUT, 2.4),
];
const slickedFront = [
  shape('M 98 160 C 92 120 108 84 146 78 C 186 76 208 104 202 160 C 198 132 190 114 172 106 C 150 98 122 106 108 126 C 102 136 100 148 98 160 Z', 'hair', 2.8, OUT),
  HAIR_LINES('M 112 106 C 140 90 176 92 196 112'),
  HAIR_LINES('M 108 124 C 136 104 178 108 198 130'),
];

// ───────── 眼鏡 ─────────
const GLASS = '#3A3A40';
const glassesShapes = [
  { d: ellipse(119, 167, 22, 20), fill: 'none', stroke: GLASS, sw: 3.6 },
  { d: ellipse(173, 167, 22, 20), fill: 'none', stroke: GLASS, sw: 3.6 },
  line('M 141 165 C 144 161 148 161 151 165', GLASS, 3.2),
  line('M 97 164 L 88 160', GLASS, 3),
  line('M 195 164 L 204 160', GLASS, 3),
];

export const LAYERS = [
  { id: 'hair_back', warp: 'head', variants: { h2: bobBack, h4: longBack } },
  { id: 'body', warp: 'body', variants: { '': bodyShapes } },
  { id: 'figure', warp: 'body', variants: null, note: '曲線由程式依身材等級對身體與衣服做橫向伸縮(warpPathFigure),不需要獨立圖層' },
  { id: 'bottom', warp: 'body', variants: BOTTOMS },
  { id: 'top', warp: 'body', variants: TOPS },
  { id: 'shoes', warp: 'shift', variants: SHOES },
  { id: 'head', warp: 'head', variants: { '': headShapes } },
  { id: 'glasses', warp: 'head', optional: true, variants: { '': glassesShapes } },
  { id: 'hair_front', warp: 'head', variants: { h1: buzzFront, h2: bobFront, h3: slickedFront, h4: longFront } },
];

// 工作座標 → 畫布:腳底(y≈888)對到 1330,下巴(y=242)對到 379(和男性同一個高度),水平以中線 x=146 對到 500。
const K = (1330 - 379) / (888 - 242);
export const toCanvas = { k: K, x: (x) => 500 + K * (x - 146), y: (y) => 379 + K * (y - 242) };

export const DEFAULT_COLORS = {
  skin: '#F2B392',
  hair: '#6B3F2A',
  top: '#F5D03E',
  bottom: '#4F78AA',
};
