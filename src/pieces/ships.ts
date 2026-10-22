// More Straw Hats and their ships, told through their objects (no faces).
import { circle, poly, spiral, type Piece } from './draw.ts';

// Hana Hana: a forearm sprouting from (x, y) toward `deg` (0 = up), an open hand of four fingers at the end
const at = (x: number, y: number, deg: number, k: number, side = 0): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [x + Math.sin(a) * k + Math.cos(a) * side, y - Math.cos(a) * k + Math.sin(a) * side];
};
const arm = (x: number, y: number, deg: number, len: number) => poly([at(x, y, deg, 0, -6), at(x, y, deg, len, -5), at(x, y, deg, len + 8, -9), at(x, y, deg, len + 18, -8), at(x, y, deg, len + 18, 8), at(x, y, deg, len + 8, 9), at(x, y, deg, len, 5), at(x, y, deg, 0, 6)], true);
const fingers = (x: number, y: number, deg: number, len: number) => [-6, -2, 2, 6].map((s) => poly([at(x, y, deg, len + 18, s), at(x, y, deg, len + 30 - Math.abs(s), s * 1.3)])).join(' ') + ' ' + poly([at(x, y, deg, len + 8, -9), at(x, y, deg, len + 16, -16)]);
const star = (x: number, y: number, r: number) => poly(Array.from({ length: 10 }, (_, i) => at(x, y, i * 36, i % 2 ? r * 0.45 : r)), true);
const ROBIN = [-66, -33, 0, 33, 66];
// the Straw Hat jolly roger without the skull: hat over crossbones
const hat = (x: number, y: number) => `M${x - 22} ${y} A22 6 0 1 0 ${x + 22} ${y} A22 6 0 1 0 ${x - 22} ${y} Z M${x - 11} ${y - 2} C${x - 13} ${y - 26} ${x + 13} ${y - 26} ${x + 11} ${y - 2} M${x - 16} ${y + 8} L${x + 16} ${y + 22} M${x + 16} ${y + 8} L${x - 16} ${y + 22}`;

