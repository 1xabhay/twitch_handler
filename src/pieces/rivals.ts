// Famous rivals as dark silhouettes in their signature pose, rim-lit, with one glowing clue (no faces).
import { circle, ellipse, limb, n, poly, type Piece } from './draw.ts';

type Pt = [number, number];
// a fuzzy edge: points around an ellipse arc from angle a0 to a1 with a soft bump every step
const fuzz = (x: number, y: number, rx: number, ry: number, a0: number, a1: number, bumps: number) =>
  Array.from({ length: bumps * 4 + 1 }, (_, i): Pt => {
    const t = a0 + ((a1 - a0) * i) / (bumps * 4), k = 1 + 0.08 * Math.abs(Math.sin(i * Math.PI / 4));
    return [x + Math.cos(t) * rx * k, y + Math.sin(t) * ry * k];
  });
const around = (x: number, y: number, r: number, deg: number): Pt => [n(x + Math.cos((deg * Math.PI) / 180) * r), n(y + Math.sin((deg * Math.PI) / 180) * r)];
// a crescent moon: the disc (x, y, r) minus the same disc shifted by (dx, dy)
const crescent = (x: number, y: number, r: number, dx: number, dy: number) => {
  const d = Math.hypot(dx, dy), mx = x + dx / 2, my = y + dy / 2, h = Math.sqrt(r * r - (d / 2) ** 2);
  const [ax, ay, bx, by] = [mx - (dy / d) * h, my + (dx / d) * h, mx + (dy / d) * h, my - (dx / d) * h].map(n);
  return `M${ax} ${ay} A${r} ${r} 0 1 0 ${bx} ${by} A${r} ${r} 0 0 1 ${ax} ${ay} Z`;
};
// a star with `k` points
const star = (x: number, y: number, r: number, k: number) => poly(Array.from({ length: k * 2 }, (_, i) => around(x, y, i % 2 ? r * 0.45 : r, -90 + (i * 180) / k)), true);
// a soft fluffy outline (feathers, fur): a closed polygon listed clockwise, each edge split into `k` bulges `out` deep
const puff = (pts: Pt[], k: number, out: number) => {
  const at = (a: Pt, b: Pt, t: number, o = 0) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return `${n(a[0] + (b[0] - a[0]) * t + ((b[1] - a[1]) / len) * o)} ${n(a[1] + (b[1] - a[1]) * t - ((b[0] - a[0]) / len) * o)}`;
  };
  return `M${at(pts[0]!, pts[0]!, 0)}` + pts.map((a, i) => { const b = pts[(i + 1) % pts.length]!; return Array.from({ length: k }, (_, j) => ` Q${at(a, b, (j + 0.5) / k, out)} ${at(a, b, (j + 1) / k)}`).join(''); }).join('') + ' Z';
};
const feet = (a: Pt, b: Pt) => ellipse(a[0], a[1], 10, 3) + ' ' + ellipse(b[0], b[1], 10, 3);

