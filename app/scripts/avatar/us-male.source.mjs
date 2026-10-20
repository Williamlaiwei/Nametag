// 美式 Emoji 風 · 男 · 20–30 歲 · 向量描摹。
// 座標用「參考圖」的像素(1493×2000 顯示尺寸),由 lib.mjs 換算到 1000×1400 畫布。
// 參考圖:docs/reference/Gemini_Generated_Image_ck5hsuck5hsuck5h.jpg(已核准的基準角色)。
// 髮型 h0–h4、服裝 o0–o5 與 App 的順序一致:
//   髮型 0 光頭 1 寸頭 2 短髮(參考圖本人)3 油頭 4 長髮
//   服裝 0 汗衫 1 短短 2 短長(參考圖本人)3 長長 4 Casual 5 正裝

const OUT = '#3B211B'; // 外框線
const MIRROR_AXIS = 1492; // 參考圖中線 x=746 → x' = 1492 - x

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
const mirror = (d) => mapPairs(d, (x, y) => [MIRROR_AXIS - x, y]);

function ellipse(cx, cy, rx, ry) {
  const k = 0.5523;
  return `M ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} C ${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} C ${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} C ${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} Z`;
}

function roundRect(x, y, w, h, r) {
  const k = r * 0.4477;
  return `M ${x + r} ${y} L ${x + w - r} ${y} C ${x + w - k} ${y} ${x + w} ${y + k} ${x + w} ${y + r} L ${x + w} ${y + h - r} C ${x + w} ${y + h - k} ${x + w - k} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} C ${x + k} ${y + h} ${x} ${y + h - k} ${x} ${y + h - r} L ${x} ${y + r} C ${x} ${y + k} ${x + k} ${y} ${x + r} ${y} Z`;
}

const skin = (d, extra = {}) => ({ d, fill: 'skin', stroke: OUT, sw: 7, ...extra });
const line = (d, color = OUT, sw = 5) => ({ d, fill: 'none', stroke: color, sw });
const poly = (pts) => 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ') + ' Z';

/** 折線上依 y 內插 x(點的 y 要由小到大) */
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
const WAIST_Y = 1076;
const CROTCH_Y = 1196;
const FULL_HEM = 1814;
const outerL = (y) => 578 + ((566 - 578) * (y - WAIST_Y)) / (FULL_HEM - WAIST_Y);
const innerL = (y) => 736 - (46 * (y - CROTCH_Y)) / (FULL_HEM - CROTCH_Y);

/** 褲子輪廓:hem = 褲管下緣 y;flare = 褲管往外加寬 */
function pantsOutline(hem, flare = 0) {
  const ol = outerL(hem) - flare;
  const il = innerL(hem) + flare * 0.4;
  return poly([
    [578, WAIST_Y],
    [914, WAIST_Y],
    [MIRROR_AXIS - ol, hem],
    [MIRROR_AXIS - il, hem],
    [756, CROTCH_Y],
    [746, 1190],
    [736, CROTCH_Y],
    [il, hem],
    [ol, hem],
  ]);
}

// ───────── 身體(膚色):脖子 + 軀幹 + 雙臂 + 雙腿 ─────────
const armL =
  'M 540 608 C 500 640 478 720 480 780 C 462 880 448 1000 440 1085 C 428 1130 415 1175 420 1215 C 425 1255 462 1292 490 1298 C 506 1300 512 1282 502 1264 C 522 1270 528 1242 516 1226 C 522 1200 522 1150 516 1125 C 548 1060 572 940 580 830 Z';
const armEdge =
  'M 540 608 C 500 640 478 720 480 780 C 462 880 448 1000 440 1085 C 428 1130 415 1175 420 1215 C 425 1255 462 1292 490 1298 C 506 1300 512 1282 502 1264 C 522 1270 528 1242 516 1226 C 522 1200 522 1150 516 1125 C 548 1060 572 940 580 830';
const handL = 'M 502 1264 C 492 1250 482 1236 480 1222';
const crease = 'M 498 892 C 512 905 530 906 542 900';
const legL = poly([
  [outerL(1100), 1100],
  [746, 1100],
  [746, 1190],
  [innerL(FULL_HEM), FULL_HEM],
  [outerL(FULL_HEM), FULL_HEM],
]);

