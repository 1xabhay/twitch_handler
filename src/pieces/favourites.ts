// Fan favourites, told through their objects (no faces).
import { circle, poly, type Piece } from './draw.ts';

// a heart with its dip at (x, y), s wide
const heart = (x: number, y: number, s: number) => {
  const k = s / 100;
  return `M${x} ${y + 65 * k} C${x - 60 * k} ${y + 27 * k} ${x - 50 * k} ${y - 27 * k} ${x} ${y} C${x + 50 * k} ${y - 27 * k} ${x + 60 * k} ${y + 27 * k} ${x} ${y + 65 * k} Z`;
};
// a bar from (x0, y0) to (x1, y1), w0 wide at the start and w1 at the end
const bar = (x0: number, y0: number, x1: number, y1: number, w0: number, w1: number) => {
  const l = Math.hypot(x1 - x0, y1 - y0), ux = (y0 - y1) / l, uy = (x1 - x0) / l;
  return poly([[x0 + ux * w0 / 2, y0 + uy * w0 / 2], [x1 + ux * w1 / 2, y1 + uy * w1 / 2], [x1 - ux * w1 / 2, y1 - uy * w1 / 2], [x0 - ux * w0 / 2, y0 - uy * w0 / 2]], true);
};
const studs = (x0: number, y0: number, x1: number, y1: number, ts: number[], side: number, r: number) => {
  const l = Math.hypot(x1 - x0, y1 - y0), ux = (y0 - y1) / l, uy = (x1 - x0) / l;
  return ts.flatMap((t, i) => {
    const s = (i % 2 ? side : -side) * t;
    return circle(x0 + (x1 - x0) * t + ux * s, y0 + (y1 - y0) * t + uy * s, r);
  }).join(' ');
};

