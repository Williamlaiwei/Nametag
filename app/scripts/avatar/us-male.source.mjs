// 美式 Emoji 風 · 男 · 20–30 歲 · 向量描摹。
// 座標用「參考圖」的像素(1493×2000 顯示尺寸),由 build.mjs 換算到 1000×1400 畫布。
// 參考圖:docs/reference/Gemini_Generated_Image_ck5hsuck5hsuck5h.jpg(已核准的基準角色)。

const OUT = '#3B211B'; // 外框線

const MIRROR_AXIS = 1492; // 參考圖中線 x=746 → x' = 1492 - x

function mirror(d) {
  const t = d.match(/[MLCZ]|-?\d*\.?\d+/g);
  const o = [];
  for (let i = 0; i < t.length; ) {
    if (/[MLCZ]/.test(t[i])) o.push(t[i++]);
    else {
      o.push(`${MIRROR_AXIS - parseFloat(t[i])} ${t[i + 1]}`);
      i += 2;
    }
  }
  return o.join(' ');
}

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

// ───────── 身體(膚色):脖子 + 軀幹 + 雙臂;腿被褲子蓋住 ─────────
const armL = `M 480 780 C 462 880 448 1000 440 1085 C 428 1130 415 1175 420 1215 C 425 1255 462 1292 490 1298 C 506 1300 512 1282 502 1264 C 522 1270 528 1242 516 1226 C 522 1200 522 1150 516 1125 C 548 1060 572 940 580 830 Z`;
const handL = `M 502 1264 C 492 1250 482 1236 480 1222`;
const crease = `M 498 892 C 512 905 530 906 542 900`;

const bodyShapes = [
  // 軀幹(領口露出的胸口)
  { d: 'M 668 556 L 822 556 L 912 592 L 915 1090 L 578 1090 L 580 592 Z', fill: 'skin', stroke: 'none', sw: 0 },
  // 脖子
  { d: 'M 686 470 L 684 566 L 808 566 L 806 470 Z', fill: 'skin', stroke: 'none', sw: 0 },
  { d: 'M 686 470 L 806 470 L 806 520 C 790 545 702 545 686 520 Z', fill: 'skinShade', stroke: 'none', sw: 0 },
  line('M 686 470 L 684 566'),
  line('M 806 470 L 808 566'),
  // 手臂
  skin(armL),
  skin(mirror(armL)),
  line(handL, OUT, 4),
  line(mirror(handL), OUT, 4),
  line(crease, 'skinShade', 4),
  line(mirror(crease), 'skinShade', 4),
];

// ───────── 下身:牛仔褲 ─────────
const jeansOutline =
  'M 578 1076 L 914 1076 C 918 1300 922 1560 926 1814 L 806 1812 C 790 1600 770 1380 756 1196 L 746 1190 L 736 1196 C 722 1380 704 1600 690 1812 L 566 1814 C 570 1560 576 1300 578 1076 Z';
const pocketL = 'M 592 1098 C 620 1136 642 1126 656 1090';
const kneeL = 'M 588 1470 C 606 1492 632 1500 654 1494';
const bottomShapes = [
  { d: jeansOutline, fill: 'bottom', stroke: OUT, sw: 7 },
  line('M 590 1102 L 902 1102', 'bottomShade', 4),
  line('M 746 1092 L 746 1190', 'bottomShade', 4),
  line(pocketL, 'bottomShade', 4),
  line(mirror(pocketL), 'bottomShade', 4),
  line(kneeL, 'bottomShade', 4),
  line(mirror(kneeL), 'bottomShade', 4),
  line('M 664 1700 C 670 1650 674 1600 678 1560', 'bottomShade', 4),
  line(mirror('M 664 1700 C 670 1650 674 1600 678 1560'), 'bottomShade', 4),
];

// ───────── 上衣:T 恤 ─────────
const teeOutline =
  'M 668 556 L 540 608 C 505 632 478 700 458 790 L 578 830 C 576 900 578 1000 578 1074 C 690 1086 800 1086 915 1074 C 915 1000 918 900 918 830 L 1034 792 C 1018 700 988 630 952 606 L 822 556 C 800 598 690 598 668 556 Z';
const seamL = 'M 540 608 C 548 700 570 790 578 830';
const teeShapes = [
  { d: teeOutline, fill: 'top', stroke: OUT, sw: 7 },
  line('M 678 562 C 700 584 792 584 812 562', 'topShade', 5), // 領口羅紋
  line(seamL, 'topShade', 4),
  line(mirror(seamL), 'topShade', 4),
  line('M 604 890 C 612 960 640 1012 690 1052', 'topShade', 4),
  line(mirror('M 604 890 C 612 960 640 1012 690 1052'), 'topShade', 4),
  line('M 588 1062 C 690 1074 800 1074 904 1062', 'topShade', 4), // 下擺折線
];

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
const earL =
  'M 614 335 C 594 296 558 302 556 345 C 556 388 582 416 614 410 Z';