const bodyShapes = [
  // 腿(短褲時看得到;長褲會蓋住)
  skin(legL),
  skin(mirror(legL)),
  // 軀幹(領口、背心露出的胸口與肩)
  { d: 'M 668 556 L 822 556 L 952 608 L 915 1090 L 578 1090 L 540 608 Z', fill: 'skin', stroke: 'none', sw: 0 },
  // 脖子
  { d: 'M 686 470 L 684 566 L 808 566 L 806 470 Z', fill: 'skin', stroke: 'none', sw: 0 },
  { d: 'M 686 470 L 806 470 L 806 520 C 790 545 702 545 686 520 Z', fill: 'skinShade', stroke: 'none', sw: 0 },
  line('M 686 470 L 684 566'),
  line('M 806 470 L 808 566'),
  // 手臂(從肩膀開始,短袖和背心時露出來)
  { d: armL, fill: 'skin', stroke: 'none', sw: 0 },
  { d: mirror(armL), fill: 'skin', stroke: 'none', sw: 0 },
  line(armEdge),
  line(mirror(armEdge)),
  line('M 668 556 L 540 608'),
  line('M 822 556 L 952 608'),
  line(handL, OUT, 4),
  line(mirror(handL), OUT, 4),
  line(crease, 'skinShade', 4),
  line(mirror(crease), 'skinShade', 4),
];

// ───────── 下身 ─────────
const pocketL = 'M 592 1098 C 620 1136 642 1126 656 1090';
const kneeL = 'M 588 1470 C 606 1492 632 1500 654 1494';
const legShadeL = 'M 664 1700 C 670 1650 674 1600 678 1560';

// 原圖的牛仔褲(曲線輪廓),用在 短長 / 長長
const jeansOutline =
  'M 578 1076 L 914 1076 C 918 1300 922 1560 926 1814 L 806 1812 C 790 1600 770 1380 756 1196 L 746 1190 L 736 1196 C 722 1380 704 1600 690 1812 L 566 1814 C 570 1560 576 1300 578 1076 Z';
const jeans = [
  { d: jeansOutline, fill: 'bottom', stroke: OUT, sw: 7 },
  line('M 590 1102 L 902 1102', 'bottomShade', 4),
  line('M 746 1092 L 746 1190', 'bottomShade', 4),
  line(pocketL, 'bottomShade', 4),
  line(mirror(pocketL), 'bottomShade', 4),
  line(kneeL, 'bottomShade', 4),
  line(mirror(kneeL), 'bottomShade', 4),
  line(legShadeL, 'bottomShade', 4),
  line(mirror(legShadeL), 'bottomShade', 4),
];

// 短褲:褲管寬、到膝上
const shorts = [
  { d: pantsOutline(1455, 12), fill: 'bottom', stroke: OUT, sw: 7 },
  line('M 590 1102 L 902 1102', 'bottomShade', 4),
  line('M 746 1092 L 746 1190', 'bottomShade', 4),
  line(pocketL, 'bottomShade', 4),
  line(mirror(pocketL), 'bottomShade', 4),
];

// Casual:七分褲(到小腿),褲管折邊
const chinos = [
  { d: pantsOutline(1676, 0), fill: 'bottom', stroke: OUT, sw: 7 },
  line('M 590 1102 L 902 1102', 'bottomShade', 4),
  line('M 746 1092 L 746 1190', 'bottomShade', 4),
  line(pocketL, 'bottomShade', 4),
  line(mirror(pocketL), 'bottomShade', 4),
  line(`M ${outerL(1650)} 1650 L ${innerL(1650)} 1650`, 'bottomShade', 4),
  line(`M ${MIRROR_AXIS - outerL(1650)} 1650 L ${MIRROR_AXIS - innerL(1650)} 1650`, 'bottomShade', 4),
];

