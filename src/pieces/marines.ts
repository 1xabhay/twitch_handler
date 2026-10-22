// Marines, told through their objects (no faces).
import { circle, n, poly, type Piece } from './draw.ts';

// a clenched fist seen from the front, top-left knuckle at (x, y): outline, finger lines, thumb across
const fist = (x: number, y: number) => {
  const p = (dx: number, dy: number) => `${n(x + dx)} ${n(y + dy)}`;
  return {
    body: `M${p(0, 16)} Q${p(0, 0)} ${p(13, 0)} Q${p(26, 0)} ${p(26, 12)} Q${p(26, -2)} ${p(39, -2)} Q${p(52, -2)} ${p(52, 10)} Q${p(52, -2)} ${p(65, -2)} Q${p(78, -2)} ${p(78, 12)} Q${p(78, 0)} ${p(91, 0)} Q${p(104, 0)} ${p(104, 16)} L${p(106, 72)} Q${p(104, 112)} ${p(74, 114)} L${p(26, 114)} Q${p(-2, 110)} ${p(0, 72)} Z`,
    lines: `M${p(26, 12)} L${p(26, 50)} M${p(52, 10)} L${p(52, 50)} M${p(78, 12)} L${p(78, 50)} M${p(4, 70)} Q${p(4, 52)} ${p(24, 52)} L${p(80, 56)} Q${p(92, 58)} ${p(90, 70)} Q${p(88, 80)} ${p(76, 80)} L${p(22, 80)} Q${p(4, 80)} ${p(4, 70)} Z`,
  };
};
const garp = fist(66, 46), sakazuki = fist(170, 40);

