// Famous rivals, told through their objects (no faces).
import { circle, katana, n, poly, spiral, type Piece } from './draw.ts';

// a fuzzy edge: points around an ellipse arc from angle a0 to a1 with a soft bump every step
const fuzz = (x: number, y: number, rx: number, ry: number, a0: number, a1: number, bumps: number) =>
  Array.from({ length: bumps * 4 + 1 }, (_, i): [number, number] => {
    const t = a0 + ((a1 - a0) * i) / (bumps * 4), k = 1 + 0.06 * Math.abs(Math.sin(i * Math.PI / 4));
    return [x + Math.cos(t) * rx * k, y + Math.sin(t) * ry * k];
  });
// a ring of `count` points (a drum ring, a cross of feathers)
const around = (x: number, y: number, r: number, deg: number): [number, number] => [n(x + Math.cos((deg * Math.PI) / 180) * r), n(y + Math.sin((deg * Math.PI) / 180) * r)];
const drum = (x: number, y: number) => `${circle(x, y, 17)} ${circle(x, y, 11)}`;
const tomoe = (x: number, y: number) => [0, 120, 240].map((d) => { const [ax, ay] = around(x, y, 6, d), [bx, by] = around(x, y, 9, d + 70); return `M${x} ${y} Q${ax} ${ay} ${bx} ${by}`; }).join(' ');
// a feathered edge: an upper half-ellipse of bulging scallops, left to right
const scallop = (x: number, y: number, rx: number, ry: number, k: number) => {
  const at = (t: number, f = 1) => `${n(x - Math.cos(t) * rx * f)} ${n(y - Math.sin(t) * ry * f)}`;
  return `M${at(0)}` + Array.from({ length: k }, (_, i) => ` Q${at(((i + 0.5) / k) * Math.PI, 1.18)} ${at(((i + 1) / k) * Math.PI)}`).join('');
};
// a sand twister: open front arcs narrowing to the ground, leaning with the wind
const twister = (x: number, y: number) => [0, 1, 2, 3, 4, 5].map((i) => { const cx = x + Math.sin(i * 0.9) * 8, rx = 46 - i * 7, yy = y + i * 24; return `M${n(cx - rx)} ${yy} A${rx} ${n(rx / 4)} 0 0 0 ${n(cx + rx)} ${yy}`; }).join(' ');
const glove = (x: number, y: number) => `M${x - 12} ${y + 14} L${x - 13} ${y - 2} Q${x - 13} ${y - 14} ${x - 6} ${y - 14} Q${x - 4} ${y - 20} ${x + 2} ${y - 16} Q${x + 8} ${y - 18} ${x + 10} ${y - 10} Q${x + 18} ${y - 10} ${x + 14} ${y + 2} L${x + 12} ${y + 14} Z`;