// 正裝:西裝褲,有皮帶和褲線
const suitPants = [
  { d: jeansOutline, fill: 'bottom', stroke: OUT, sw: 7 },
  { d: 'M 578 1076 L 914 1076 L 914 1106 L 578 1106 Z', fill: '#2A2530', stroke: OUT, sw: 5 },
  { d: roundRect(728, 1080, 36, 22, 4), fill: '#C9B36A', stroke: OUT, sw: 3 },
  line('M 746 1110 L 746 1190', 'bottomShade', 4),
  line('M 640 1180 C 636 1400 628 1600 626 1800', 'bottomShade', 4),
  line(mirror('M 640 1180 C 636 1400 628 1600 626 1800'), 'bottomShade', 4),
];

const BOTTOMS = { o0: shorts, o1: shorts, o2: jeans, o3: jeans, o4: chinos, o5: suitPants };

// ───────── 上衣 ─────────
const SLEEVE_OUTER = [
  [540, 608],
  [505, 632],
  [478, 700],
  [458, 790],
  [448, 900],
  [443, 1000],
  [438, 1085],
  [425, 1170],
  [420, 1195],
];
const SLEEVE_INNER = [
  [578, 830],
  [572, 940],
  [560, 1030],
  [545, 1090],
  [530, 1140],
  [520, 1175],
];

/** 袖長 s:.42 短袖、.7 七分、.95 長袖 */
function sleeveEndY(s) {
  return 790 + ((s - 0.42) / 0.53) * 390;
}

/** neck:'round' 圓領、'V' 深 V、'collar' 襯衫領 */
function shirtPath(s, neck) {
  const ye = sleeveEndY(s);
  const outer = SLEEVE_OUTER.filter(([, y]) => y < ye);
  const xo = interpY(SLEEVE_OUTER, ye);
  const yi = ye + 40;
  const xi = interpY(SLEEVE_INNER.map(([x, y]) => [x, y]), yi);
  const inner = SLEEVE_INNER.filter(([, y]) => y < yi);
  const left = [...outer, [xo, ye], [xi, yi], ...inner.reverse()];
  const right = left.map(([x, y]) => [MIRROR_AXIS - x, y]).reverse();
  const neckline =
    neck === 'round'
      ? 'C 800 598 690 598 668 556'
      : neck === 'V'
        ? 'L 760 690 L 745 706 L 730 690 L 668 556'
        : 'L 770 640 L 745 652 L 720 640 L 668 556';
  const side = 'L 578 830 C 576 900 578 1000 578 1074 C 690 1086 800 1086 915 1074 C 915 1000 914 900 914 830';
  // 順序:領口左 → 左肩 → 左袖外側 → 袖口 → 左袖內側 → 左身 → 下擺 → 右身 → 右袖內側 → 袖口 → 右袖外側 → 右肩 → 領口右
  const lp = left.map(([x, y]) => `L ${x} ${y}`).join(' ');
  const rp = right.map(([x, y]) => `L ${x} ${y}`).join(' ');
  return `M 668 556 ${lp} ${side} ${rp} L 822 556 ${neckline} Z`;
}

const seamL = 'M 540 608 C 548 700 570 790 578 830';
const foldL = 'M 604 890 C 612 960 640 1012 690 1052';
const hemLine = 'M 588 1062 C 690 1074 800 1074 904 1062';

function sleeveCuff(s) {
  const ye = sleeveEndY(s);
  const xo = interpY(SLEEVE_OUTER, ye);
  const xi = interpY(SLEEVE_INNER, ye + 40);
  return `M ${xo} ${ye} L ${xi} ${ye + 40}`;
}

const tee = (s) => [
  { d: shirtPath(s, 'round'), fill: 'top', stroke: OUT, sw: 7 },
  line('M 678 562 C 700 584 792 584 812 562', 'topShade', 5),
  line(seamL, 'topShade', 4),
  line(mirror(seamL), 'topShade', 4),
  line(foldL, 'topShade', 4),
  line(mirror(foldL), 'topShade', 4),
  line(hemLine, 'topShade', 4),
];