const eyeWhiteL = ellipse(672, 332, 40, 33);
const eyeWhiteR = ellipse(822, 330, 40, 33);
const headShapes = [
  skin(earL),
  skin(mirror(earL)),
  line('M 586 336 C 580 356 590 376 602 382', 'skinShade', 4),
  line(mirror('M 586 336 C 580 356 590 376 602 382'), 'skinShade', 4),
  // 臉
  skin(
    'M 616 190 L 878 190 C 880 260 882 340 876 402 C 866 470 800 522 746 524 C 692 522 626 470 618 402 C 612 340 614 260 616 190 Z',
  ),
  // 眼睛
  { d: eyeWhiteL, fill: '#FFFFFF', stroke: OUT, sw: 5 },
  { d: eyeWhiteR, fill: '#FFFFFF', stroke: OUT, sw: 5 },
  { d: ellipse(674, 336, 24, 24), fill: '#6B3F2A', stroke: 'none', sw: 0 },
  { d: ellipse(820, 334, 24, 24), fill: '#6B3F2A', stroke: 'none', sw: 0 },
  { d: ellipse(674, 337, 11, 11), fill: '#2B1A14', stroke: 'none', sw: 0 },
  { d: ellipse(820, 335, 11, 11), fill: '#2B1A14', stroke: 'none', sw: 0 },
  { d: ellipse(664, 326, 6, 6), fill: '#FFFFFF', stroke: 'none', sw: 0 },
  { d: ellipse(810, 324, 6, 6), fill: '#FFFFFF', stroke: 'none', sw: 0 },
  // 眉毛(跟髮色)
  { d: 'M 625 288 C 650 262 702 262 724 284 C 692 276 652 280 625 298 Z', fill: 'hairShade', stroke: 'none', sw: 0 },
  { d: 'M 872 286 C 846 260 794 260 770 282 C 802 274 842 278 872 296 Z', fill: 'hairShade', stroke: 'none', sw: 0 },
  // 鼻、嘴、下巴
  line('M 748 372 C 745 392 735 400 722 402 C 735 412 760 412 768 402', OUT, 4),
  line('M 695 436 C 725 454 772 452 806 430', OUT, 5),
  line('M 724 466 C 740 472 756 472 770 466', 'skinShade', 4),
];

// ───────── 前髮(髮色) ─────────
const hairOutline =
  'M 574 345 C 560 280 556 200 586 150 C 600 120 622 98 646 82 C 648 70 652 62 662 66 C 690 60 760 55 830 62 C 880 70 930 120 950 165 C 945 190 935 215 932 240 C 925 255 900 262 882 258 C 880 280 880 300 878 330 L 872 300 C 870 250 840 215 780 242 C 760 250 730 235 700 215 C 670 200 640 210 628 250 C 624 290 620 320 610 345 C 600 352 585 352 574 345 Z'
;
const hairFrontShapes = [
  { d: hairOutline, fill: 'hair', stroke: OUT, sw: 7 },
  line('M 690 100 C 700 130 730 152 762 162', 'hairShade', 5),
  line('M 762 88 C 776 120 802 150 834 166', 'hairShade', 5),
  line('M 836 80 C 852 108 872 130 894 150', 'hairShade', 5),
  line('M 640 160 C 632 200 630 240 634 280', 'hairShade', 4),
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
 * warp: 'body' 隨體型拉寬;'shift' 整件平移;'none' 不動。
 * shapes 為 null = 這個版本沒有這一層(沒有就是沒有,不放假圖)。
 */
export const LAYERS = [
  { id: 'hair_back', shapes: null, warp: 'none', note: '短髮沒有後髮層' },
  { id: 'body', shapes: bodyShapes, warp: 'body' },
  { id: 'figure', shapes: null, warp: 'body', note: '身材加強層(曲線 / 肌肉)尚未描摹;「一般」本來就沒有' },
  { id: 'bottom', shapes: bottomShapes, warp: 'body' },
  { id: 'top', shapes: teeShapes, warp: 'body' },
  { id: 'shoes', shapes: shoesShapes, warp: 'shift' },
  { id: 'head', shapes: headShapes, warp: 'none' },
  { id: 'glasses', shapes: glassesShapes, warp: 'none', optional: true },
  { id: 'hair_front', shapes: hairFrontShapes, warp: 'none' },
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