export const RIVALS: Piece[] = [
  { name: 'Mihawk', answers: ['mihawk', 'draculemihawk', 'dracule', 'hawkeyes', 'hawkeye'], art: [
    { d: 'M104 140 L101 30 Q110 2 119 30 L116 140 Z', c: 'violet', w: 2.5, fill: true },
    { d: 'M110 20 L110 132', c: 'white', w: 1 },
    { d: 'M110 140 L76 140 Q66 132 64 144 Q66 156 76 148 L110 148 L144 148 Q154 156 156 144 Q154 132 144 140 Z M104 140 L104 112 Q96 104 110 98 Q124 104 116 112 L116 140', c: 'yellow', w: 2.5 },
    { d: 'M105 148 L115 148 L114 182 L106 182 Z M106 156 L114 164 M106 166 L114 174', c: 'yellow', w: 1.5 },
    { d: `${circle(110, 188, 6)} ${circle(110, 144, 4)}`, c: 'green', w: 2, fill: true },
    { d: 'M164 140 Q220 160 276 140 Q220 120 164 140 Z', c: 'violet', w: 2.5, fill: true },
    { d: 'M190 134 C182 76 258 76 250 134', c: 'violet', w: 2.5, fill: true },
    { d: 'M236 92 C238 46 278 26 294 52 C276 44 256 56 248 100 Z', c: 'white', w: 1.5, fill: true },
    { d: 'M190 124 Q220 134 250 124', c: 'red', w: 2.5 },
  ] },
  { name: 'Law', answers: ['law', 'trafalgarlaw', 'trafalgardwaterlaw', 'trafalgar', 'surgeonofdeath'], art: [
    { d: circle(150, 100, 92), c: 'cyan', w: 1.5, fill: true },
    ...katana(196, 186, 18, 'white'),
    { d: poly([...fuzz(124, 108, 48, 54, Math.PI, 2 * Math.PI, 12), [172, 108]], true), c: 'white', w: 2.5, fill: true },
    { d: poly([...fuzz(124, 108, 56, 8, Math.PI, 2 * Math.PI, 8), ...fuzz(124, 116, 56, 10, 0, Math.PI, 8)], true), c: 'white', w: 2.5, fill: true },
    { d: 'M98 78 Q106 70 114 78 Q108 86 98 78 Z M132 62 Q142 56 148 66 Q140 72 132 62 Z M150 88 Q160 82 164 92 Q154 96 150 88 Z M112 96 Q120 92 124 100 Q116 104 112 96 Z M80 112 Q86 108 92 113 Q86 118 80 112 Z M118 112 Q126 108 132 113 Q124 118 118 112 Z M156 112 Q162 108 168 113 Q162 118 156 112 Z', c: 'violet', w: 2, fill: true },
  ] },
  { name: 'Doflamingo', answers: ['doflamingo', 'donquixotedoflamingo', 'doffy', 'joker', 'heavenlyyaksha'], art: [
    { d: 'M30 4 L30 118 M76 4 L80 92 M150 4 L150 52 M224 4 L220 92 M270 4 L270 118', c: 'white', w: 1 },
    { d: scallop(150, 196, 118, 92, 13) + ' L186 196 L162 150 L138 150 L114 196 Z', c: 'pink', w: 2.5, fill: true },
    { d: 'M60 160 Q74 146 70 130 M92 138 Q108 128 104 112 M126 122 Q138 112 136 104 M174 122 Q162 112 164 104 M208 138 Q192 128 196 112 M240 160 Q226 146 230 130 M50 186 Q60 176 58 164 M250 186 Q240 176 242 164', c: 'pink', w: 1.5 },
    { d: 'M100 64 L148 62 L142 84 L108 82 Z M152 62 L200 64 L192 82 L158 84 Z', c: 'red', w: 2.5, fill: true },
    { d: 'M100 64 L86 60 M200 64 L214 60 M148 62 Q150 60 152 62', c: 'white', w: 2 },
    { d: 'M110 68 L120 70 M162 68 L172 70', c: 'white', w: 1 },
  ] },
  { name: 'Crocodile', answers: ['crocodile', 'sircrocodile', 'mrzero', 'misterzero'], art: [
    { d: twister(86, 50), c: 'orange', w: 2 },
    { d: 'M30 190 Q90 176 150 190 M44 40 L48 38 M130 30 L134 32 M30 84 L34 86 M140 90 L144 88', c: 'yellow', w: 1.5 },
    { d: 'M184 190 L184 154 L236 154 L236 190 Z', c: 'violet', w: 2.5, fill: true },
    { d: 'M178 154 L242 154 L236 140 L184 140 Z', c: 'yellow', w: 2.5, fill: true },
    { d: 'M204 140 L204 92 C204 38 274 34 272 86 C271 102 264 114 250 120 L256 102 C262 90 258 58 236 58 C222 58 218 72 218 92 L218 140 Z', c: 'yellow', w: 2.5, fill: true },
    { d: 'M150 40 L190 52 L187 61 L147 49 Z', c: 'orange', w: 2, fill: true },
    { d: circle(147, 44, 5), c: 'red', w: 2, fill: true },
    { d: 'M144 36 C132 24 152 18 140 6 M154 34 C148 24 162 18 156 8', c: 'white', w: 1 },
  ] },
  { name: 'Buggy', answers: ['buggy', 'buggytheclown', 'captainbuggy', 'redbuggy', 'buggythestar'], art: [
    { d: circle(150, 116, 24), c: 'red', w: 3, fill: true },
    { d: 'M140 106 Q145 100 152 102', c: 'white', w: 1.5 },
    { d: 'M72 74 Q104 68 120 36 Q150 6 180 36 Q196 68 228 74 Q150 88 72 74 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M140 44 L160 62 M160 44 L140 62 ' + circle(138, 42, 3) + ' ' + circle(162, 42, 3) + ' ' + circle(138, 64, 3) + ' ' + circle(162, 64, 3), c: 'white', w: 1.5 },
    { d: `${glove(56, 110)} ${glove(244, 110)}`, c: 'white', w: 2, fill: true },
    { d: 'M52 94 L46 70 L50 68 L58 92 M248 94 L254 70 L250 68 L242 92', c: 'cyan', w: 1.5 },
    { d: 'M100 188 L100 160 L118 160 L118 176 L134 178 L134 188 Z M166 188 L166 178 L182 176 L182 160 L200 160 L200 188 Z', c: 'blue', w: 2, fill: true },
    { d: 'M78 102 L90 102 M78 118 L90 118 M222 102 L210 102 M222 118 L210 118 M100 152 L118 152 M182 152 L200 152', c: 'yellow', w: 1 },
  ] },
  { name: 'Kid', answers: ['kid', 'eustasskid', 'eustass', 'captainkid'], art: [
    { d: 'M40 192 L70 150 L104 140 L132 112 L168 108 L210 116 L206 146 L172 150 L146 170 L110 180 L92 196 Z', c: 'white', w: 2.5, fill: true },
    { d: 'M162 112 L160 56 L240 52 L246 112 Z', c: 'cyan', w: 2.5, fill: true },
    { d: 'M160 56 L162 30 L180 28 L182 54 M182 54 L184 24 L202 24 L202 52 M202 52 L204 26 L222 28 L222 52 M222 52 L226 34 L242 36 L240 54 M162 84 L210 78 Q220 84 212 94 L164 98', c: 'cyan', w: 2 },
    { d: `${circle(98, 164, 4)} ${circle(140, 142, 4)} ${circle(188, 130, 4)}`, c: 'yellow', w: 1.5 },
    { d: 'M70 150 L92 196 M132 112 L146 170 M168 108 L172 150', c: 'white', w: 1 },
    { d: 'M262 30 Q284 80 262 130 M276 18 Q298 80 274 142 M264 166 L282 172 L278 186 L262 180 Z M272 6 L288 10', c: 'red', w: 1.5 },
    { d: `${circle(54, 50, 18)} ${circle(100, 50, 18)}`, c: 'yellow', w: 2.5, fill: true },
    { d: 'M72 50 L82 50 M36 50 L18 56 M118 50 L136 56', c: 'red', w: 2.5 },
  ] },
  { name: 'Enel', answers: ['enel', 'eneru', 'godenel', 'kamienel'], art: [
    { d: `${circle(150, 100, 72)} ${circle(150, 100, 64)}`, c: 'orange', w: 2 },
    { d: [-140, -40, 40, 140].map((d) => drum(...around(150, 100, 68, d))).join(' '), c: 'orange', w: 2.5, fill: true },
    { d: [-140, -40, 40, 140].map((d) => tomoe(...around(150, 100, 68, d))).join(' '), c: 'red', w: 1.5 },
    { d: 'M162 30 L122 106 L148 106 L130 172 L184 86 L156 86 L176 30 Z', c: 'yellow', w: 2.5, fill: true },
    { d: 'M64 30 L50 52 L60 54 L46 78 M244 120 L258 140 L248 142 L262 166', c: 'cyan', w: 1.5 },
  ] },
];
