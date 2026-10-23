// Emperors and legends: each one a dark silhouette in their signature pose, rim-lit, one clue glowing on top.
import { circle, ellipse, limb, n, poly, spiral, type Piece } from './draw.ts';

// a spiky sun ring: k points between radius r1 and r2
const star = (x: number, y: number, r1: number, r2: number, k: number) =>
  poly(Array.from({ length: k * 2 }, (_, i) => { const t = (i / (k * 2)) * 2 * Math.PI, r = i % 2 ? r1 : r2; return [n(x + Math.cos(t) * r), n(y + Math.sin(t) * r)]; }), true);

// Kaido's club from (x0, y0) to (x1, y1), w0 wide at the grip and w1 at the head, studs poking out of both edges
const kanabo = (x0: number, y0: number, x1: number, y1: number, w0: number, w1: number) => {
  const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, px = -uy, py = ux;
  const studs = [0.42, 0.54, 0.66, 0.78, 0.9].flatMap((t) => {
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, h = (w0 + (w1 - w0) * t) / 2;
    return [1, -1].map((k) => poly([[x + px * h * k, y + py * h * k], [x + px * (h + 6) * k, y + py * (h + 6) * k]]));
  });
  return { body: limb([[x0, y0], [x1, y1]], w0, w1), studs: studs.join(' ') };
};
// Big Mom's mane: big curls arching over her head and falling to her shoulders
const curls: [number, number, number][] = [[150, 30, 18], [122, 34, 17], [178, 34, 17], [100, 50, 17], [200, 50, 17], [88, 74, 16], [212, 74, 16], [84, 100, 16], [216, 100, 16], [86, 124, 15], [214, 124, 15]];
const club = kanabo(164, 106, 286, 24, 8, 22);

