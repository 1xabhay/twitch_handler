// Marines as rim-lit silhouettes in the Justice coat, each with one glowing clue.
import { afro, circle, ellipse, limb, n, poly, type Piece, type Stroke } from './draw.ts';

// a wheel: outer circle one way, inner the other, so the dark fill leaves a hole
const ring = (x: number, y: number, r: number, ri: number) =>
  `${circle(x, y, r)} M${n(x - ri)} ${y} A${ri} ${ri} 0 1 1 ${n(x + ri)} ${y} A${ri} ${ri} 0 1 1 ${n(x - ri)} ${y} Z`;
// thin light wedges fanning out of (x, y), clamped to the frame
const rays = (x: number, y: number, k: number, r: number) => Array.from({ length: k }, (_, i) => {
  const a = (i / k) * 2 * Math.PI, at = (t: number): [number, number] =>
    [Math.min(300, Math.max(0, x + Math.cos(t) * r)), Math.min(200, Math.max(0, y + Math.sin(t) * r))];
  return poly([[x, y], at(a - 0.06), at(a + 0.06)], true);
}).join(' ');
const sil = (d: string, c: Stroke['c']): Stroke => ({ d, c, sil: true });

export const MARINES: Piece[] = [
  { name: 'Smoker', answers: ['smoker', 'whitehunter', 'smokerthewhitehunter'], art: [
    { d: afro(96, 120, 54, 7) + ' ' + afro(206, 100, 50, 7), c: 'violet', w: 1.5, fill: true }, // smoke billowing behind
    sil(limb([[226, 150], [70, 22]], 8) + ' ' + limb([[96, 32], [84, 30], [74, 40]], 5) + ' ' + ellipse(68, 18, 7, 5), 'cyan'), // the jitte across his back
    sil(ellipse(152, 30, 13, 15) + ' ' + limb([[152, 40], [152, 56]], 15), 'cyan'),
    sil(poly([[108, 56], [196, 56], [190, 100], [180, 128], [124, 128], [114, 100]], true), 'cyan'),
    sil(poly([[128, 124], [176, 124], [196, 160], [172, 164], [152, 140], [134, 164], [108, 160]], true), 'cyan'),
    sil(limb([[120, 158], [104, 188]], 18, 13) + ' ' + limb([[184, 158], [202, 188]], 18, 13), 'cyan'),
    sil(ellipse(100, 191, 14, 4) + ' ' + ellipse(206, 191, 14, 4), 'cyan'),
    sil(limb([[110, 62], [96, 100], [112, 128]], 18, 13) + ' ' + circle(114, 132, 10) + ' ' + limb([[194, 62], [208, 100], [192, 128]], 18, 13) + ' ' + circle(190, 132, 10), 'cyan'), // fists
    sil(poly([[150, 52], [106, 52], [92, 66], [86, 110], [72, 156], [86, 152], [96, 164], [106, 150], [112, 110], [124, 64]], true), 'cyan'), // Justice coat
    sil(poly([[154, 52], [198, 52], [212, 66], [218, 110], [232, 156], [218, 152], [208, 164], [198, 150], [192, 110], [180, 64]], true), 'cyan'),
    { d: 'M160 36 L180 30 M160 42 L182 41', c: 'orange', w: 4 }, // two cigars
    { d: circle(182, 30, 2) + ' ' + circle(184, 41, 2), c: 'red', w: 3, fill: true },
    { d: 'M184 28 C196 20 184 12 196 4 M186 40 C204 36 198 22 214 14 C226 8 218 4 228 2', c: 'white', w: 1.5 },
  ] },
  { name: 'Garp', answers: ['garp', 'monkeydgarp', 'garpthefist', 'garpthehero', 'herogarp'], art: [
    { d: rays(236, 22, 14, 120), c: 'orange', w: 1, fill: true }, // the punch bursts light
    sil(ellipse(140, 40, 14, 15) + ' ' + limb([[140, 50], [142, 64]], 18), 'cyan'),
    sil(poly([[94, 62], [190, 62], [198, 90], [182, 134], [106, 134], [88, 92]], true), 'cyan'),
    sil(poly([[106, 128], [182, 128], [202, 166], [176, 170], [146, 142], [118, 172], [90, 166]], true), 'cyan'),
    sil(limb([[102, 164], [78, 188]], 22, 15) + ' ' + limb([[188, 164], [214, 188]], 22, 15), 'cyan'),
    sil(ellipse(74, 191, 16, 4) + ' ' + ellipse(220, 191, 16, 4), 'cyan'),
    sil(limb([[180, 72], [214, 54], [230, 32]], 24, 19) + ' ' + ellipse(236, 22, 16, 15), 'cyan'), // raised fist
    sil(limb([[100, 72], [66, 96], [44, 112]], 24, 17) + ' ' + circle(38, 116, 13), 'cyan'), // other fist cocked out
    sil(poly([[140, 60], [98, 58], [84, 78], [74, 124], [62, 160], [76, 156], [86, 166], [98, 152], [114, 124]], true), 'cyan'), // Justice coat
    sil(poly([[140, 60], [186, 58], [200, 80], [210, 124], [226, 158], [210, 154], [200, 164], [190, 150], [172, 120]], true), 'cyan'),
        { d: 'M120 36 Q118 8 140 8 Q162 8 160 36 Q140 31 120 36 Z', c: 'white', w: 2 }, // the dog hat
    { d: 'M124 14 Q104 16 106 46 Q118 48 122 28 M156 14 Q176 16 174 46 Q162 48 158 28', c: 'white', w: 2, fill: true }, // floppy ears
    { d: 'M131 30 Q132 22 140 22 Q148 22 149 30 M134 15 L134 17 M146 15 L146 17 ' + circle(140, 22, 2.5), c: 'pink', w: 2 }, // muzzle, eyes, nose
  ] },
  { name: 'Aokiji', answers: ['aokiji', 'kuzan'], art: [
    { d: 'M8 192 L26 104 L44 192 Z M36 192 L58 142 L74 192 Z M232 192 L254 96 L274 192 Z M262 192 L284 132 L298 192 Z M196 192 L214 152 L228 192 Z M8 194 L292 194', c: 'cyan', w: 1.5, fill: true }, // ice field
    sil(ring(84, 160, 30, 25) + ' ' + ring(214, 160, 30, 25), 'white'),
    sil(limb([[84, 160], [146, 162]], 4) + ' ' + limb([[84, 160], [124, 110]], 4) + ' ' + limb([[124, 110], [146, 162]], 5) + ' ' + limb([[124, 112], [196, 110]], 5), 'white'),
    sil(limb([[146, 162], [196, 116]], 5) + ' ' + limb([[196, 102], [214, 160]], 5) + ' ' + limb([[188, 98], [200, 95], [207, 101]], 4) + ' ' + ellipse(122, 106, 10, 3), 'white'),
    sil(limb([[124, 102], [148, 76], [162, 56]], 22, 24) + ' ' + limb([[164, 54], [172, 44]], 10), 'white'), // lanky torso, leaning in
    sil(afro(174, 36, 10, 7), 'white'), // curly hair
    sil(limb([[164, 60], [184, 80], [198, 98]], 10, 8), 'white'),
    sil(limb([[128, 104], [172, 114]], 15, 12) + ' ' + limb([[172, 114], [158, 166]], 12, 8) + ' ' + ellipse(160, 168, 10, 3), 'white'),
    sil(limb([[124, 104], [150, 130], [132, 168]], 13, 8), 'white'),
    sil('M172 56 Q132 48 96 64 Q66 78 30 88 L52 98 L24 114 Q70 112 104 100 Q132 92 152 90 Z', 'white'), // Justice coat streaming behind
    sil(limb([[156, 60], [120, 70], [82, 66]], 11, 8), 'white'),
    { d: 'M162 30 Q170 23 178 28 Q186 23 192 30 Q190 38 178 35 Q170 38 162 34 Z', c: 'violet', w: 2, fill: true }, // sleep mask up on the forehead
    { d: 'M167 30 Q170 27 173 30 M181 30 Q184 27 187 30', c: 'white', w: 1 },
  ] },
  { name: 'Kizaru', answers: ['kizaru', 'borsalino'], art: [
    { d: rays(150, 96, 18, 160), c: 'yellow', w: 1, fill: true }, // light pouring out
    sil(ellipse(140, 38, 12, 14) + ' ' + limb([[140, 48], [136, 62]], 11), 'violet'),
    sil(limb([[134, 62], [142, 92], [148, 118]], 36, 28), 'violet'),
    sil(limb([[142, 116], [128, 156], [118, 188]], 20, 13) + ' ' + ellipse(112, 191, 14, 4), 'violet'), // standing leg
    sil(limb([[152, 116], [166, 154], [174, 188]], 20, 13) + ' ' + ellipse(180, 191, 14, 4), 'violet'), // second leg, planted
    sil(limb([[146, 66], [196, 68], [238, 68]], 13, 9) + ' ' + ellipse(240, 68, 6, 5) + ' ' + limb([[244, 67], [254, 67]], 3), 'violet'), // arm straight out, one finger pointing
    sil(limb([[118, 66], [110, 92], [130, 112]], 12, 10), 'violet'), // other hand in the pocket
    sil(poly([[118, 56], [154, 58], [160, 82], [150, 120], [128, 150], [100, 172], [84, 164], [70, 178], [60, 160], [88, 120], [104, 76]], true), 'violet'), // Justice coat
    sil(limb([[118, 62], [96, 92], [76, 112]], 13, 9), 'violet'),
    { d: 'M132 33 L158 33 L157 42 L148 42 L145 36 L143 42 L134 42 Z', c: 'orange', w: 2, fill: true }, // the shades
    { d: 'M256 67 L298 67', c: 'yellow', w: 4 }, // light-speed beam from the fingertip
    { d: 'M256 61 L262 67 L256 73 M262 60 L262 74', c: 'white', w: 1.5 },
  ] },
  { name: 'Akainu', answers: ['akainu', 'sakazuki', 'fleetadmiralakainu'], art: [
    { d: circle(150, 112, 76), c: 'red', w: 1.5, fill: true }, // magma glow
    sil(ellipse(150, 46, 12, 14) + ' ' + limb([[150, 56], [154, 68]], 14), 'white'),
    sil(poly([[134, 42], [136, 26], [150, 20], [166, 26], [168, 40], [178, 44], [134, 44]], true), 'white'), // cap
    sil(limb([[146, 128], [152, 96], [162, 68]], 34, 46), 'white'),
    sil(limb([[144, 76], [116, 94], [100, 84]], 16, 12) + ' ' + circle(96, 82, 9), 'white'),
    sil(limb([[170, 72], [208, 52], [234, 34]], 18, 15), 'white'), // punching arm
    sil(limb([[160, 124], [196, 150], [204, 188]], 22, 14) + ' ' + limb([[140, 124], [110, 158], [84, 188]], 20, 13), 'white'),
    sil(ellipse(208, 191, 14, 4) + ' ' + ellipse(80, 191, 14, 4), 'white'),
    sil(poly([[140, 64], [170, 62], [176, 90], [160, 130], [120, 160], [70, 176], [86, 160], [58, 166], [90, 130], [118, 90]], true), 'white'), // Justice coat
    sil(limb([[140, 66], [104, 70], [70, 62]], 13, 9), 'white'),
    { d: 'M232 34 Q229 14 238 14 Q242 8 248 12 Q253 8 257 13 Q263 11 263 22 L262 36 Q258 42 246 42 Q234 42 232 34 Z', c: 'orange', w: 3, fill: true }, // magma fist
    { d: 'M242 14 L242 24 M249 13 L249 24 M256 14 L256 24 M234 28 Q246 24 254 30', c: 'yellow', w: 1.5 },
    { d: 'M238 38 Q236 50 239 58 M250 40 Q249 58 253 68 M259 34 Q266 44 264 52 M232 20 Q226 10 232 4 M250 12 Q254 4 260 6', c: 'red', w: 3.5 }, // lava drips, rising heat
    { d: circle(239, 62, 2) + ' ' + circle(253, 73, 2.5), c: 'yellow', w: 2, fill: true },
  ] },
];