export const FAVOURITES: Piece[] = [
  { name: 'Hancock', answers: ['hancock', 'boahancock', 'boa', 'piratempress', 'snakeprincess'], art: [
    { d: 'M250 194 C292 166 222 152 216 126 C208 96 252 92 236 64', c: 'violet', w: 10 },
    { d: 'M250 194 C292 166 222 152 216 126 C208 96 252 92 236 64', c: 'pink', w: 1 },
    { d: 'M242 60 C242 40 222 32 202 38 L176 46 L186 52 L178 58 L204 64 C222 68 242 74 242 60 Z', c: 'violet', w: 2.5, fill: true },
    { d: circle(216, 47, 3) + ' M168 52 L152 52 L144 46 M152 52 L144 58', c: 'red', w: 1.5 },
    { d: circle(240, 90, 11) + ' M233 99 L247 99 L247 106 L233 106 Z', c: 'white', w: 2, fill: true },
    { d: circle(236, 89, 2.5) + ' ' + circle(244, 89, 2.5) + ' M238 99 L238 106 M242 99 L242 106', c: 'white', w: 1 },
    { d: heart(88, 72, 110), c: 'pink', w: 3, fill: true },
    { d: heart(36, 24, 26) + ' ' + heart(150, 20, 20) + ' ' + heart(150, 150, 16), c: 'pink', w: 1.5 },
  ] },
  { name: 'Sabo', answers: ['sabo', 'revolutionary', 'flameemperor'], art: [
    { d: 'M38 184 L262 136', c: 'white', w: 4 },
    { d: circle(38, 184, 4) + ' ' + circle(262, 136, 4), c: 'white', w: 2 },
    { d: 'M110 96 L116 24 Q150 18 184 24 L190 96 Z', c: 'blue', w: 2.5, fill: true },
    { d: 'M66 102 Q150 84 234 102 Q150 120 66 102 Z', c: 'blue', w: 2.5, fill: true },
    { d: 'M111 84 Q150 92 189 84', c: 'yellow', w: 3 },
    { d: circle(132, 64, 12) + ' ' + circle(168, 64, 12) + ' M144 64 L156 64 M112 60 L120 62 M180 62 L188 60', c: 'cyan', w: 2 },
    { d: 'M196 152 C186 136 204 126 198 110 C214 122 214 136 220 140 C222 124 234 116 232 98 C248 116 250 132 254 138 C262 132 270 126 272 112 C284 132 284 148 266 160 Z', c: 'orange', w: 2.5, fill: true },
    { d: 'M216 150 C212 140 220 134 218 126 C228 134 230 142 236 146 C240 138 246 134 248 124 C256 136 256 146 250 154 Z', c: 'yellow', w: 1.5, fill: true },
  ] },
  { name: 'Yamato', answers: ['yamato', 'oniprincess'], art: [
    { d: bar(116, 194, 152, 158, 10, 12) + ' ' + bar(152, 158, 266, 40, 18, 40), c: 'white', w: 2.5, fill: true },
    { d: studs(152, 158, 266, 40, [0.3, 0.45, 0.6, 0.75, 0.9], 0, 3) + ' M144 166 L160 150', c: 'cyan', w: 2 },
    { d: 'M40 74 Q22 36 46 8 Q46 40 62 70 Z M106 70 Q122 40 122 8 Q146 36 128 74 Z', c: 'red', w: 2.5, fill: true },
    { d: 'M32 84 Q84 56 136 84', c: 'white', w: 2 },
    { d: 'M34 140 L88 140 L88 166 L34 166 Z', c: 'yellow', w: 2.5, fill: true },
    { d: circle(61, 153, 5) + ' M88 153 L100 153 ' + circle(108, 153, 7) + ' M116 149 L122 143 M117 157 L124 161', c: 'yellow', w: 1.5 },
  ] },
  { name: 'Vivi', answers: ['vivi', 'nefertarivivi', 'nefertari', 'missweds', 'misswednesday', 'princessvivi'], art: [
    { d: 'M20 186 Q90 166 160 182 Q230 196 290 178', c: 'orange', w: 1.5 },
    { d: 'M64 110 C64 82 110 78 150 92 C170 98 176 108 172 124 C166 150 128 156 96 150 C74 146 64 132 64 110 Z', c: 'yellow', w: 2.5, fill: true },
    { d: 'M66 104 L44 90 L54 108 L38 112 L64 120', c: 'yellow', w: 2 },
    { d: 'M158 100 C176 82 162 60 176 44', c: 'yellow', w: 6 },
    { d: circle(184, 40, 14), c: 'yellow', w: 2.5, fill: true },
    { d: 'M196 34 Q224 30 228 40 Q214 50 196 48 Z', c: 'orange', w: 2, fill: true },
    { d: circle(186, 36, 2.5) + ' M106 150 L102 180 L90 184 M102 180 L112 184 M132 150 L138 180 L126 184 M138 180 L148 184 M96 112 Q118 132 146 116', c: 'orange', w: 1.5 },
    { d: circle(250, 186, 5) + ' M250 181 C246 160 236 140 226 110 M250 181 C252 150 252 130 254 96 M250 181 C258 160 270 140 282 112', c: 'white', w: 1 },
    { d: 'M226 110 Q206 82 222 56 Q240 82 226 110 Z M254 96 Q238 64 256 38 Q272 66 254 96 Z M282 112 Q270 82 290 60 Q300 88 282 112 Z', c: 'cyan', w: 2, fill: true },
    { d: circle(222, 84, 6) + ' ' + circle(255, 68, 6) + ' ' + circle(286, 86, 5), c: 'violet', w: 2, fill: true },
  ] },
  { name: 'Lucci', answers: ['lucci', 'roblucci', 'hattori'], art: [
    { d: 'M64 150 C52 112 70 82 100 78 C102 52 140 46 150 70 C156 86 150 96 158 110 C170 130 150 156 120 160 L76 160 L40 170 Z', c: 'white', w: 2.5, fill: true },
    { d: 'M150 68 L166 74 L150 78', c: 'orange', w: 2, fill: true },
    { d: circle(136, 66, 3), c: 'white', w: 1.5 },
    { d: 'M134 92 L142 92 L140 100 L136 100 Z M136 100 L130 126 L138 134 L144 124 L140 100', c: 'red', w: 2, fill: true },
    { d: 'M78 120 Q100 112 120 128 M110 160 L108 182 M100 182 L116 182 M124 158 L126 182 M118 182 L134 182', c: 'white', w: 1.5 },
    { d: 'M30 184 L180 184', c: 'violet', w: 3 },
    { d: circle(238, 96, 9) + ' M228 90 L204 76 M230 104 L208 122 M246 88 L264 66 M248 104 L272 118 M238 86 L242 60 M236 106 L232 134', c: 'cyan', w: 1.5 },
    { d: 'M27 40 A9 7 0 0 1 38 33 M42 35 A9 7 0 0 1 42 45 M38 47 A9 7 0 0 1 27 42 M187 26 A9 7 0 0 1 198 19 M202 21 A9 7 0 0 1 202 31 M198 33 A9 7 0 0 1 187 28 M271 30 A9 7 0 0 1 282 23 M286 25 A9 7 0 0 1 286 35 M282 37 A9 7 0 0 1 271 32 M261 166 A9 7 0 0 1 272 159 M276 161 A9 7 0 0 1 276 171 M272 173 A9 7 0 0 1 261 168 M195 170 A9 7 0 0 1 206 163 M210 165 A9 7 0 0 1 210 175 M206 177 A9 7 0 0 1 195 172 M27 120 A9 7 0 0 1 38 113 M42 115 A9 7 0 0 1 42 125 M38 127 A9 7 0 0 1 27 122', c: 'orange', w: 2 },
    { d: 'M35 40 L37 40 M195 26 L197 26 M279 30 L281 30 M269 166 L271 166 M203 170 L205 170 M35 120 L37 120', c: 'yellow', w: 3 },
  ] },
  { name: 'Bon Clay', answers: ['bonclay', 'bonkure', 'bentham', 'mrtwo', 'mistertwo', 'mrtwobonclay'], art: [
    { d: 'M40 196 Q50 140 110 132 L190 132 Q250 140 260 196 Z', c: 'white', w: 2.5, fill: true },
    { d: 'M142 132 L134 196 M158 132 L166 196 M110 132 Q150 146 190 132', c: 'pink', w: 2 },
    { d: 'M92 136 C64 112 112 86 88 60 C82 52 74 50 70 56 M208 136 C236 112 188 86 212 60 C218 52 226 50 230 56', c: 'white', w: 6 },
    { d: circle(70, 52, 10) + ' ' + circle(230, 52, 10), c: 'white', w: 2.5, fill: true },
    { d: 'M61 50 L42 56 L61 58 Z M239 50 L258 56 L239 58 Z', c: 'orange', w: 2, fill: true },
    { d: 'M62 42 L62 30 L67 36 L70 28 L73 36 L78 30 L78 42 Z M222 42 L222 30 L227 36 L230 28 L233 36 L238 30 L238 42 Z', c: 'yellow', w: 1.5, fill: true },
    { d: 'M136 40 C130 22 168 22 160 44 L128 76 L166 76', c: 'pink', w: 4 },
  ] },
];