export const LEGENDS: Piece[] = [
  { name: 'Shanks', answers: ['shanks', 'redhair', 'redhairshanks', 'akagami'], art: [
    { d: circle(150, 92, 72), c: 'white', w: 1.5, fill: true }, // the moon behind him
    { d: poly([[135, 36], [131, 20], [140, 22], [143, 11], [151, 18], [159, 10], [161, 21], [170, 23], [165, 38]], true), c: 'red', sil: true }, // red hair
    { d: ellipse(150, 36, 13, 15), c: 'red', sil: true },
    { d: limb([[150, 46], [150, 60]], 12), c: 'red', sil: true },
    { d: poly([[132, 58], [168, 58], [166, 112], [134, 112]], true), c: 'red', sil: true },
    { d: 'M138 54 Q100 56 72 82 Q46 104 20 112 Q44 120 30 140 Q58 140 50 166 Q92 158 108 146 Q124 128 130 118 Z', c: 'red', sil: true }, // cape over the empty left sleeve, in the wind
    { d: poly([[164, 54], [186, 62], [194, 118], [190, 168], [168, 146]], true), c: 'red', sil: true },
    { d: limb([[174, 64], [198, 80], [218, 60]], 15, 11), c: 'red', sil: true }, // sword arm, elbow bent, hand at shoulder height
    { d: circle(220, 58, 7), c: 'red', sil: true },
    { d: limb([[142, 108], [138, 150], [132, 188]], 18, 12), c: 'red', sil: true },
    { d: limb([[160, 108], [166, 148], [172, 186]], 18, 12), c: 'red', sil: true },
    { d: ellipse(128, 190, 10, 4) + ' ' + ellipse(176, 188, 10, 4), c: 'red', sil: true },
    { d: 'M224 52 Q252 34 288 14 M215 48 L229 62', c: 'cyan', w: 2.5 }, // Gryphon raised up and out from the hand, the clue
    { d: 'M151 24 L156 46 M156 23 L161 45 M161 25 L165 42', c: 'red', w: 1.5 }, // three scars
  ] },
  { name: 'Whitebeard', answers: ['whitebeard', 'edwardnewgate', 'newgate', 'shirohige'], art: [
    { d: 'M52 90 L32 66 L40 50 L18 26 M52 90 L22 96 L8 86 M52 90 L26 118 L34 136 L12 166 M52 90 L50 128 L40 156 M32 66 L12 60 M26 118 L6 120', c: 'cyan', w: 2 }, // the air cracks
    { d: ellipse(150, 40, 14, 16), c: 'orange', sil: true },
    { d: limb([[162, 32], [174, 30], [182, 38]], 5, 2), c: 'orange', sil: true }, // bandana knot
    { d: limb([[150, 52], [150, 66]], 22), c: 'orange', sil: true },
    { d: ellipse(112, 76, 22, 16), c: 'orange', sil: true }, // shoulders
    { d: ellipse(188, 76, 22, 16), c: 'orange', sil: true },
    { d: poly([[96, 68], [204, 68], [190, 120], [172, 146], [128, 146], [110, 120]], true), c: 'orange', sil: true },
    { d: 'M96 62 Q76 70 68 128 Q62 162 54 188 L98 190 L112 150 Z', c: 'orange', sil: true }, // captain's coat over the shoulders
    { d: 'M204 62 Q226 70 242 118 Q258 152 280 170 Q252 186 230 186 L196 150 Z', c: 'orange', sil: true },
    { d: limb([[134, 142], [118, 168], [108, 190]], 30, 22), c: 'orange', sil: true },
    { d: limb([[166, 142], [184, 168], [194, 190]], 30, 22), c: 'orange', sil: true },
    { d: ellipse(104, 192, 14, 5) + ' ' + ellipse(198, 192, 14, 5), c: 'orange', sil: true },
    { d: limb([[108, 78], [82, 98], [60, 92]], 26, 20), c: 'orange', sil: true }, // the quake punch
    { d: circle(52, 90, 12), c: 'orange', sil: true },
    { d: limb([[194, 80], [214, 110], [232, 122]], 26, 18), c: 'orange', sil: true },
    { d: circle(238, 124, 11), c: 'orange', sil: true },
    { d: limb([[240, 196], [240, 46]], 5), c: 'orange', sil: true }, // bisento
    { d: 'M235 50 Q226 24 250 2 Q264 26 246 50 Z', c: 'orange', sil: true },
    { d: 'M150 50 Q128 57 110 26 Q132 46 150 44 Q168 46 190 26 Q172 57 150 50 Z', c: 'white', w: 2, fill: true }, // the moustache
  ] },
  { name: 'Blackbeard', answers: ['blackbeard', 'marshalldteach', 'teach', 'kurohige'], art: [
    { d: circle(150, 100, 84), c: 'blue', w: 1.5, fill: true },
    { d: ellipse(150, 34, 15, 16), c: 'orange', sil: true }, // head thrown back laughing, facing right
    { d: limb([[140, 26], [120, 20], [104, 28]], 7, 2), c: 'orange', sil: true }, // bandana tails
    { d: limb([[140, 30], [124, 36], [112, 48]], 6, 2), c: 'orange', sil: true },
    { d: poly([[158, 28], [178, 32], [171, 39], [186, 44], [173, 50], [184, 58], [168, 60], [174, 72], [157, 66], [152, 78], [144, 64], [138, 48]], true), c: 'orange', sil: true }, // wild beard
    { d: 'M126 56 Q108 72 112 112 Q116 152 132 156 L170 156 Q210 140 206 104 Q200 72 168 60 Z', c: 'orange', sil: true }, // the belly
    { d: poly([[130, 54], [104, 66], [84, 122], [58, 184], [110, 178], [124, 140]], true), c: 'orange', sil: true }, // coat
    { d: limb([[134, 150], [122, 190]], 24, 20), c: 'orange', sil: true },
    { d: limb([[162, 150], [178, 190]], 24, 20), c: 'orange', sil: true },
    { d: ellipse(118, 192, 14, 5) + ' ' + ellipse(184, 192, 14, 5), c: 'orange', sil: true },
    { d: limb([[132, 70], [104, 82], [80, 70]], 20, 15), c: 'orange', sil: true },
    { d: circle(76, 66, 9), c: 'orange', sil: true },
    { d: limb([[172, 72], [206, 64], [228, 52]], 20, 15), c: 'orange', sil: true }, // the outstretched palm
    { d: circle(232, 50, 9), c: 'orange', sil: true },
    { d: circle(250, 34, 17), c: 'violet', w: 2.5, fill: true }, // black hole in his hand
    { d: spiral(250, 34, 2, 14), c: 'violet', w: 1.5 },
  ] },
  { name: 'Big Mom', answers: ['bigmom', 'charlottelinlin', 'linlin'], art: [
    { d: star(56, 52, 30, 44, 12), c: 'orange', w: 2, fill: true }, // Prometheus
    { d: circle(56, 52, 24), c: 'yellow', w: 2.5, fill: true },
    { d: ellipse(150, 84, 60, 56), c: 'pink', sil: true },
    { d: curls.map(([x, y, r]) => circle(x, y, r)).join(' '), c: 'pink', sil: true }, // the mane, curls down to the shoulders
    { d: 'M96 134 Q30 138 16 200 L284 200 Q270 138 204 134 Z', c: 'pink', sil: true }, // an enormous body
    { d: limb([[228, 132], [258, 100], [264, 70]], 30, 22), c: 'pink', sil: true },
    { d: circle(264, 62, 13), c: 'pink', sil: true },
    { d: limb([[262, 54], [252, 26], [236, 6]], 12, 4), c: 'pink', sil: true }, // Napoleon
    { d: limb([[74, 128], [40, 156], [64, 182]], 28, 22), c: 'pink', sil: true }, // fist on the hip
    { d: 'M102 38 Q116 4 150 6 Q184 4 198 38 Q176 28 150 30 Q124 28 102 38 Z', c: 'yellow', w: 2, fill: true }, // the bicorne, the clue
    { d: circle(150, 18, 4), c: 'yellow', w: 1.5 },
  ] },
  { name: 'Kaido', answers: ['kaido', 'kaidou', 'kaidoofthebeasts'], art: [
    { d: 'M20 190 C6 100 60 20 150 14 C240 8 296 70 282 150 C274 190 240 196 230 170', c: 'cyan', w: 8 }, // the dragon coiled behind
    { d: 'M20 190 C6 100 60 20 150 14 C240 8 296 70 282 150 C274 190 240 196 230 170', c: 'blue', w: 2 },
    { d: 'M14 120 L2 112 L12 104 M40 46 L32 32 L48 36 M110 14 L108 2 L122 10 M256 40 L266 28 L270 44 M290 120 L298 110', c: 'cyan', w: 1.5 },
    { d: ellipse(130, 54, 14, 16), c: 'red', sil: true },
    { d: limb([[122, 44], [108, 32], [102, 10]], 8, 2), c: 'red', sil: true }, // the horns
    { d: limb([[138, 44], [152, 32], [158, 10]], 8, 2), c: 'red', sil: true },
    { d: poly([[118, 42], [96, 56], [70, 74], [50, 106], [74, 96], [62, 120], [92, 98], [112, 84], [118, 70]], true), c: 'red', sil: true }, // wild hair
    { d: limb([[130, 66], [130, 80]], 20), c: 'red', sil: true },
    { d: poly([[76, 78], [184, 78], [170, 140], [152, 170], [108, 170], [90, 140]], true), c: 'red', sil: true },
    { d: poly([[80, 74], [56, 82], [30, 140], [16, 198], [70, 198], [96, 150]], true), c: 'red', sil: true }, // coat over the shoulders
    { d: poly([[180, 74], [200, 82], [214, 140], [226, 198], [170, 198], [166, 150]], true), c: 'red', sil: true },
    { d: limb([[112, 166], [104, 200]], 32), c: 'red', sil: true },
    { d: limb([[150, 166], [158, 200]], 32), c: 'red', sil: true },
    { d: limb([[184, 88], [214, 112], [206, 82]], 26, 20), c: 'red', sil: true }, // fist on the shoulder
    { d: circle(204, 78, 13), c: 'red', sil: true },
    { d: club.body, c: 'orange', w: 2.5, fill: true }, // Hassaikai, the clue
    { d: club.studs, c: 'yellow', w: 2.5 },
  ] },
  { name: 'Gol D. Roger', answers: ['roger', 'goldroger', 'goldoroger', 'pirateking', 'kingofthepirates'], art: [
    { d: 'M64 8 L236 194 M236 8 L64 194 M64 8 L60 26 M64 8 L80 12 M236 8 L240 26 M236 8 L220 12', c: 'yellow', w: 2.5 }, // the crossed spears
    { d: ellipse(150, 50, 13, 15), c: 'red', sil: true },
    { d: 'M130 36 Q126 14 140 9 Q150 15 160 9 Q174 14 170 36 Z', c: 'red', sil: true }, // the captain's hat
    { d: 'M80 36 Q86 20 104 30 Q150 44 196 30 Q214 20 220 36 Q150 56 80 36 Z', c: 'red', sil: true },
    { d: limb([[150, 58], [150, 66]], 14), c: 'red', sil: true },
    { d: poly([[122, 62], [178, 62], [174, 120], [126, 120]], true), c: 'red', sil: true },
    { d: poly([[124, 60], [108, 70], [94, 130], [80, 190], [120, 186], [128, 120]], true), c: 'red', sil: true }, // coat tails in the wind
    { d: 'M176 60 Q196 68 206 112 Q218 150 258 176 Q216 192 184 186 L174 120 Z', c: 'red', sil: true },
    { d: limb([[124, 68], [102, 94], [118, 112]], 18, 14), c: 'red', sil: true }, // hand on the hip
    { d: limb([[178, 68], [214, 66], [250, 54]], 18, 12), c: 'red', sil: true }, // pointing to the treasure
    { d: limb([[248, 54], [268, 48]], 7, 4), c: 'red', sil: true },
    { d: limb([[118, 120], [86, 150]], 5, 4), c: 'red', sil: true }, // sword at the hip
    { d: limb([[138, 118], [126, 190]], 17, 13), c: 'red', sil: true },
    { d: limb([[162, 118], [176, 190]], 17, 13), c: 'red', sil: true },
    { d: ellipse(122, 192, 12, 4) + ' ' + ellipse(180, 192, 12, 4), c: 'red', sil: true },
    { d: limb([[150, 58], [134, 61], [120, 56], [110, 46]], 7, 1), c: 'white', w: 2, fill: true }, // the moustache, horns up
    { d: limb([[150, 58], [166, 61], [180, 56], [190, 46]], 7, 1), c: 'white', w: 2, fill: true },
  ] },
];