export const RIVALS: Piece[] = [
  { name: 'Mihawk', answers: ['mihawk', 'draculemihawk', 'dracule', 'hawkeyes', 'hawkeye'], art: [
    { d: crescent(140, 96, 80, 44, -30), c: 'white', w: 1.5, fill: true }, // the moon behind him
    { d: ellipse(146, 54, 9, 11), c: 'violet', sil: true },
    { d: ellipse(146, 46, 50, 6), c: 'violet', sil: true }, // the wide flat brim
    { d: 'M128 46 C126 26 166 22 164 46 Z', c: 'violet', sil: true },
    { d: 'M150 30 C142 8 108 4 92 18 C86 24 84 32 88 38 C96 24 120 18 150 34 Z', c: 'violet', sil: true }, // the plume curling back
    { d: limb([[146, 62], [147, 72]], 9), c: 'violet', sil: true },
    { d: limb([[146, 70], [148, 120]], 36, 22), c: 'violet', sil: true },
    { d: poly([[126, 68], [168, 68], [182, 104], [200, 146], [222, 176], [194, 172], [170, 180], [150, 168], [128, 180], [106, 174], [116, 124], [118, 86]], true), c: 'violet', sil: true }, // long coat, blown right
    { d: limb([[138, 150], [130, 170], [118, 189]], 12, 8) + ' ' + limb([[156, 150], [164, 170], [168, 189]], 12, 8), c: 'violet', sil: true },
    { d: feet([116, 191], [172, 191]), c: 'violet', sil: true },
    { d: limb([[128, 74], [114, 102], [116, 130]], 10, 7) + ' ' + circle(116, 134, 6), c: 'violet', sil: true },
    { d: limb([[166, 74], [190, 66], [200, 36]], 10, 8) + ' ' + circle(201, 31, 6), c: 'violet', sil: true }, // reaching back for Yoru
    { d: 'M199 28 L105 188 L102 196 L101 186 L192 34', c: 'white', w: 1.5 }, // Yoru across his back
    { d: 'M212 6 L199 28 M214 42 Q200 36 186 18 M218 46 L214 42 M182 14 L186 18', c: 'yellow', w: 3 }, // its cross hilt
    { d: circle(199, 28, 3), c: 'green', w: 2, fill: true },
  ] },
  { name: 'Law', answers: ['law', 'trafalgarlaw', 'trafalgardwaterlaw', 'trafalgar', 'surgeonofdeath'], art: [
    { d: 'M24 190 A126 126 0 0 1 276 190 M58 190 A92 92 0 0 1 242 190', c: 'blue', w: 1.5 }, // ROOM
    { d: ellipse(146, 47, 9, 11), c: 'yellow', sil: true },
    { d: limb([[147, 55], [149, 66]], 8), c: 'yellow', sil: true },
    { d: 'M128 64 L170 62 Q178 100 182 128 Q190 150 198 166 Q180 166 166 158 L150 140 L134 158 Q122 164 106 160 Q116 140 118 120 Q120 90 128 64 Z', c: 'yellow', sil: true }, // the long coat, flaring
    { d: limb([[142, 146], [126, 166], [118, 189]], 11, 8) + ' ' + limb([[158, 146], [164, 168], [176, 189]], 11, 8), c: 'yellow', sil: true },
    { d: feet([116, 191], [180, 191]), c: 'yellow', sil: true },
    { d: limb([[166, 68], [182, 92], [160, 100]], 10, 8) + ' ' + circle(155, 100, 6), c: 'yellow', sil: true }, // hand on the hilt
    { d: limb([[130, 68], [120, 96], [126, 122]], 10, 7), c: 'yellow', sil: true }, // the other hand in a pocket
    { d: limb([[136, 115], [272, 14]], 5, 6) + ' ' + limb([[142, 110], [150, 104]], 18), c: 'yellow', sil: true }, // Kikoku on his shoulder
    { d: poly([...fuzz(146, 41, 18, 18, Math.PI, 2 * Math.PI, 7), ...fuzz(146, 41, 21, 5, 0, Math.PI, 6)], true), c: 'white', w: 2, fill: true }, // the spotted fur hat
    { d: `${ellipse(138, 31, 3, 2)} ${ellipse(152, 28, 3, 2)} ${ellipse(146, 37, 2.5, 1.5)} ${ellipse(158, 37, 2.5, 1.5)} ${ellipse(135, 39, 2, 1.5)}`, c: 'violet', w: 1.5, fill: true },
  ] },
  { name: 'Doflamingo', answers: ['doflamingo', 'donquixotedoflamingo', 'doffy', 'joker', 'heavenlyyaksha'], art: [
    { d: 'M54 44 L36 0 M62 40 L60 0 M70 44 L82 0 M246 44 L264 0 M238 40 L240 0 M230 44 L218 0', c: 'white', w: 1 }, // the strings
    { d: ellipse(151, 46, 10, 12), c: 'pink', sil: true },
    { d: 'M141 42 Q140 32 146 34 Q150 28 155 33 Q162 32 161 42 Z', c: 'pink', sil: true }, // short spiky hair
    { d: limb([[151, 56], [150, 68]], 9), c: 'pink', sil: true },
    { d: limb([[132, 74], [104, 70], [82, 56], [64, 46]], 12, 7) + ' ' + limb([[168, 74], [196, 70], [218, 56], [236, 46]], 12, 7), c: 'pink', sil: true }, // arms spread wide
    { d: poly([[56, 38], [62, 48], [54, 46], [58, 54], [70, 52], [74, 42], [70, 36], [66, 44], [64, 36]], true) + ' ' + poly([[244, 38], [238, 48], [246, 46], [242, 54], [230, 52], [226, 42], [230, 36], [234, 44], [236, 36]], true), c: 'pink', sil: true }, // fingers hooked on the strings
    { d: limb([[150, 68], [150, 124]], 34, 26), c: 'pink', sil: true },
    { d: puff([[146, 64], [136, 96], [124, 140], [114, 178], [80, 172], [66, 128], [74, 92], [100, 70]], 2, 9) + ' ' + puff([[154, 64], [200, 70], [226, 92], [234, 128], [220, 172], [186, 178], [176, 140], [164, 96]], 2, 9), c: 'pink', sil: true }, // the feather coat
    { d: limb([[142, 120], [126, 156], [106, 189]], 12, 8) + ' ' + limb([[158, 120], [174, 156], [194, 189]], 12, 8), c: 'pink', sil: true }, // wide stance
    { d: feet([104, 191], [196, 191]), c: 'pink', sil: true },
    { d: 'M139 44 L150 44 L148 51 L140 51 Z M152 44 L163 44 L162 51 L154 51 Z', c: 'cyan', w: 1.8, fill: true }, // the shades
  ] },
  { name: 'Crocodile', answers: ['crocodile', 'sircrocodile', 'mrzero', 'misterzero'], art: [
    { d: poly(Array.from({ length: 121 }, (_, i): Pt => { const t = i / 120, r = 50 * (1 - t) + 4; return [70 + 12 * Math.sin(t * 5) + Math.cos(t * 6 * 2 * Math.PI) * r, 16 + t * 174 + Math.sin(t * 6 * 2 * Math.PI) * r * 0.22]; })), c: 'orange', w: 1.5 }, // a sand twister
    { d: ellipse(160, 46, 10, 12), c: 'violet', sil: true },
    { d: 'M170 42 C170 30 156 26 146 32 C138 36 132 42 126 48 C136 46 144 48 152 50 Z', c: 'violet', sil: true }, // hair slicked back
    { d: limb([[158, 56], [156, 66]], 9), c: 'violet', sil: true },
    { d: puff([[118, 66], [196, 64], [190, 80], [124, 82]], 3, 5), c: 'violet', sil: true }, // the fur collar
    { d: 'M122 72 L194 70 Q200 110 206 150 Q190 160 176 156 L170 120 L156 160 Q130 162 92 176 Q108 140 106 110 Q110 86 122 72 Z', c: 'violet', sil: true }, // the long coat, sleeves empty
    { d: limb([[150, 130], [144, 160], [134, 189]], 12, 9) + ' ' + limb([[170, 130], [176, 160], [182, 189]], 12, 9), c: 'violet', sil: true },
    { d: feet([132, 191], [182, 191]), c: 'violet', sil: true },
    { d: limb([[192, 82], [214, 100], [214, 62]], 11, 8), c: 'violet', sil: true }, // the hook arm, raised
    { d: 'M214 62 L214 50 C214 30 236 28 238 42 C238 50 232 52 228 48', c: 'yellow', w: 3 }, // the golden hook
    { d: 'M168 50 L178 50 M180 46 C186 38 176 32 184 24 C190 18 184 12 190 6', c: 'orange', w: 1.5 }, // the cigar and its smoke
  ] },
  { name: 'Buggy', answers: ['buggy', 'buggytheclown', 'captainbuggy', 'redbuggy', 'buggythestar'], art: [
    { d: star(150, 100, 86, 5), c: 'yellow', w: 1.5, fill: true }, // Buggy the Star
    { d: ellipse(150, 58, 11, 12), c: 'cyan', sil: true },
    { d: 'M100 24 Q110 48 150 48 Q190 48 200 24 Q186 32 172 30 Q168 6 150 6 Q132 6 128 30 Q114 32 100 24 Z', c: 'cyan', sil: true }, // the captain's hat
    { d: circle(100, 22, 7) + ' ' + circle(200, 22, 7), c: 'cyan', sil: true }, // its pom-poms
    { d: limb([[150, 68], [150, 76]], 9), c: 'cyan', sil: true },
    { d: limb([[150, 74], [150, 120]], 40, 30), c: 'cyan', sil: true },
    { d: puff([[124, 72], [176, 72], [170, 82], [130, 82]], 3, 4), c: 'cyan', sil: true }, // fur collar
    { d: limb([[130, 80], [112, 98], [100, 94]], 10, 9) + ' ' + limb([[170, 80], [188, 98], [200, 94]], 10, 9), c: 'cyan', sil: true }, // arms end at the wrist
    { d: limb([[150, 130], [150, 140]], 34) + ' ' + limb([[140, 138], [120, 162], [94, 189]], 13, 8) + ' ' + limb([[160, 138], [180, 162], [206, 189]], 13, 8), c: 'cyan', sil: true }, // legs, floating apart from the body
    { d: feet([92, 191], [208, 191]), c: 'cyan', sil: true },
    { d: ellipse(56, 74, 11, 10) + ' ' + ellipse(244, 74, 11, 10), c: 'cyan', sil: true }, // the hands fly off on their own
    { d: 'M50 66 L32 28 L58 62 M250 66 L268 28 L242 62', c: 'white', w: 2 }, // knives
    { d: circle(150, 60, 5.5), c: 'red', w: 2.5, fill: true }, // the red nose
  ] },
  { name: 'Kid', answers: ['kid', 'eustasskid', 'eustass', 'captainkid'], art: [
    { d: circle(150, 96, 84), c: 'blue', w: 1.5, fill: true },
    { d: ellipse(116, 58, 10, 12), c: 'red', sil: true },
    { d: poly([[104, 56], [90, 30], [104, 42], [98, 14], [112, 34], [116, 8], [122, 32], [134, 12], [130, 38], [146, 28], [128, 56]], true), c: 'red', sil: true }, // the flaming hair
    { d: limb([[118, 68], [120, 76]], 9), c: 'red', sil: true },
    { d: limb([[122, 78], [124, 126]], 40, 28), c: 'red', sil: true },
    { d: puff([[100, 72], [146, 72], [140, 84], [104, 128], [84, 176], [56, 170], [72, 110]], 2, 7), c: 'red', sil: true }, // the fur coat, blown back
    { d: limb([[114, 124], [96, 156], [74, 189]], 13, 9) + ' ' + limb([[134, 124], [150, 154], [168, 189]], 13, 9), c: 'red', sil: true },
    { d: feet([72, 191], [172, 191]), c: 'red', sil: true },
    { d: limb([[136, 84], [176, 104], [214, 84]], 24, 30) + ' ' + circle(146, 84, 17), c: 'red', sil: true }, // the giant metal arm
    { d: puff([[196, 38], [236, 22], [260, 46], [252, 84], [222, 92], [200, 72]], 2, 5), c: 'red', sil: true }, // its scrap fist, raised
    { d: poly([[168, 98], [172, 80], [182, 96]], true) + ' ' + poly([[196, 98], [204, 80], [210, 94]], true) + ' ' + poly([[230, 26], [236, 6], [244, 24]], true), c: 'red', sil: true }, // scrap spikes
    { d: `${circle(109, 46, 5)} ${circle(123, 46, 5)} M114 46 L118 46`, c: 'yellow', w: 2, fill: true }, // goggles
  ] },
  { name: 'Enel', answers: ['enel', 'eneru', 'godenel', 'kamienel'], art: [
    { d: 'M236 0 L200 74 L226 74 L184 156 L252 58 L224 58 L260 0', c: 'cyan', w: 1.5, fill: true }, // a thunderbolt
    { d: limb(Array.from({ length: 13 }, (_, i) => around(150, 96, 62, 195 + i * 12.5)), 6), c: 'orange', sil: true }, // the drum ring
    { d: [200, 245, 295, 340].map((dd) => circle(...around(150, 96, 62, dd), 13)).join(' '), c: 'orange', sil: true },
    { d: ellipse(150, 50, 9, 11), c: 'orange', sil: true },
    { d: limb([[141, 52], [139, 70]], 4, 6) + ' ' + circle(139, 71, 4) + ' ' + limb([[159, 52], [161, 70]], 4, 6) + ' ' + circle(161, 71, 4), c: 'orange', sil: true }, // long earlobes
    { d: 'M140 46 C138 32 162 32 160 46 Z M158 40 L172 36 L168 46 Z', c: 'orange', sil: true }, // bandana
    { d: limb([[150, 60], [150, 70]], 9), c: 'orange', sil: true },
    { d: limb([[150, 70], [150, 118]], 38, 28), c: 'orange', sil: true },
    { d: 'M134 114 L166 114 Q188 150 188 172 L170 178 L154 146 L146 146 L130 178 L112 172 Q112 150 134 114 Z', c: 'orange', sil: true }, // baggy trousers
    { d: limb([[122, 176], [116, 190]], 10, 9) + ' ' + limb([[178, 176], [184, 190]], 10, 9), c: 'orange', sil: true },
    { d: limb([[166, 76], [192, 66], [208, 40]], 10, 7) + ' ' + ellipse(210, 34, 6, 7), c: 'orange', sil: true }, // palm raised to the sky
    { d: limb([[134, 76], [110, 96], [100, 112]], 10, 8) + ' ' + circle(98, 114, 6), c: 'orange', sil: true },
    { d: 'M96 30 L100 196', c: 'yellow', w: 3 }, // the golden staff
    { d: 'M210 26 L204 16 L214 18 L208 4', c: 'yellow', w: 1.5 },
  ] },
];