const tank = [
  {
    d: 'M 690 560 L 640 574 C 618 604 600 700 580 790 C 575 880 578 1000 578 1074 C 690 1086 800 1086 915 1074 C 915 1000 914 880 912 790 C 892 700 874 604 852 574 L 802 560 C 780 650 712 650 690 560 Z',
    fill: 'top',
    stroke: OUT,
    sw: 7,
  },
  line(foldL, 'topShade', 4),
  line(mirror(foldL), 'topShade', 4),
  line(hemLine, 'topShade', 4),
];

const longSleeve = [
  { d: shirtPath(0.95, 'round'), fill: 'top', stroke: OUT, sw: 7 },
  line('M 678 562 C 700 584 792 584 812 562', 'topShade', 5),
  line(seamL, 'topShade', 4),
  line(mirror(seamL), 'topShade', 4),
  line(sleeveCuff(0.95), 'topShade', 6),
  line(mirror(sleeveCuff(0.95)), 'topShade', 6),
  line(foldL, 'topShade', 4),
  line(mirror(foldL), 'topShade', 4),
  line(hemLine, 'topShade', 4),
];

const buttonDots = [720, 810, 900, 990].map((y) => ({ d: ellipse(745, y, 6, 6), fill: 'topShade', stroke: 'none', sw: 0 }));
const casualShirt = [
  { d: shirtPath(0.7, 'collar'), fill: 'top', stroke: OUT, sw: 7 },
  { d: 'M 668 556 L 720 640 L 745 652 L 700 596 Z', fill: 'top', stroke: OUT, sw: 5 },
  { d: mirror('M 668 556 L 720 640 L 745 652 L 700 596 Z'), fill: 'top', stroke: OUT, sw: 5 },
  line('M 745 652 L 745 1074', 'topShade', 4),
  ...buttonDots,
  line(seamL, 'topShade', 4),
  line(mirror(seamL), 'topShade', 4),
  line(sleeveCuff(0.7), 'topShade', 6),
  line(mirror(sleeveCuff(0.7)), 'topShade', 6),
  line(hemLine, 'topShade', 4),
];

const SHIRT_WHITE = '#F7F5EF';
const TIE = '#8B1E2D';
const suitJacket = [
  { d: shirtPath(0.95, 'V'), fill: 'top', stroke: OUT, sw: 7 },
  // 襯衫與領帶
  { d: 'M 700 568 L 745 706 L 790 568 C 770 590 720 590 700 568 Z', fill: SHIRT_WHITE, stroke: OUT, sw: 4 },
  { d: 'M 735 612 L 757 612 L 764 770 L 746 800 L 728 770 Z', fill: TIE, stroke: OUT, sw: 4 },
  // 翻領與前襟
  line('M 668 556 L 724 720 L 745 1074', 'topShade', 5),
  line('M 822 556 L 766 720 L 745 1074', 'topShade', 5),
  line(seamL, 'topShade', 4),
  line(mirror(seamL), 'topShade', 4),
  line(sleeveCuff(0.95), 'topShade', 6),
  line(mirror(sleeveCuff(0.95)), 'topShade', 6),
  { d: ellipse(745, 900, 7, 7), fill: '#2A2530', stroke: 'none', sw: 0 },
];

const TOPS = { o0: tank, o1: tee(0.42), o2: tee(0.42), o3: longSleeve, o4: casualShirt, o5: suitJacket };

// ───────── 鞋(固定色) ─────────
const shoeUpperL =
  'M 574 1812 L 690 1812 C 692 1846 690 1872 670 1888 C 640 1902 590 1926 552 1946 C 520 1958 480 1950 482 1912 C 484 1884 540 1850 574 1812 Z';
const shoeSoleL =
  'M 482 1912 C 478 1946 520 1966 554 1957 C 592 1940 640 1916 668 1898 C 686 1886 692 1866 690 1850 C 686 1872 664 1892 636 1906 C 600 1924 560 1940 530 1944 C 508 1944 488 1934 482 1912 Z';
