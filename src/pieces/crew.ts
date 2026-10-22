// The Straw Hat crew: each one a dark silhouette in their signature pose, rim-lit, with one glowing clue.
import { afro, circle, ellipse, limb, n, poly, type Piece } from './draw.ts';

// Luffy's rubber arm: a wavy line from the shoulder out to x = 30
const rubber = Array.from({ length: 9 }, (_, i) => [156 - i * 15.5, 80 + Math.sin(i * 1.3) * 9 + i] as [number, number]);

// a flame tongue rising from (x, y), `len` long toward `deg` (0 = up), `w` wide at the base, flickering at the tip
const flame = (x: number, y: number, len: number, deg: number, w: number) => {
  const a = (deg * Math.PI) / 180, at = (u: number, v: number) => `${n(x + Math.sin(a) * u + Math.cos(a) * v)} ${n(y - Math.cos(a) * u + Math.sin(a) * v)}`;
  return `M${at(0, -w)} C${at(len * 0.5, -w * 1.1)} ${at(len * 0.7, w * 0.2)} ${at(len, -w * 0.6)} C${at(len * 0.6, w * 1.2)} ${at(len * 0.3, w * 1.1)} ${at(0, w)} Z`;
};

export const CREW: Piece[] = [
  { name: 'Luffy', answers: ['luffy', 'monkeydluffy', 'strawhat', 'strawhatluffy'], art: [
    { d: circle(172, 100, 72), c: 'orange', w: 1.5, fill: true }, // the sun behind him
    { d: 'M58 70 L104 74 M44 106 L96 98 M66 88 L102 88', c: 'white', w: 1 }, // the stretch whips through the air
    { d: ellipse(176, 48, 12, 14), c: 'pink', sil: true },
    { d: limb([[175, 58], [172, 70]], 11), c: 'pink', sil: true },
    { d: 'M152 68 L192 66 C198 84 200 100 202 112 L184 124 L154 124 C150 116 144 112 140 108 C146 94 148 80 152 68 Z', c: 'pink', sil: true }, // open vest, flaring
    { d: poly([[152, 118], [186, 118], [208, 150], [188, 160], [172, 136], [160, 162], [136, 152]], true), c: 'pink', sil: true }, // shorts
    { d: limb([[146, 156], [128, 172], [118, 190]], 11, 7) + ' ' + limb([[198, 154], [214, 172], [222, 190]], 11, 7), c: 'pink', sil: true },
    { d: ellipse(115, 193, 10, 3) + ' ' + ellipse(226, 193, 10, 3), c: 'pink', sil: true }, // sandals
    { d: limb([[190, 72], [212, 56], [200, 34]], 10, 8) + ' ' + ellipse(196, 33, 6, 5), c: 'pink', sil: true }, // hand on the hat
    { d: limb(rubber, 10, 6) + ' ' + circle(24, 89, 10), c: 'pink', sil: true }, // the rubber arm, stretching
    { d: ellipse(176, 37, 30, 6), c: 'yellow', w: 2, fill: true }, // the straw hat, the only thing lit
    { d: 'M160 36 C159 17 193 17 192 36', c: 'yellow', w: 2, fill: true },
    { d: 'M161 32 C171 35.5 181 35.5 191 32', c: 'red', w: 3 },
  ] },
  { name: 'Zoro', answers: ['zoro', 'roronoazoro', 'roronoa'], art: [
    { d: circle(150, 96, 74), c: 'red', w: 1.5, fill: true }, // a blood moon
    { d: 'M138 50 C136 38 144 34 150 36 C156 34 164 38 162 50 Z ' + ellipse(150, 52, 11, 13), c: 'green', sil: true }, // short cropped hair
    { d: limb([[150, 62], [150, 72]], 12), c: 'green', sil: true },
    { d: 'M118 70 C136 64 164 64 182 70 C178 84 174 100 168 116 L132 116 C126 100 122 84 118 70 Z', c: 'green', sil: true }, // broad shoulders
    { d: limb([[136, 112], [112, 142], [102, 186]], 22, 12) + ' ' + limb([[164, 112], [190, 142], [200, 186]], 22, 12), c: 'green', sil: true }, // deep stance
    { d: ellipse(98, 190, 13, 5) + ' ' + ellipse(206, 190, 13, 5), c: 'green', sil: true },
    { d: limb([[124, 74], [100, 94], [80, 104]], 14, 10) + ' ' + circle(76, 106, 8), c: 'green', sil: true },
    { d: limb([[176, 74], [202, 90], [222, 80]], 14, 10) + ' ' + circle(226, 78, 8), c: 'green', sil: true },
    { d: limb([[128, 58], [146, 58]], 4) + ' ' + limb([[64, 114], [84, 98]], 4) + ' ' + limb([[218, 86], [236, 70]], 4), c: 'green', sil: true }, // the hilts
    { d: 'M150 58 L238 50 L150 62 Z M74 108 L14 166 L78 110 Z M228 76 L290 14 L232 80 Z', c: 'white', w: 1.5, fill: true }, // three blades
    { d: 'M149 51 L151 67 M68 101 L80 113 M222 72 L234 82', c: 'yellow', w: 3 },
  ] },
  { name: 'Nami', answers: ['nami'], art: [
    { d: 'M200 64 C182 64 182 42 200 42 C200 22 226 16 236 30 C246 12 280 16 280 36 C298 36 298 64 280 64 Z', c: 'violet', w: 2, fill: true }, // her thundercloud
    { d: 'M150 28 C130 30 124 52 116 76 C108 98 96 116 80 128 C100 126 108 118 114 112 C112 124 108 134 100 146 C120 136 130 118 136 100 C140 84 146 66 160 44 Z', c: 'orange', sil: true }, // long hair in the wind
    { d: ellipse(152, 42, 11, 13), c: 'orange', sil: true },
    { d: limb([[153, 52], [154, 62]], 8), c: 'pink', sil: true },
    { d: 'M140 62 L168 62 C172 72 168 84 160 96 C162 102 166 106 166 112 L140 112 C140 104 144 98 144 94 C138 84 136 72 140 62 Z', c: 'pink', sil: true }, // hourglass
    { d: limb([[146, 110], [140, 150], [136, 188]], 18, 6) + ' ' + limb([[160, 110], [182, 146], [166, 188]], 17, 6), c: 'pink', sil: true }, // hip out, one knee bent
    { d: limb([[136, 191], [128, 193]], 5) + ' ' + limb([[168, 191], [176, 193]], 5), c: 'pink', sil: true },
    { d: limb([[164, 66], [182, 52], [190, 32]], 8, 6), c: 'pink', sil: true }, // arm up, staff in hand
    { d: limb([[142, 66], [124, 82], [140, 100]], 8, 6), c: 'pink', sil: true }, // hand on hip
    { d: 'M170 56 L214 6', c: 'cyan', w: 3 }, // the Clima-Tact
    { d: 'M258 66 L246 96 L258 96 L240 136 L252 136 L228 186', c: 'yellow', w: 2.5 }, // Thunderbolt Tempo
  ] },
  { name: 'Usopp', answers: ['usopp', 'sogeking', 'godusopp'], art: [
    { d: circle(170, 100, 76) + ' ' + circle(170, 100, 50) + ' ' + circle(170, 100, 24), c: 'red', w: 1.5, fill: true }, // the bullseye
    { d: afro(116, 48, 16, 7) + ' ' + ellipse(130, 54, 13, 14), c: 'cyan', sil: true }, // curly hair
    { d: limb([[138, 56], [176, 53]], 7, 2), c: 'cyan', sil: true }, // THE nose
    { d: limb([[128, 66], [132, 112]], 28, 24), c: 'cyan', sil: true }, // overalls
    { d: limb([[138, 106], [166, 142], [168, 186]], 18, 11) + ' ' + limb([[124, 106], [104, 148], [84, 186]], 18, 11), c: 'cyan', sil: true },
    { d: ellipse(174, 190, 14, 5) + ' ' + ellipse(80, 190, 14, 5), c: 'cyan', sil: true },
    { d: limb([[136, 76], [176, 88], [210, 92]], 12, 8) + ' ' + circle(214, 92, 7), c: 'cyan', sil: true }, // arm out, aiming
    { d: limb([[124, 76], [100, 92], [128, 80]], 12, 8) + ' ' + circle(131, 79, 6), c: 'cyan', sil: true }, // drawing back to the cheek
    { d: 'M214 122 L214 92 M214 92 L200 58 M214 92 L236 60', c: 'yellow', w: 3 }, // Kabuto
    { d: 'M200 58 L134 80 L236 60', c: 'pink', w: 1.5 },
  ] },
  { name: 'Sanji', answers: ['sanji', 'vinsmokesanji', 'blackleg'], art: [
    { d: 'M276 187 A150 150 0 0 0 270 28 L246 46 A140 140 0 0 1 276 187 Z', c: 'orange', w: 2, fill: true }, // Diable Jambe: the kick's burning arc
    { d: 'M262 160 A136 136 0 0 0 258 44 L246 54 A140 140 0 0 1 262 160 Z', c: 'red', w: 1.5, fill: true },
    { d: 'M95 46 C94 32 110 26 120 34 C124 44 122 56 114 64 C114 56 112 48 106 42 C102 42 98 44 95 46 Z', c: 'yellow', sil: true }, // the fringe over one eye
    { d: ellipse(107, 46, 12, 13) + ' ' + limb([[108, 56], [114, 66]], 9), c: 'cyan', sil: true },
    { d: limb([[144, 114], [128, 84], [114, 64]], 24, 28), c: 'cyan', sil: true }, // leaning back
    { d: 'M132 104 L156 106 C154 118 152 130 150 140 C146 134 142 130 138 128 C134 136 128 142 120 148 C126 132 130 118 132 104 Z', c: 'cyan', sil: true }, // jacket tails
    { d: limb([[118, 70], [108, 92], [134, 110]], 10, 8), c: 'cyan', sil: true }, // hands in pockets
    { d: limb([[140, 120], [134, 156], [126, 188]], 14, 9) + ' ' + ellipse(133, 191, 13, 4), c: 'cyan', sil: true },
    { d: limb([[146, 112], [200, 74], [264, 32]], 16, 9) + ' ' + limb([[260, 34], [282, 20]], 9, 7), c: 'orange', sil: true }, // the kick, a burning leg
    { d: 'M117 52 L129 49', c: 'orange', w: 2.5 }, // cigarette
    { d: 'M131 46 C139 36 127 28 135 18 C141 10 133 6 139 2', c: 'white', w: 1.2 },
  ] },
  { name: 'Chopper', answers: ['chopper', 'tonytonychopper', 'tonychopper'], art: [
    { d: circle(150, 96, 80), c: 'cyan', w: 1.5, fill: true }, // the Drum Island moon
    { d: limb([[122, 76], [98, 64], [82, 40]], 8, 5) + ' ' + limb([[98, 64], [74, 68]], 6, 4) + ' ' + limb([[90, 52], [70, 44]], 6, 4), c: 'orange', sil: true }, // antlers
    { d: limb([[178, 76], [202, 64], [218, 40]], 8, 5) + ' ' + limb([[202, 64], [226, 68]], 6, 4) + ' ' + limb([[210, 52], [230, 44]], 6, 4), c: 'orange', sil: true },
    { d: ellipse(150, 92, 34, 30), c: 'orange', sil: true },
    { d: ellipse(150, 140, 26, 24), c: 'orange', sil: true },
    { d: limb([[128, 130], [110, 116], [104, 100]], 12, 9) + ' ' + circle(104, 97, 6) + ' ' + limb([[172, 130], [190, 116], [196, 100]], 12, 9) + ' ' + circle(196, 97, 6), c: 'orange', sil: true }, // the happy dance
    { d: limb([[138, 156], [130, 184]], 15, 12) + ' ' + limb([[162, 154], [182, 168], [194, 160]], 15, 11), c: 'orange', sil: true }, // one hoof kicked up
    { d: ellipse(128, 188, 11, 5) + ' ' + ellipse(198, 158, 6, 9), c: 'orange', sil: true },
    { d: ellipse(150, 66, 42, 8), c: 'pink', w: 2, fill: true }, // the pink top hat
    { d: 'M122 64 C118 40 120 26 126 22 Q150 14 174 22 C180 26 182 40 178 64', c: 'pink', w: 2, fill: true },
    { d: 'M142 32 L158 48 M158 32 L142 48', c: 'white', w: 3 },
  ] },
  { name: 'Brook', answers: ['brook', 'soulking', 'humminbrook'], art: [
    { d: circle(186, 80, 66), c: 'white', w: 1.5, fill: true }, // Thriller Bark moon
    { d: afro(140, 50, 20, 8), c: 'violet', sil: true },
    { d: poly([[128, 8], [150, 6], [152, 32], [126, 34]], true) + ' ' + limb([[112, 34], [166, 31]], 4), c: 'violet', sil: true }, // top hat
    { d: ellipse(142, 64, 10, 12) + ' ' + limb([[143, 74], [146, 84]], 5), c: 'violet', sil: true },
    { d: limb([[146, 82], [150, 130]], 24, 16), c: 'violet', sil: true },
    { d: 'M138 108 L162 108 C166 128 172 144 182 162 C168 154 160 150 154 146 C146 152 136 156 124 162 C132 144 136 126 138 108 Z', c: 'violet', sil: true }, // coat tails flaring
    { d: limb([[146, 130], [138, 160], [130, 188]], 7, 5) + ' ' + limb([[154, 130], [150, 160], [164, 188]], 7, 5), c: 'violet', sil: true }, // thin, so thin
    { d: ellipse(126, 191, 9, 3) + ' ' + ellipse(168, 191, 9, 3), c: 'violet', sil: true },
    { d: limb([[138, 88], [112, 98], [90, 86]], 6, 5), c: 'violet', sil: true }, // violin hand
    { d: limb([[156, 88], [180, 104], [156, 104]], 6, 5), c: 'violet', sil: true }, // bow hand
    { d: ellipse(126, 90, 12, 9) + ' ' + ellipse(109, 89, 9, 7) + ' M100 88 L80 84 ' + circle(77, 83, 3.5), c: 'orange', w: 2, fill: true }, // the violin
    { d: 'M192 122 L90 70', c: 'white', w: 1.5 },
  ] },
  { name: 'Ace', answers: ['ace', 'portgasdace', 'portgas', 'firefist'], art: [
    { d: [[40, 54], [65, 62], [90, 64], [115, 60], [140, 50]].map(([deg, l]) => flame(228, 70, l!, deg!, 16)).join(' '), c: 'orange', w: 1.5, fill: true }, // Fire Fist
    { d: [[70, 44], [90, 52], [110, 42]].map(([deg, l]) => flame(234, 70, l!, deg!, 9)).join(' '), c: 'yellow', w: 1.5, fill: true },
    { d: 'M98 46 C94 38 96 32 102 30 C104 24 116 22 120 30 C126 32 126 40 122 46 Z ' + ellipse(110, 50, 12, 13), c: 'cyan', sil: true }, // wild hair
    { d: limb([[112, 60], [118, 70]], 11), c: 'cyan', sil: true },
    { d: 'M100 72 C116 66 130 66 140 72 C132 88 122 104 118 116 L96 116 C96 100 98 86 100 72 Z', c: 'cyan', sil: true }, // bare torso, V-shaped, leaning in
    { d: poly([[94, 110], [124, 110], [132, 136], [96, 140]], true), c: 'cyan', sil: true },
    { d: limb([[124, 130], [156, 150], [166, 186]], 18, 11) + ' ' + limb([[100, 132], [72, 160], [40, 186]], 17, 10), c: 'cyan', sil: true }, // lunge
    { d: ellipse(170, 190, 13, 5) + ' ' + ellipse(36, 190, 12, 5), c: 'cyan', sil: true },
    { d: limb([[130, 76], [180, 72], [218, 70]], 15, 11) + ' ' + circle(226, 70, 10), c: 'cyan', sil: true }, // the punch
    { d: limb([[104, 78], [86, 96], [100, 106]], 12, 10) + ' ' + circle(102, 106, 8), c: 'cyan', sil: true },
    { d: ellipse(110, 40, 24, 5) + ' M98 39 Q98 20 110 22 Q122 20 122 39', c: 'orange', w: 2, fill: true }, // the cowboy hat
    { d: [[104, 70], [109, 75], [115, 78], [121, 77], [126, 73]].map(([x, y]) => circle(x!, y!, 2.2)).join(' '), c: 'red', w: 1.5, fill: true }, // red bead necklace
  ] },
];
