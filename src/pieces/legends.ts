// Emperors and legends, told through their objects (no faces).
import { circle, n, poly, spiral, type Piece } from './draw.ts';

// a spiky sun ring: k points between radius r1 and r2
const star = (x: number, y: number, r1: number, r2: number, k: number) =>
  poly(Array.from({ length: k * 2 }, (_, i) => { const t = (i / (k * 2)) * 2 * Math.PI, r = i % 2 ? r1 : r2; return [n(x + Math.cos(t) * r), n(y + Math.sin(t) * r)]; }), true);

export const LEGENDS: Piece[] = [
  { name: 'Shanks', answers: ['shanks', 'redhair', 'redhairshanks', 'akagami'], art: [
    { d: 'M58 30 Q70 62 78 104 M80 24 Q92 58 100 100 M102 20 Q114 54 122 96', c: 'red', w: 3.5 },
    { d: 'M100 138 Q150 176 200 138 Z', c: 'red', w: 2.5, fill: true },
    { d: 'M100 138 A50 7 0 1 0 200 138 A50 7 0 1 0 100 138 Z', c: 'cyan', w: 1.5, fill: true },
    { d: 'M140 158 L136 172 L164 172 L160 158', c: 'red', w: 2 },
    { d: 'M150 118 Q152 124 150 128 M168 112 Q170 120 168 124', c: 'cyan', w: 1.5 },
    { d: 'M244 150 Q246 80 212 16 Q230 70 236 150', c: 'white', w: 2, fill: true },
    { d: 'M224 152 L258 148', c: 'yellow', w: 3.5 },
    { d: 'M228 152 Q222 178 244 188 M240 152 L246 186', c: 'yellow', w: 2.5 },
  ] },
  { name: 'Whitebeard', answers: ['whitebeard', 'edwardnewgate', 'newgate', 'shirohige'], art: [
    { d: 'M60 192 L60 70', c: 'orange', w: 4 },
    { d: 'M56 76 L50 56 Q46 26 78 6 Q76 30 88 46 Q84 64 68 76 Z', c: 'white', w: 2.5, fill: true },
    { d: 'M50 76 L72 76 M54 82 L66 82', c: 'yellow', w: 2.5 },
    { d: 'M100 40 Q175 130 250 40 Q175 92 100 40 Z', c: 'white', w: 3, fill: true },
    { d: 'M190 150 L150 128 L120 136 M190 150 L170 118 M190 150 L224 120 L246 126 M190 150 L246 160 M190 150 L210 186 M190 150 L150 178 L128 172', c: 'cyan', w: 1.5 },
    { d: 'M170 148 L180 136 L200 140 L208 156 L196 168 L176 164 Z', c: 'cyan', w: 2, fill: true },
  ] },
  { name: 'Blackbeard', answers: ['blackbeard', 'marshalldteach', 'teach', 'kurohige'], art: [
    { d: spiral(85, 85, 3, 62), c: 'violet', w: 3 },
    { d: spiral(85, 85, 2, 36), c: 'blue', w: 1.5 },
    { d: circle(85, 85, 8), c: 'violet', w: 2, fill: true },
    { d: 'M150 140 L150 166 Q215 194 280 166 L280 140', c: 'orange', w: 2.5, fill: true },
    { d: 'M150 140 A65 20 0 1 0 280 140 A65 20 0 1 0 150 140 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M168 132 L228 158 M206 124 L264 150 M170 152 L230 124 M206 160 L262 134', c: 'yellow', w: 1.5 },
    { d: circle(196, 126, 9) + ' ' + circle(222, 118, 9) + ' ' + circle(246, 128, 9), c: 'red', w: 2, fill: true },
    { d: 'M196 117 Q206 92 226 84 M222 109 Q224 94 226 84 M246 119 Q240 96 226 84', c: 'green', w: 1.5 },
  ] },
  { name: 'Big Mom', answers: ['bigmom', 'charlottelinlin', 'linlin'], art: [
    { d: star(70, 58, 30, 44, 12), c: 'orange', w: 2, fill: true },
    { d: circle(70, 58, 22), c: 'yellow', w: 2.5, fill: true },
    { d: 'M190 82 Q178 60 202 56 Q208 34 234 42 Q256 30 266 56 Q290 60 280 82 Z', c: 'white', w: 2.5, fill: true },
    { d: 'M236 86 L222 108 L234 108 L218 132', c: 'yellow', w: 3 },
    { d: 'M95 190 L205 190 L205 160 L95 160 Z M110 160 L190 160 L190 136 L110 136 Z M125 136 L175 136 L175 114 L125 114 Z', c: 'pink', w: 2.5, fill: true },
    { d: 'M95 166 Q104 174 112 166 Q122 174 132 166 Q142 174 152 166 Q162 174 172 166 Q182 174 192 166 Q198 172 205 166 M110 142 Q120 150 130 142 Q140 150 150 142 Q160 150 170 142 Q180 150 190 142', c: 'white', w: 1.5 },
    { d: 'M138 114 L138 98 M150 114 L150 96 M162 114 L162 98', c: 'cyan', w: 2 },
    { d: 'M138 94 Q135 90 138 86 Q141 90 138 94 M150 92 Q147 88 150 84 Q153 88 150 92 M162 94 Q159 90 162 86 Q165 90 162 94', c: 'yellow', w: 1.5 },
  ] },
  { name: 'Kaido', answers: ['kaido', 'kaidou', 'kaidoofthebeasts'], art: [
    { d: 'M30 150 C60 60 110 60 130 120 C150 180 200 180 220 110 C232 70 250 56 262 52', c: 'cyan', w: 7 },
    { d: 'M30 150 C60 60 110 60 130 120 C150 180 200 180 220 110 C232 70 250 56 262 52', c: 'blue', w: 2 },
    { d: 'M52 96 L44 84 L62 86 M80 72 L80 58 L94 70 M112 82 L120 70 L124 88 M156 164 L156 182 L168 166 M196 164 L204 180 L208 160', c: 'cyan', w: 1.5 },
    { d: 'M256 56 L284 44 L290 58 L268 66 Z', c: 'cyan', w: 2, fill: true },
    { d: 'M262 48 Q258 26 270 12 M272 46 Q276 26 292 18 M286 58 Q296 72 294 86', c: 'yellow', w: 1.5 },
    { d: 'M76 189 L84 195 L109 164 L119 159 L210 52 L186 34 L103 147 L101 158 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M115 130 L109 125 M136 102 L130 97 M157 74 L151 69 M178 45 L172 40 M133 143 L139 148 M155 116 L161 121 M178 90 L184 95 M201 63 L207 68 M84 182 L92 188 M92 172 L100 178 M100 162 L108 168', c: 'yellow', w: 2.5 },
  ] },
  { name: 'Gol D. Roger', answers: ['roger', 'goldroger', 'goldoroger', 'pirateking', 'kingofthepirates'], art: [
    { d: 'M102 66 Q100 26 150 22 Q200 26 198 66 Z M46 58 Q70 78 150 76 Q230 78 254 58 Q246 88 150 90 Q54 88 46 58 Z', c: 'red', w: 2.5, fill: true },
    { d: 'M103 58 Q150 66 197 58', c: 'yellow', w: 1.5 },
    { d: 'M150 128 Q120 142 96 128 Q78 114 84 90 Q94 114 118 116 Q136 118 150 128 Z M150 128 Q180 142 204 128 Q222 114 216 90 Q206 114 182 116 Q164 118 150 128 Z', c: 'white', w: 2.5, fill: true },
    { d: 'M110 190 L190 190 L190 160 L110 160 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M110 160 Q150 136 190 160 M110 172 L190 172 M146 168 L154 168 L154 178 L146 178 Z', c: 'yellow', w: 1.5 },
    { d: 'M60 108 L63 120 L75 123 L63 126 L60 138 M60 108 L57 120 L45 123 L57 126 L60 138 M238 140 L240 148 L248 150 L240 152 L238 160 L236 152 L228 150 L236 148 Z M64 150 L66 156 L72 158 L66 160 L64 166 L62 160 L56 158 L62 156 Z', c: 'yellow', w: 1.5 },
  ] },
];
