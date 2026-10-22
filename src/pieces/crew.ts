// The Straw Hat crew, told through their objects.
import { afro, circle, ellipse, katana, limb, poly, spiral, type Piece } from './draw.ts';

export const CREW: Piece[] = [
  { name: 'Luffy', answers: ['luffy', 'monkeydluffy', 'strawhat', 'strawhatluffy'], art: [
    { d: circle(150, 100, 74), c: 'orange', w: 1.5, fill: true }, // the sun behind him
    { d: ellipse(150, 44, 12, 14), c: 'pink', sil: true },
    { d: limb([[150, 54], [150, 66]], 11), c: 'pink', sil: true },
    { d: poly([[127, 66], [173, 66], [181, 112], [164, 124], [136, 124], [119, 112]], true), c: 'pink', sil: true }, // open vest, flaring
    { d: poly([[137, 120], [163, 120], [178, 156], [157, 161], [150, 136], [143, 161], [122, 156]], true), c: 'pink', sil: true }, // shorts
    { d: ellipse(132, 157, 11, 5) + ' ' + ellipse(168, 157, 11, 5), c: 'pink', sil: true }, // rolled cuffs
    { d: limb([[132, 160], [125, 191]], 9, 7) + ' ' + limb([[168, 160], [177, 191]], 9, 7), c: 'pink', sil: true },
    { d: ellipse(123, 193, 10, 3) + ' ' + ellipse(180, 193, 10, 3), c: 'pink', sil: true }, // sandals
    { d: limb([[171, 70], [190, 56], [178, 32]], 10, 8) + ' ' + ellipse(175, 31, 6, 5), c: 'pink', sil: true }, // hand on the hat
    { d: limb([[129, 70], [115, 96], [111, 116]], 10, 8) + ' ' + circle(110, 121, 7.5), c: 'pink', sil: true }, // fist
    { d: ellipse(150, 33, 30, 6), c: 'yellow', w: 2, fill: true }, // the straw hat, the only thing lit
    { d: 'M134 32 C133 13 167 13 166 32', c: 'yellow', w: 2, fill: true },
    { d: 'M135 28 C145 31.5 155 31.5 165 28', c: 'red', w: 3 },
    { d: 'M144 84 L156 96 M156 84 L144 96', c: 'red', w: 1 }, // the X scar
  ] },
  { name: 'Zoro', answers: ['zoro', 'roronoazoro', 'roronoa'], art: [
    ...katana(150, 192, 0, 'white'), ...katana(140, 190, -42, 'red'), ...katana(160, 190, 42, 'violet'),
    { d: circle(150, 170, 9), c: 'green', w: 2.5, fill: true },
    { d: 'M158 166 Q185 150 205 168 Q185 165 160 174 M142 166 Q118 152 98 170 Q118 165 140 174', c: 'green', w: 2, fill: true },
  ] },
  { name: 'Nami', answers: ['nami'], art: [
    { d: 'M40 185 L95 145 M101 141 L160 98 M166 94 L262 25', c: 'cyan', w: 3 },
    { d: circle(98, 143, 5) + ' ' + circle(163, 96, 5), c: 'blue', w: 2 },
    { d: 'M240 10 C230 30 270 30 262 50 M276 18 C282 34 262 44 272 60', c: 'blue', w: 1.5 },
    { d: circle(115, 140, 32) + ' ' + circle(178, 152, 30) + ' ' + circle(150, 95, 28), c: 'orange', w: 2.5, fill: true },
    { d: 'M150 67 Q165 45 185 52 Q170 70 150 67 Z M115 108 Q100 88 82 96 Q98 112 115 108 Z M178 122 Q192 102 212 110 Q196 126 178 122 Z', c: 'green', w: 2, fill: true },
    { d: 'M100 128 L104 132 M165 140 L169 144 M140 84 L144 88', c: 'yellow', w: 1.5 },
  ] },
  { name: 'Usopp', answers: ['usopp', 'sogeking', 'godusopp'], art: [
    { d: 'M150 192 L150 125 M150 125 Q108 105 102 45 M150 125 Q192 105 198 45', c: 'orange', w: 4 },
    { d: 'M144 150 L156 158 M144 162 L156 170 M144 174 L156 182', c: 'orange', w: 1 },
    { d: 'M102 47 Q150 120 198 47', c: 'pink', w: 2 },
    { d: circle(150, 84, 7), c: 'red', w: 2.5, fill: true },
    { d: circle(250, 40, 22) + ' M250 10 L250 70 M220 40 L280 40', c: 'cyan', w: 1.5 },
    { d: 'M150 76 Q200 40 228 40', c: 'cyan', w: 1 },
  ] },
  { name: 'Sanji', answers: ['sanji', 'vinsmokesanji', 'blackleg'], art: [
    { d: spiral(212, 62, 3, 34), c: 'yellow', w: 3 },
    { d: 'M62 150 L210 150 L210 166 L62 166 Z', c: 'white', w: 2, fill: true },
    { d: 'M210 150 L245 150 L245 166 L210 166 Z', c: 'orange', w: 2, fill: true },
    { d: 'M50 150 L62 150 L62 166 L50 166 Z', c: 'red', w: 3, fill: true },
    { d: 'M54 146 C36 122 76 112 58 86 C42 62 82 52 70 26', c: 'white', w: 1.5 },
    { d: 'M98 98 C98 84 116 84 116 98 C116 84 134 84 134 98 C134 112 116 120 116 128 C116 120 98 112 98 98 Z', c: 'pink', w: 2, fill: true },
  ] },
  { name: 'Chopper', answers: ['chopper', 'tonytonychopper', 'tonychopper'], art: [
    { d: 'M108 38 L192 38 L188 128 L112 128 Z', c: 'pink', w: 2.5, fill: true },
    { d: 'M70 132 Q150 158 230 132 Q150 118 70 132 Z', c: 'pink', w: 2.5, fill: true },
    { d: 'M132 60 L168 100 M168 60 L132 100', c: 'white', w: 5 },
    { d: 'M112 112 L188 112', c: 'white', w: 1.5 },
    { d: 'M112 100 Q78 90 62 50 M84 92 Q62 88 42 92 M70 72 Q52 58 54 38 M188 100 Q222 90 238 50 M216 92 Q238 88 258 92 M230 72 Q248 58 246 38', c: 'orange', w: 3 },
    { d: circle(150, 172, 9), c: 'blue', w: 2.5, fill: true },
  ] },
  { name: 'Brook', answers: ['brook', 'soulking', 'humminbrook'], art: [
    { d: afro(130, 100, 58, 11), c: 'violet', w: 2.5, fill: true },
    { d: 'M98 52 L162 52 M108 52 L112 8 L148 8 L152 52 M110 40 L150 40', c: 'cyan', w: 2.5 },
    { d: 'M200 190 C185 175 205 160 195 148 C185 135 210 120 228 132 C246 120 262 140 250 152 C242 162 258 176 244 190 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M222 130 L240 62 M214 66 L266 76', c: 'orange', w: 2 },
    { d: 'M170 186 L290 112', c: 'white', w: 1.5 },
    { d: 'M262 30 L262 6 L286 2 L286 26 ' + circle(256, 30, 6) + ' ' + circle(280, 26, 6), c: 'pink', w: 2 },
  ] },
  { name: 'Ace', answers: ['ace', 'portgasdace', 'portgas', 'firefist'], art: [
    { d: 'M100 84 Q100 36 150 42 Q200 36 200 84', c: 'orange', w: 2.5, fill: true },
    { d: 'M48 92 Q150 128 252 92 Q236 80 200 84 L100 84 Q64 80 48 92 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M101 78 Q150 90 199 78', c: 'red', w: 3 },
    { d: circle(84, 84, 10) + ' M78 86 Q84 92 90 86', c: 'cyan', w: 2 },
    { d: circle(216, 84, 10) + ' M210 90 Q216 84 222 90', c: 'cyan', w: 2 },
    { d: 'M80 196 C66 166 102 150 92 118 C120 142 116 166 128 176 C132 150 148 138 150 104 C166 136 166 158 172 172 C180 152 198 146 204 120 C218 154 222 176 212 196 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M112 196 C106 178 124 170 122 154 C136 168 136 182 144 188 C150 172 160 166 162 148 C172 168 174 182 180 196 Z', c: 'yellow', w: 2, fill: true },
  ] },
];