export const MARINES: Piece[] = [
  { name: 'Smoker', answers: ['smoker', 'whitehunter', 'smokerthewhitehunter'], art: [
    { d: poly([[40, 190], [56, 165]]), c: 'white', w: 7 },
    { d: 'M42 178 L54 184 M46 172 L58 178 M50 166 L62 172', c: 'blue', w: 1.5 },
    { d: poly([[58, 162], [138, 38]]), c: 'white', w: 3 },
    { d: poly([[62, 156], [72, 162], [94, 129]]), c: 'white', w: 3 },
    { d: poly([[136, 41], [152, 16]]), c: 'cyan', w: 7 },
    { d: 'M172 128 L246 120 L248 134 L174 142 Z M176 152 L250 144 L252 158 L178 166 Z', c: 'orange', w: 2, fill: true },
    { d: 'M190 126 L192 140 M194 150 L196 164', c: 'yellow', w: 3 },
    { d: 'M246 120 L256 119 L258 133 L248 134 Z M250 144 L260 143 L262 157 L252 158 Z', c: 'red', w: 2, fill: true },
    { d: 'M258 116 C244 96 276 84 258 64 C242 46 270 34 256 18 M262 140 C284 120 262 106 280 88 C294 72 274 60 284 44', c: 'white', w: 1.5 },
  ] },
  { name: 'Garp', answers: ['garp', 'monkeydgarp', 'garpthefist', 'garpthehero', 'herogarp'], art: [
    { d: garp.body, c: 'white', w: 3, fill: true },
    { d: garp.lines, c: 'white', w: 1.5 },
    { d: 'M86 160 L86 190 L160 190 L160 160', c: 'blue', w: 2.5 },
    { d: 'M52 40 L40 28 M118 30 L118 14 M184 40 L196 28 M44 100 L26 100 M188 100 L206 100', c: 'yellow', w: 2 },
    { d: circle(244, 70, 30) + ' ' + circle(244, 70, 10), c: 'pink', w: 2.5, fill: true },
    { d: 'M228 56 L232 60 M252 50 L256 52 M262 70 L264 76 M232 84 L236 86 M250 88 L254 86 M224 72 L226 76', c: 'yellow', w: 1.5 },
    { d: circle(244, 146, 30) + ' ' + circle(244, 146, 10), c: 'orange', w: 2.5, fill: true },
  ] },
  { name: 'Aokiji', answers: ['aokiji', 'kuzan'], art: [
    { d: circle(95, 128, 36) + ' ' + circle(215, 128, 36), c: 'white', w: 2.5 },
    { d: poly([[95, 128], [150, 128], [138, 80], [95, 128]]) + ' ' + poly([[138, 80], [198, 82], [150, 128]]) + ' ' + poly([[198, 82], [215, 128]]), c: 'blue', w: 3 },
    { d: 'M126 76 L150 76 M192 72 L198 82 L212 76', c: 'blue', w: 2.5 },
    { d: 'M20 168 L280 168 L268 178 L258 194 L246 178 L222 186 L206 176 L178 196 L166 178 L136 188 L118 176 L96 194 L84 178 L56 186 L42 176 Z', c: 'cyan', w: 2, fill: true },
    { d: 'M50 22 L50 62 M33 32 L67 52 M33 52 L67 32 M44 24 L50 30 L56 24 M44 60 L50 54 L56 60', c: 'cyan', w: 1.5 },
    { d: 'M214 30 Q232 20 250 30 Q268 20 286 30 Q286 50 268 48 Q250 44 232 48 Q214 50 214 30 Z', c: 'violet', w: 2.5, fill: true },
    { d: 'M214 34 Q200 36 196 44 M286 34 Q294 38 294 46', c: 'violet', w: 1.5 },
    { d: 'M224 36 Q232 30 240 36 M260 36 Q268 30 276 36', c: 'white', w: 1 },
  ] },
  { name: 'Kizaru', answers: ['kizaru', 'borsalino'], art: [
    { d: 'M98 52 L144 52 Q146 92 120 92 Q96 92 98 52 Z M156 52 L202 52 Q204 92 180 92 Q154 92 156 52 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M144 56 Q150 50 156 56 M98 54 L84 50 M202 54 L216 50', c: 'yellow', w: 2 },
    { d: 'M40 196 Q48 142 112 126 L150 172 L188 126 Q252 142 260 196 Z', c: 'yellow', w: 2.5, fill: true },
    { d: 'M70 190 L76 146 M94 192 L96 136 M118 194 L118 134 M182 194 L182 134 M206 192 L204 136 M230 190 L224 146', c: 'white', w: 1 },
    { d: 'M112 126 L130 180 L150 172 L170 180 L188 126', c: 'yellow', w: 1.5 },
    { d: 'M20 40 L76 66 M14 72 L70 84 M224 66 L280 40 M230 84 L286 72', c: 'yellow', w: 1.5 },
    { d: circle(150, 20, 4) + ' ' + circle(40, 120, 3) + ' ' + circle(262, 118, 3) + ' ' + circle(20, 20, 2) + ' ' + circle(280, 20, 2), c: 'white', w: 2, fill: true },
  ] },
  { name: 'Akainu', answers: ['akainu', 'sakazuki', 'fleetadmiralakainu'], art: [
    { d: sakazuki.body, c: 'red', w: 3, fill: true },
    { d: sakazuki.lines, c: 'orange', w: 1.5 },
    { d: 'M190 152 Q188 168 192 176 Q196 168 194 152 M222 154 Q220 178 226 188 Q232 178 228 154 M254 150 Q252 164 256 170 Q260 164 258 150', c: 'orange', w: 2, fill: true },
    { d: 'M14 196 Q20 136 74 120 L96 168 L108 196 L120 168 L142 120 Q150 124 156 132 M74 120 L88 150 M142 120 L128 150', c: 'white', w: 2 },
    { d: circle(50, 150, 16), c: 'red', w: 2.5, fill: true },
    { d: 'M44 146 Q50 136 58 146 Q56 158 46 156 Q38 150 44 146 M50 138 Q64 140 64 154', c: 'pink', w: 1.5 },
    { d: 'M48 166 Q44 180 50 192 M50 178 Q62 172 66 182 Q56 186 50 178 Z', c: 'green', w: 1.5 },
    { d: 'M34 66 Q22 18 80 14 Q138 18 126 66 Z M34 66 L126 66 L126 78 L34 78 Z M40 78 Q80 102 120 78', c: 'white', w: 2.5, fill: true },
    { d: 'M66 48 Q73 40 80 48 Q87 40 94 48', c: 'blue', w: 2 },
  ] },
];