const lacesL = 'M 552 1872 L 598 1856 M 560 1890 L 612 1870';
const shoeColor = '#5B7FA3';
const soleColor = '#E8E1D2';
const shoesShapes = [
  { d: shoeUpperL, fill: shoeColor, stroke: OUT, sw: 7, shoe: 'L' },
  { d: shoeSoleL, fill: soleColor, stroke: OUT, sw: 5, shoe: 'L' },
  { d: lacesL, fill: 'none', stroke: '#F5F1E6', sw: 6, shoe: 'L' },
  { d: mirror(shoeUpperL), fill: shoeColor, stroke: OUT, sw: 7, shoe: 'R' },
  { d: mirror(shoeSoleL), fill: soleColor, stroke: OUT, sw: 5, shoe: 'R' },
  { d: mirror(lacesL), fill: 'none', stroke: '#F5F1E6', sw: 6, shoe: 'R' },
];

// ───────── 頭:臉、耳、五官 ─────────
const earL = 'M 614 335 C 594 296 558 302 556 345 C 556 388 582 416 614 410 Z';
const headShapes = [
  skin(earL),
  skin(mirror(earL)),
  line('M 586 336 C 580 356 590 376 602 382', 'skinShade', 4),
  line(mirror('M 586 336 C 580 356 590 376 602 382'), 'skinShade', 4),
  skin(
    'M 618 240 C 622 150 680 112 746 112 C 812 112 872 150 876 240 C 880 300 882 350 876 402 C 866 470 800 522 746 524 C 692 522 626 470 618 402 C 612 350 614 300 618 240 Z',
  ),
  { d: ellipse(672, 332, 40, 33), fill: '#FFFFFF', stroke: OUT, sw: 5 },
  { d: ellipse(822, 330, 40, 33), fill: '#FFFFFF', stroke: OUT, sw: 5 },
  { d: ellipse(674, 336, 24, 24), fill: '#6B3F2A', stroke: 'none', sw: 0 },
  { d: ellipse(820, 334, 24, 24), fill: '#6B3F2A', stroke: 'none', sw: 0 },
  { d: ellipse(674, 337, 11, 11), fill: '#2B1A14', stroke: 'none', sw: 0 },
  { d: ellipse(820, 335, 11, 11), fill: '#2B1A14', stroke: 'none', sw: 0 },
  { d: ellipse(664, 326, 6, 6), fill: '#FFFFFF', stroke: 'none', sw: 0 },
  { d: ellipse(810, 324, 6, 6), fill: '#FFFFFF', stroke: 'none', sw: 0 },
  { d: 'M 625 288 C 650 262 702 262 724 284 C 692 276 652 280 625 298 Z', fill: 'hairShade', stroke: 'none', sw: 0 },
  { d: 'M 872 286 C 846 260 794 260 770 282 C 802 274 842 278 872 296 Z', fill: 'hairShade', stroke: 'none', sw: 0 },
  line('M 748 372 C 745 392 735 400 722 402 C 735 412 760 412 768 402', OUT, 4),
  line('M 695 436 C 725 454 772 452 806 430', OUT, 5),
  line('M 724 466 C 740 472 756 472 770 466', 'skinShade', 4),
];

// ───────── 頭髮 ─────────
const hairShort = [
  {
    d: 'M 574 345 C 560 280 556 200 586 150 C 600 120 622 98 646 82 C 648 70 652 62 662 66 C 690 60 760 55 830 62 C 880 70 930 120 950 165 C 945 190 935 215 932 240 C 925 255 900 262 882 258 C 880 280 880 300 878 330 L 872 300 C 870 250 840 215 780 242 C 760 250 730 235 700 215 C 670 200 640 210 628 250 C 624 290 620 320 610 345 C 600 352 585 352 574 345 Z',
    fill: 'hair',
    stroke: OUT,
    sw: 7,
  },
  line('M 690 100 C 700 130 730 152 762 162', 'hairShade', 5),
  line('M 762 88 C 776 120 802 150 834 166', 'hairShade', 5),
  line('M 836 80 C 852 108 872 130 894 150', 'hairShade', 5),
  line('M 640 160 C 632 200 630 240 634 280', 'hairShade', 4),
];

const hairBuzz = [
  {
    d: 'M 590 330 C 574 250 580 160 640 118 C 700 82 800 82 856 118 C 912 160 916 250 902 330 C 894 290 880 252 862 228 C 810 208 686 208 634 228 C 614 252 598 290 590 330 Z',
    fill: 'hair',
    stroke: OUT,
    sw: 6,
  },
];

