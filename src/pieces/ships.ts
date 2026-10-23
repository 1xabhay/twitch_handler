// More Straw Hats and their ships, as rim-lit silhouettes with one glowing clue.
import { circle, ellipse, limb, n, poly, spiral, type Piece } from './draw.ts';

// a point `k` along direction `deg` (0 = up) from (x, y), shifted `side` across it
const at = (x: number, y: number, deg: number, k: number, side = 0): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [x + Math.sin(a) * k + Math.cos(a) * side, y - Math.cos(a) * k + Math.sin(a) * side];
};
// an open hand at (x, y), fingers fanning toward `deg`
const hand = (x: number, y: number, deg: number) => circle(x, y, 4.5) + ' ' +
  [-34, -12, 10, 32].map((s) => limb([at(x, y, deg + s, 2), at(x, y, deg + s, 11 - Math.abs(s) / 12)], 2.8, 1.8)).join(' ') + ' ' +
  limb([at(x, y, deg - 80, 2), at(x, y, deg - 70, 8)], 2.8, 2);
// Hana Hana: an arm sprouting along a curve, ending in an open hand
const sprout = (pts: [number, number][], deg: number) => limb(pts, 7, 4.5) + ' ' + hand(...pts[pts.length - 1]!, deg);
const star = (x: number, y: number, r: number, turn = 0) => poly(Array.from({ length: 10 }, (_, i) => at(x, y, turn + i * 36, i % 2 ? r * 0.45 : r)), true);
// the Sunny's figurehead: a lion's mane of 14 round petals around (228, 112)
const mane = 'M' + at(228, 112, 0, 32).map(n).join(' ') + Array.from({ length: 14 }, (_, i) => ' Q' + at(228, 112, (i + 0.5) * (360 / 14), 54).map(n).join(' ') + ' ' + at(228, 112, (i + 1) * (360 / 14), 32).map(n).join(' ')).join('') + ' Z';
const petal = (x: number, y: number, deg: number) => poly([at(x, y, deg, 0), at(x, y, deg + 40, 5), at(x, y, deg, 9), at(x, y, deg - 40, 5)], true);
// the Straw Hat jolly roger: crossbones, skull, the hat on top
const roger = (x: number, y: number) => [
  { d: `M${x - 15} ${y - 6} L${x + 15} ${y + 14} M${x + 15} ${y - 6} L${x - 15} ${y + 14}`, c: 'white' as const, w: 2.5 },
  { d: circle(x, y + 2, 8) + ' ' + poly([[x - 4, y + 8], [x - 4, y + 13], [x + 4, y + 13], [x + 4, y + 8]]), c: 'white' as const, w: 1.5, fill: true },
  { d: ellipse(x, y - 5, 15, 3.5) + ` M${x - 8} ${y - 6} C${x - 8} ${y - 18} ${x + 8} ${y - 18} ${x + 8} ${y - 6}`, c: 'yellow' as const, w: 2, fill: true },
  { d: `M${x - 8} ${y - 8} Q${x} ${y - 6} ${x + 8} ${y - 8}`, c: 'red' as const, w: 2 },
];