export const SHIPS: Piece[] = [
  { name: 'Robin', answers: ['robin', 'nicorobin', 'nico', 'demonchild', 'devilchild'], art: [
    { d: ROBIN.map((d) => arm(150, 150, d, 80 - Math.abs(d) * 0.4)).join(' '), c: 'violet', w: 2, fill: true },
    { d: ROBIN.map((d) => fingers(150, 150, d, 80 - Math.abs(d) * 0.4)).join(' '), c: 'violet', w: 1.5 },
    { d: 'M60 150 Q105 136 150 150 Q195 136 240 150 L240 186 Q195 172 150 186 Q105 172 60 186 Z', c: 'cyan', w: 2.5, fill: true },
    { d: 'M150 150 L150 186 M74 156 Q105 148 138 158 M74 166 Q105 158 138 168 M162 158 Q195 148 226 156 M162 168 Q195 158 226 166', c: 'cyan', w: 1 },
    { d: 'M40 70 Q48 60 54 72 Q46 78 40 70 Z M246 46 Q254 36 260 48 Q252 54 246 46 Z M250 116 Q258 106 264 118 Q256 124 250 116 Z M48 124 Q56 114 62 126 Q54 132 48 124 Z', c: 'pink', w: 1.5, fill: true },
  ] },
  { name: 'Franky', answers: ['franky', 'cutty', 'cuttyflam', 'ironmanfranky'], art: [
    { d: star(110, 52, 30) + ' ' + star(190, 52, 30), c: 'cyan', w: 2.5, fill: true },
    { d: 'M135 46 Q150 38 165 46 M84 46 L60 40 M216 46 L240 40', c: 'cyan', w: 2 },
    { d: 'M60 186 Q56 166 64 152 Q56 138 62 124 Q70 114 70 98 L84 98 Q84 114 92 124 Q98 138 90 152 Q98 166 94 186 Z', c: 'red', w: 2, fill: true },
    { d: 'M68 92 L86 92 M60 140 Q77 146 94 136', c: 'white', w: 1.5 },
    { d: 'M122 174 L122 144 C160 142 196 116 228 114 L228 186 C196 186 160 178 122 174 Z', c: 'blue', w: 3, fill: true },
    { d: 'M228 116 L270 116 Q286 116 286 130 L286 172 Q286 186 270 186 L228 186 Z', c: 'cyan', w: 2.5, fill: true },
    { d: 'M286 144 L268 144 M286 158 L268 158 M286 172 L268 172 M234 138 Q254 132 268 142', c: 'cyan', w: 1.5 },
    { d: star(186, 156, 18), c: 'yellow', w: 2, fill: true },
  ] },
  { name: 'Jinbe', answers: ['jinbe', 'jinbei', 'jimbei', 'jinbeioyabun', 'knightofthesea'], art: [
    { d: 'M72 110 Q50 120 46 148 Q46 186 82 186 Q118 186 118 148 Q114 120 92 110 Q104 96 100 78 Q96 58 82 58 Q68 58 64 78 Q60 96 72 110 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M76 58 L76 44 L88 44 L88 58', c: 'yellow', w: 2 },
    { d: 'M70 110 Q82 116 94 110 M92 112 Q112 126 106 150 M92 112 Q100 134 94 150', c: 'red', w: 2 },
    { d: 'M150 168 C150 90 230 40 272 80 C290 98 280 126 258 124 C240 122 238 100 254 98 C236 84 196 100 196 150 Z', c: 'cyan', w: 2.5, fill: true },
    { d: 'M258 124 L266 132 M266 116 L278 122 M200 120 Q210 108 222 106', c: 'white', w: 1.5 },
    { d: 'M130 180 A70 10 0 1 0 270 180 A70 10 0 1 0 130 180 Z M100 188 A100 8 0 0 0 300 188', c: 'blue', w: 1.5 },
  ] },
  { name: 'Going Merry', answers: ['goingmerry', 'merry', 'merrygo', 'goingmerrygo'], art: [
    { d: 'M40 140 L190 140 Q218 140 232 118 L236 150 Q226 176 192 180 L70 180 Q46 178 40 140 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M44 152 L234 152 M120 160 L120 170 M150 160 L150 170 M180 160 L180 170', c: 'orange', w: 1 },
    { d: 'M130 140 L130 18 M96 38 L164 38 M96 110 L164 110', c: 'orange', w: 2 },
    { d: 'M98 40 Q90 75 98 108 L162 108 Q170 75 162 40 Z', c: 'white', w: 2, fill: true },
    { d: 'M230 120 Q220 90 234 70 Q252 54 272 64 Q284 72 290 92 Q294 106 282 110 Q266 112 256 108 Q248 122 230 120 Z', c: 'white', w: 2.5, fill: true },
    { d: 'M284 96 L286 100 M268 104 Q276 106 282 104 M238 66 Q222 60 216 74 Q228 78 236 72', c: 'white', w: 1.5 },
    { d: spiral(246, 88, 2, 15), c: 'yellow', w: 2.5 },
    { d: 'M130 18 L150 22 L130 28', c: 'red', w: 2, fill: true },
    { d: hat(130, 74), c: 'yellow', w: 1.5 },
  ] },
  { name: 'Thousand Sunny', answers: ['thousandsunny', 'sunny', 'sunnygo'], art: [
    { d: 'M30 140 L180 140 Q200 150 204 130 L204 160 Q196 182 166 184 L60 184 Q36 180 30 140 Z', c: 'cyan', w: 2.5, fill: true },
    { d: 'M34 154 L204 154 M60 166 L180 166', c: 'cyan', w: 1 },
    { d: 'M90 140 L90 30 M60 50 L120 50 M60 112 L120 112', c: 'orange', w: 2 },
    { d: 'M62 52 Q56 82 62 110 L118 110 Q124 82 118 52 Z', c: 'white', w: 2, fill: true },
    { d: poly(Array.from({ length: 33 }, (_, i) => at(236, 116, i * 11.25, i % 2 ? 36 : 50)), true), c: 'orange', w: 2.5, fill: true },
    { d: circle(236, 116, 30), c: 'yellow', w: 2.5, fill: true },
    { d: 'M90 30 L112 34 L90 40', c: 'red', w: 2, fill: true },
    { d: hat(90, 80), c: 'yellow', w: 1.5 },
  ] },
];