const slickedCap =
  'M 586 340 C 566 250 576 160 650 106 C 720 70 820 72 880 112 C 926 152 936 250 908 338 C 898 280 880 238 858 218 C 800 194 698 194 640 220 C 616 246 600 292 586 340 Z';
const hairSlicked = [
  { d: slickedCap, fill: 'hair', stroke: OUT, sw: 7 },
  line('M 660 130 C 730 100 810 104 870 140', 'hairShade', 5),
  line('M 650 160 C 730 128 820 130 890 170', 'hairShade', 5),
  line('M 700 118 C 706 150 712 176 716 196', 'hairShade', 5),
];

const lockL = 'M 596 300 C 580 380 572 470 586 560 C 600 578 628 572 632 550 C 616 470 614 400 622 330 Z';
const hairLongFront = [
  { d: slickedCap, fill: 'hair', stroke: OUT, sw: 7 },
  { d: lockL, fill: 'hair', stroke: OUT, sw: 6 },
  { d: mirror(lockL), fill: 'hair', stroke: OUT, sw: 6 },
  line('M 660 130 C 730 100 810 104 870 140', 'hairShade', 5),
  line('M 700 118 C 706 150 712 176 716 196', 'hairShade', 5),
];
const hairLongBack = [
  {
    d: 'M 600 250 C 540 330 520 470 548 640 C 560 690 600 700 640 690 L 852 690 C 892 700 932 690 944 640 C 972 470 952 330 892 250 Z',
    fill: 'hair',
    stroke: OUT,
    sw: 7,
  },
];

// ───────── 眼鏡(參考設計稿中的黑框眼鏡款式;參考角色本人沒有戴) ─────────
const GLASS = '#26262B';
const glassesShapes = [
  { d: roundRect(622, 296, 100, 76, 26), fill: 'none', stroke: GLASS, sw: 9 },
  { d: roundRect(772, 294, 100, 76, 26), fill: 'none', stroke: GLASS, sw: 9 },
  line('M 722 328 C 736 320 758 320 772 326', GLASS, 8),
  line('M 622 322 L 596 316', GLASS, 8),
  line('M 872 320 L 896 314', GLASS, 8),
];

/**
 * 圖層順序(由下到上),與 docs/avatar-spec.md 一致。
 * warp: body 隨體型拉寬、隨身高分段拉伸;shift 鞋子隨體型平移;head 頭與頭髮隨身高平移(大小不變)。
 * variants 為 null = 這個版本沒有這一層(沒有就是沒有,不放假圖)。
 */
export const LAYERS = [
  { id: 'hair_back', warp: 'head', variants: { h4: hairLongBack } },
  { id: 'body', warp: 'body', variants: { '': bodyShapes } },
  { id: 'figure', warp: 'body', variants: null, note: '身材加強層(肌肉)尚未描摹;「一般」本來就沒有' },
  { id: 'bottom', warp: 'body', variants: BOTTOMS },
  { id: 'top', warp: 'body', variants: TOPS },
  { id: 'shoes', warp: 'shift', variants: { '': shoesShapes } },
  { id: 'head', warp: 'head', variants: { '': headShapes } },
  { id: 'glasses', warp: 'head', optional: true, variants: { '': glassesShapes } },
  { id: 'hair_front', warp: 'head', variants: { h1: hairBuzz, h2: hairShort, h3: hairSlicked, h4: hairLongFront } },
];

// 參考圖 → 畫布:腳底(y≈1955)對到 1330,頭頂(臉最上緣 y≈180)對到 150,水平以中線 x=746 對到 500。
const K = (1330 - 150) / (1955 - 180);
export const toCanvas = { k: K, x: (x) => 500 + K * (x - 746), y: (y) => 150 + K * (y - 180) };

// 預設配色(取自參考圖)
export const DEFAULT_COLORS = {
  skin: '#F2B392',
  hair: '#6B4129',
  top: '#3AA3A5',
  bottom: '#4F78AA',
};