export const SHIPS: Piece[] = [
  { name: 'Robin', answers: ['robin', 'nicorobin', 'nico', 'demonchild', 'devilchild'], art: [
    { d: circle(150, 84, 60), c: 'violet', w: 1.5, fill: true }, // a violet moon behind her
    { d: ellipse(150, 28, 9, 11), c: 'cyan', sil: true },
    { d: limb([[150, 22], [154, 46], [164, 66], [182, 80]], 24, 6), c: 'cyan', sil: true }, // long straight hair, caught by the wind
    { d: limb([[150, 36], [150, 50]], 7), c: 'cyan', sil: true },
    { d: poly([[135, 52], [165, 52], [162, 72], [158, 90], [170, 114], [130, 114], [142, 90], [138, 72]], true), c: 'cyan', sil: true },
    { d: limb([[137, 56], [127, 74], [131, 88], [150, 78], [164, 62]], 9, 6) + ' ' + limb([[163, 56], [173, 74], [169, 88], [150, 80], [136, 62]], 9, 6), c: 'cyan', sil: true }, // arms crossed: the Hana Hana stance
    { d: limb([[142, 110], [138, 150], [143, 190]], 17, 6) + ' ' + limb([[160, 110], [160, 150], [152, 190]], 17, 6), c: 'cyan', sil: true },
    { d: poly([[136, 186], [148, 188], [150, 194], [134, 194]], true) + ' ' + poly([[146, 186], [158, 188], [160, 194], [144, 194]], true), c: 'cyan', sil: true }, // heels
    // Cien Fleur: arms blooming out of her back like wings
    { d: [
      sprout([[144, 58], [116, 40], [96, 18]], -40), sprout([[143, 64], [108, 58], [80, 48]], -70), sprout([[143, 72], [110, 82], [84, 96]], -110), sprout([[144, 80], [122, 104], [108, 128]], -150),
      sprout([[156, 58], [184, 40], [204, 18]], 40), sprout([[157, 64], [192, 58], [220, 48]], 70), sprout([[157, 72], [190, 82], [216, 96]], 110), sprout([[156, 80], [178, 104], [192, 128]], 150),
    ].join(' '), c: 'violet', sil: true },
    { d: [petal(70, 30, 20), petal(236, 32, -30), petal(64, 118, 70), petal(240, 116, -60), petal(196, 160, 30), petal(98, 158, -20), petal(226, 74, 100)].join(' '), c: 'pink', w: 1.5, fill: true }, // cherry petals: hana
  ] },
  { name: 'Franky', answers: ['franky', 'cutty', 'cuttyflam', 'ironmanfranky'], art: [
    { d: circle(150, 96, 74), c: 'orange', w: 1.5, fill: true },
    { d: ellipse(150, 96, 11, 12) + ' ' + limb([[150, 100], [150, 112]], 14), c: 'pink', sil: true },
    { d: 'M139 90 C130 72 140 58 162 56 C178 55 182 66 172 69 C165 71 162 80 162 90 Z', c: 'blue', sil: true }, // the pompadour
    { d: 'M98 110 Q150 98 202 110 Q198 132 176 150 L124 150 Q102 132 98 110 Z', c: 'pink', sil: true }, // barrel chest
    { d: poly([[104, 110], [94, 178], [206, 178], [196, 110]], true), c: 'pink', sil: true }, // open shirt hanging long, one shape over the hips
    { d: limb([[140, 172], [134, 189]], 15, 12) + ' ' + limb([[160, 172], [166, 189]], 15, 12), c: 'pink', sil: true }, // narrow straight stance
    { d: ellipse(130, 191, 12, 4) + ' ' + ellipse(170, 191, 12, 4), c: 'pink', sil: true },
    { d: limb([[108, 112], [86, 98], [88, 76]], 12, 10) + ' ' + limb([[192, 112], [214, 98], [212, 76]], 12, 10), c: 'pink', sil: true }, // skinny upper arms
    { d: limb([[88, 80], [108, 48], [136, 22]], 30, 24) + ' ' + limb([[212, 80], [192, 48], [164, 22]], 30, 24), c: 'blue', sil: true }, // giant forearms, pressed together: SUPER
    { d: circle(138, 15, 11) + ' ' + circle(162, 15, 11), c: 'blue', sil: true },
    { d: star(150, 40, 17), c: 'cyan', w: 2.5, fill: true }, // the two half stars meet
  ] },
  { name: 'Jinbe', answers: ['jinbe', 'jinbei', 'jimbei', 'jinbeioyabun', 'knightofthesea'], art: [
    { d: circle(140, 92, 72), c: 'red', w: 1.5, fill: true }, // the Sun Pirates' sun
    { d: 'M0 166 Q30 158 60 166 Q90 174 120 166 M180 166 Q210 158 240 166 Q270 174 300 166', c: 'blue', w: 1.5 },
    { d: ellipse(124, 42, 21, 18) + ' ' + ellipse(138, 50, 14, 10), c: 'yellow', sil: true }, // broad fish-man head, heavy jaw
    { d: poly([[146, 56], [156, 40], [156, 56]], true), c: 'yellow', sil: true }, // tusk jutting from the jaw
    { d: limb([[108, 30], [88, 34], [74, 50], [64, 72]], 13, 6), c: 'yellow', sil: true }, // hair tied back
    { d: poly([[84, 74], [100, 58], [150, 58], [164, 74], [178, 186], [70, 186]], true), c: 'yellow', sil: true }, // massive kimono, one closed robe to the ground
    { d: limb([[146, 70], [180, 92], [208, 62]], 22, 16), c: 'yellow', sil: true }, // striking arm, elbow bent low, forearm up
    { d: poly([[200, 72], [204, 40], [210, 38], [212, 52], [216, 36], [222, 38], [220, 54], [228, 44], [233, 48], [222, 66], [214, 76]], true), c: 'yellow', sil: true }, // open palm, fingers up
    { d: limb([[92, 72], [58, 100], [86, 112]], 20, 14) + ' ' + poly([[84, 106], [104, 100], [108, 108], [90, 118]], true), c: 'yellow', sil: true }, // guard arm, flat hand across the chest
    { d: ellipse(88, 188, 16, 4) + ' ' + ellipse(160, 188, 16, 4), c: 'yellow', sil: true }, // sandals
    { d: 'M232 32 Q256 30 268 52 Q254 46 244 54 M236 74 Q260 74 274 96 Q258 90 246 96 M240 54 Q262 58 286 72', c: 'cyan', w: 2.5 }, // fish-man karate: water curls off the palm
    { d: 'M258 18 Q262 26 258 30 Q254 26 258 18 Z M284 72 Q288 80 284 84 Q280 80 284 72 Z M270 124 Q274 132 270 136 Q266 132 270 124 Z', c: 'cyan', w: 2, fill: true }, // droplets
  ] },
  { name: 'Going Merry', answers: ['goingmerry', 'merry', 'merrygo', 'goingmerrygo'], art: [
    { d: circle(232, 62, 44), c: 'yellow', w: 1.5, fill: true }, // full moon
    { d: 'M0 178 Q25 172 50 178 Q75 184 100 178 Q125 172 150 178 Q175 184 200 178 Q225 172 250 178 Q275 184 300 178 M20 192 Q45 186 70 192 Q95 198 120 192 M170 192 Q195 186 220 192 Q245 198 270 192', c: 'blue', w: 1.5 },
    { d: 'M36 110 L76 110 L80 128 L200 132 Q218 130 230 112 L236 124 Q226 164 196 174 L76 174 Q48 170 40 140 Z', c: 'pink', sil: true }, // round hull, raised stern
    { d: limb([[140, 132], [140, 14]], 4), c: 'pink', sil: true }, // mast
    { d: 'M98 50 L182 50 Q192 84 182 118 L98 118 Q88 84 98 50 Z', c: 'pink', sil: true }, // mainsail, full of wind
    { d: 'M110 24 L170 24 Q176 34 170 44 L110 44 Q104 34 110 24 Z', c: 'pink', sil: true }, // topsail
    { d: 'M140 12 L162 15 L140 20 Z', c: 'pink', sil: true }, // pennant
    { d: limb([[62, 112], [62, 72]], 3) + ' M64 74 L92 104 L64 104 Z', c: 'pink', sil: true }, // little stern sail
    { d: limb([[228, 130], [290, 118]], 4, 2), c: 'pink', sil: true }, // bowsprit
    { d: limb([[222, 132], [238, 118], [248, 100]], 16, 12), c: 'pink', sil: true }, // the figurehead's neck rising from the bow
    { d: ellipse(252, 88, 15, 13) + ' ' + ellipse(267, 96, 11, 7) + ' ' + circle(243, 85, 11) + ' ' + ellipse(232, 80, 8, 4), c: 'pink', sil: true }, // the sheep: head, snout, curled horn, ear
    { d: spiral(243, 85, 2, 9), c: 'yellow', w: 2 }, // the curled horn glows
    ...roger(140, 82),
  ] },
  { name: 'Thousand Sunny', answers: ['thousandsunny', 'sunny', 'sunnygo'], art: [
    { d: circle(228, 110, 52), c: 'orange', w: 1.5, fill: true }, // the sun behind the lion
    { d: 'M0 150 L300 150 M40 162 L260 162 M80 174 L220 174', c: 'orange', w: 1 },
    { d: 'M24 114 L60 114 L64 128 L206 128 L210 140 Q200 176 170 180 L58 180 Q30 172 24 114 Z', c: 'cyan', sil: true }, // the hull
    { d: limb([[118, 130], [118, 14]], 5) + ' ' + ellipse(118, 30, 13, 11), c: 'cyan', sil: true }, // mainmast and the round crow's nest
    { d: 'M76 48 L160 48 Q170 84 160 120 L76 120 Q66 84 76 48 Z', c: 'cyan', sil: true }, // mainsail
    { d: limb([[44, 116], [44, 84]], 3) + ' ' + poly([[34, 84], [56, 84], [54, 100], [34, 100]], true), c: 'cyan', sil: true }, // stern flag
    { d: mane, c: 'cyan', sil: true }, // the lion's mane: petals like a sunflower
    { d: circle(228, 112, 19), c: 'yellow', w: 2.5 }, // the lion's face ring glows
    ...roger(118, 82),
  ] },
];
