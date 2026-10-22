// Fan favourites as dark silhouettes in their signature pose, rim-lit, one glowing clue each (no faces).
import { circle, ellipse, limb, poly, type Piece, type Stroke } from './draw.ts';

const s = (d: string, c: Stroke['c']): Stroke => ({ d, c, sil: true });
// a heart with its dip at (x, y), s wide
const heart = (x: number, y: number, w: number) => {
  const k = w / 100;
  return `M${x} ${y + 65 * k} C${x - 60 * k} ${y + 27 * k} ${x - 50 * k} ${y - 27 * k} ${x} ${y} C${x + 50 * k} ${y - 27 * k} ${x + 60 * k} ${y + 27 * k} ${x} ${y + 65 * k} Z`;
};

export const FAVOURITES: Piece[] = [
  { name: 'Hancock', answers: ['hancock', 'boahancock', 'boa', 'piratempress', 'snakeprincess'], art: [
    { d: heart(150, 60, 190), c: 'pink', w: 1.5, fill: true }, // the Love-Love heart behind her
    s(limb([[138, 112], [136, 150], [130, 188]], 18, 9) + ' ' + limb([[154, 112], [158, 150], [162, 188]], 18, 9), 'violet'),
    s(ellipse(126, 191, 10, 3) + ' ' + ellipse(166, 191, 10, 3), 'violet'),
    s(poly([[128, 100], [166, 100], [172, 130], [168, 176], [158, 176], [150, 132], [138, 176], [124, 176], [122, 130]], true), 'violet'), // long dress, slit
    s(limb([[146, 114], [152, 90], [160, 66]], 26, 34), 'violet'), // leaning back
    s(limb([[162, 64], [168, 52]], 10), 'violet'),
    s(limb([[168, 50], [168, 44], [164, 34]], 21, 15), 'violet'), // head tipped back, chin up
    s(limb([[172, 34], [188, 62], [194, 100], [196, 140]], 24, 14), 'violet'), // straight hair falling behind
    s(limb([[146, 68], [122, 82], [100, 96]], 10, 7) + ' ' + circle(97, 98, 5) + ' ' + limb([[94, 100], [84, 108]], 3.5, 2.5), 'violet'), // pointing down at you
    s(limb([[174, 68], [198, 90], [166, 108]], 10, 8), 'violet'), // hand on hip
    s(limb(Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (0.5 + i / 4), k = 1 - i / 24; return [244 + Math.cos(a) * 30 * k, 182 + Math.sin(a) * 8 * k] as [number, number]; }), 10, 9) + ' ' + limb([[272, 182], [276, 160], [256, 146], [262, 126]], 11, 8) + ' ' + ellipse(266, 120, 11, 7), 'violet'), // Salome coiled beside her
    { d: heart(72, 112, 26), c: 'pink', w: 2, fill: true }, // Mero Mero heart off her fingertip
  ] },
  { name: 'Sabo', answers: ['sabo', 'revolutionary', 'flameemperor'], art: [
    { d: 'M60 196 C40 150 84 132 72 90 C100 108 102 126 112 118 C102 80 132 58 122 18 C162 48 172 88 162 108 C182 90 182 70 204 58 C214 100 236 132 224 196 Z', c: 'orange', w: 1.5, fill: true }, // Mera Mera flames
    s(poly([[128, 8], [166, 6], [164, 34], [130, 36]], true) + ' ' + ellipse(147, 36, 28, 5), 'blue'), // top hat
    s(ellipse(150, 48, 11, 12) + ' ' + ellipse(142, 52, 12, 11), 'blue'),
    s(limb([[150, 58], [152, 66]], 10), 'blue'),
    s(poly([[132, 66], [168, 66], [174, 112], [136, 116]], true), 'blue'),
    s(poly([[134, 70], [150, 110], [140, 140], [90, 178], [56, 178], [100, 130], [118, 90]], true), 'blue'), // long coat flying back
    s(poly([[160, 100], [184, 138], [178, 150], [158, 120]], true), 'blue'),
    s(limb([[162, 114], [184, 148], [194, 186]], 16, 10) + ' ' + limb([[142, 114], [128, 152], [112, 186]], 16, 10), 'blue'),
    s(ellipse(198, 190, 11, 4) + ' ' + ellipse(106, 190, 11, 4), 'blue'),
    s(limb([[164, 70], [196, 78], [222, 74]], 11, 8) + ' ' + circle(226, 74, 7), 'blue'),
    s(limb([[208, 64], [288, 112]], 6), 'blue'), // the pipe held out
    s(limb([[136, 70], [124, 96], [122, 118]], 10, 8), 'blue'),
    { d: circle(140, 27, 5.5) + ' ' + circle(155, 27, 5.5), c: 'cyan', w: 2.5, fill: true }, // goggles on the hat
    { d: 'M129 28 L134.5 27 M145.5 27 L149.5 27 M160.5 27 L165 26', c: 'cyan', w: 1.5 },
  ] },
  { name: 'Yamato', answers: ['yamato', 'oniprincess'], art: [
    { d: circle(160, 86, 76), c: 'yellow', w: 1.5, fill: true }, // Wano moon
    s(limb([[142, 34], [120, 50], [100, 74], [80, 92]], 24, 3) + ' ' + limb([[144, 40], [124, 68], [106, 104]], 20, 3) + ' ' + limb([[146, 46], [134, 82], [126, 124]], 14, 3), 'cyan'), // long mane in the wind
    s(ellipse(150, 44, 12, 13), 'cyan'),
    s(limb([[150, 56], [150, 64]], 10), 'cyan'),
    s(poly([[130, 62], [172, 62], [168, 112], [134, 112]], true), 'cyan'),
    s(poly([[132, 106], [168, 106], [198, 188], [170, 190], [152, 140], [138, 190], [102, 188]], true), 'cyan'), // hakama, wide stance
    s(ellipse(110, 190, 12, 4) + ' ' + ellipse(190, 190, 12, 4), 'cyan'),
    s(limb([[138, 108], [172, 66], [258, 14]], 7, 22), 'cyan'), // kanabo over the shoulder
    s([[214, 30], [232, 18], [246, 26], [226, 40]].map(([x, y]) => circle(x!, y!, 3.5)).join(' '), 'cyan'), // its studs
    s(limb([[170, 66], [180, 92], [146, 102]], 11, 8) + ' ' + circle(142, 102, 7), 'cyan'),
    s(limb([[132, 66], [120, 92], [118, 114]], 10, 8) + ' ' + circle(118, 117, 6), 'cyan'),
    { d: 'M141 36 Q126 26 132 4 Q140 22 148 32 Z M159 32 Q166 22 172 4 Q178 26 163 36 Z', c: 'orange', w: 2, fill: true }, // oni horns
  ] },
  { name: 'Vivi', answers: ['vivi', 'nefertarivivi', 'nefertari', 'missweds', 'misswednesday', 'princessvivi'], art: [
    { d: circle(150, 100, 72), c: 'yellow', w: 1.5, fill: true }, // Alabasta sun
    { d: 'M0 196 Q80 176 160 190 Q230 200 300 184', c: 'orange', w: 1.5 },
    s(ellipse(140, 128, 42, 24), 'violet'), // Karoo
    s(poly([[104, 120], [76, 106], [86, 124], [72, 132], [104, 138]], true), 'violet'),
    s(limb([[168, 122], [186, 100], [184, 80], [196, 62]], 22, 14), 'violet'),
    s(ellipse(200, 58, 13, 11) + ' ' + 'M208 52 Q234 50 238 58 Q228 66 208 64 Z' + ' ' + limb([[196, 48], [188, 36]], 4, 2), 'violet'),
    s(limb([[150, 146], [170, 162], [184, 184]], 10, 5) + ' ' + poly([[178, 184], [200, 190], [180, 193]], true), 'violet'), // running
    s(limb([[128, 146], [110, 160], [92, 172]], 10, 5) + ' ' + poly([[96, 168], [76, 176], [90, 180]], true), 'violet'),
    s(limb([[124, 108], [150, 110]], 14) + ' ' + limb([[150, 110], [154, 134]], 10, 7), 'violet'), // Vivi in the saddle
    s(limb([[128, 108], [136, 88], [148, 72]], 18, 16), 'violet'),
    s(ellipse(154, 60, 10, 11), 'violet'),
    s(limb([[146, 76], [168, 90], [182, 92]], 7, 5), 'violet'),
    s(limb([[152, 50], [130, 42], [106, 46], [80, 38]], 12, 3), 'violet'), // high ponytail streaming back
    { d: 'M152 48 C134 40 116 44 82 38 M150 53 C130 48 110 50 92 46', c: 'cyan', w: 2.5 },
    { d: circle(152, 50, 3.5), c: 'cyan', w: 2, fill: true },
  ] },
  { name: 'Lucci', answers: ['lucci', 'roblucci', 'hattori'], art: [
    { d: circle(160, 100, 78), c: 'violet', w: 1.5, fill: true },
    s(poly([[140, 6], [172, 8], [170, 34], [142, 34]], true) + ' ' + ellipse(156, 35, 24, 4), 'orange'), // top hat
    s(ellipse(156, 48, 11, 12) + ' ' + limb([[162, 42], [172, 64], [176, 88]], 16, 8), 'orange'),
    s(limb([[156, 58], [158, 66]], 10), 'orange'),
    s(poly([[138, 66], [176, 66], [174, 118], [142, 118]], true) + ' ' + poly([[144, 110], [176, 110], [186, 140], [150, 136]], true), 'orange'),
    s(limb([[148, 116], [118, 148], [108, 186]], 16, 10) + ' ' + limb([[168, 116], [190, 154], [210, 186]], 16, 10), 'orange'), // lunge
    s(ellipse(102, 190, 12, 4) + ' ' + ellipse(216, 190, 11, 4), 'orange'),
    s(limb([[142, 70], [110, 78], [78, 82]], 10, 7) + ' ' + circle(74, 82, 6) + ' ' + limb([[70, 82], [54, 82]], 3.5, 2.5), 'orange'), // Shigan, finger pistol
    s(limb([[172, 70], [184, 94], [172, 108]], 10, 8), 'orange'),
    { d: ellipse(194, 54, 13, 9) + ' ' + circle(205, 40, 6.5) + ' M210 38 L219 41 L210 43 M182 54 L166 62 L184 61', c: 'white', w: 2, fill: true }, // Hattori on his shoulder
    { d: 'M203 47 L200 58 L206 58 Z', c: 'red', w: 1.5, fill: true }, // his tie
  ] },
  { name: 'Bon Clay', answers: ['bonclay', 'bonkure', 'bentham', 'mrtwo', 'mistertwo', 'mrtwobonclay'], art: [
    { d: circle(156, 100, 80), c: 'yellow', w: 1.5, fill: true }, // stage spotlight
    s(limb([[150, 120], [148, 156], [146, 184]], 22, 10) + ' ' + limb([[146, 182], [146, 195]], 7, 2), 'pink'), // en pointe
    s(limb([[156, 116], [204, 104], [252, 90]], 20, 7) + ' ' + limb([[252, 90], [268, 86]], 6, 2), 'pink'), // arabesque leg
    s(limb([[150, 120], [136, 96], [118, 76]], 30, 34), 'pink'), // big frame
    s(poly([[146, 98], [182, 108], [210, 146], [166, 130]], true), 'pink'), // coat tails
    s(limb([[114, 72], [106, 62]], 11) + ' ' + ellipse(102, 54, 11, 12), 'pink'),
    s(limb([[110, 76], [84, 54], [60, 30]], 11, 7) + ' ' + circle(57, 27, 5), 'pink'),
    s(limb([[132, 86], [168, 92], [204, 84]], 11, 7) + ' ' + circle(207, 83, 5), 'pink'),
    { d: 'M128 76 C144 62 124 46 128 34 C130 24 120 22 116 28 M142 82 C156 66 150 52 160 40 C166 32 174 32 176 38', c: 'white', w: 5 }, // swan necks on his coat
    { d: ellipse(117, 29, 7, 4.5) + ' ' + ellipse(175, 39, 7, 4.5), c: 'white', w: 2, fill: true },
    { d: 'M111 28 L101 33 L111 33 Z M181 38 L191 43 L181 43 Z', c: 'orange', w: 1.5, fill: true },
  ] },
];
