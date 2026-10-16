// Building blocks: every sprite the city is made of, as pure functions on a painter.
// The overlay paints with them; a theme swaps individual blocks (kit) and leaves the rest.
import { hash, type Season } from './ambient.ts';
import { FH, type Kind } from './city.ts';

export type Paint = (x: number, y: number, w: number, h: number, color: string) => void;
export type Scene = { t: number; night: boolean; season: Season; minute: number };
export type Block = (p: Paint, x: number, y: number, s: Scene) => void; // lots: x = left, y = ground line

export const C = {
  wall: '#6B5E7A', slab: '#463D52', dark: '#22202B', lit: '#FFD27A', shine: '#FFF1C1',
  hazard: '#F2C230', hazardDark: '#1E1E1E', scaffold: '#B08850', beacon: '#FF8A3D', garden: '#5FA55A',
  hat: '#F2C230', vest: '#FF8A3D', skin: '#E8B796', legs: '#3A4A6B', cat: '#1E1E24',
};
export const FLAGS = ['#E4572E', '#4C9AFF', '#F4F4F4', '#C77DFF', '#2EC4B6', '#FF6F91'];
const LEAVES = { spring: '#8FD18F', summer: '#3E8E41', autumn: '#D9822B', winter: null };
const W = 16;
const glass = C.lit; // finished = lights on, day and night: the "done" signal next to dark scaffolding

export const tree = (p: Paint, x: number, y: number, season: Season) => {
  p(x + 2, y - 4, 1, 4, '#6B4A2B');
  const leaves = LEAVES[season];
  if (leaves) { p(x, y - 9, 5, 5, leaves); if (season === 'spring') p(x + 1, y - 8, 1, 1, '#F7A8C4'); }
  else p(x + 1, y - 6, 3, 1, '#F4F4F4'); // bare branch with snow
};

// one finished storey (8px) of a stackable building, top-left at x, y
const STOREY: Partial<Record<Kind, Block>> = {
  office: (p, x, y) => { // glass curtain wall
    p(x, y, W, FH, '#5E7A96'); p(x, y + 7, W, 1, '#46607A');
    p(x + 1, y + 2, 14, 3, glass); p(x + 5, y + 2, 1, 3, '#46607A'); p(x + 10, y + 2, 1, 3, '#46607A');
  },
  apartment: (p, x, y) => { // warm brick, windows with little balconies
    p(x, y, W, FH, '#B9876A'); p(x, y + 7, W, 1, '#8C5E48');
    for (const wx of [3, 10]) { p(x + wx, y + 2, 3, 3, glass); p(x + wx - 1, y + 5, 5, 1, '#5A4A42'); }
  },
};
// top of a finished tower (y = its roof line): office antenna with a slow beacon, apartment roof garden
const roof = (p: Paint, x: number, y: number, kind: Kind, t: number) => {
  p(x, y - 2, W, 2, C.slab);
  if (kind === 'office') { p(x + 11, y - 7, 1, 5, C.slab); if (Math.floor(t / 1500) % 2) p(x + 11, y - 8, 1, 1, '#E4572E'); }
  else for (const gx of [2, 3, 5, 9, 10]) p(x + gx, y - 3, 1, 1, C.garden);
};

// finished SimCity-style lots, drawn from the ground line y up; shapes carry meaning, not just colour
const LOTS: Record<Kind, Block> = {
  office: (p, x, y, s) => { STOREY.office!(p, x, y - 16, s); STOREY.office!(p, x, y - 8, s); p(x + 6, y - 5, 4, 5, '#9FC4E0'); },
  apartment: (p, x, y, s) => { STOREY.apartment!(p, x, y - 16, s); STOREY.apartment!(p, x, y - 8, s); p(x + 7, y - 5, 3, 5, C.dark); },
  house: (p, x, y) => { // little two-storey house with a pitched roof
    p(x + 2, y - 10, 12, 10, '#8C6F5A'); p(x + 7, y - 5, 2, 5, C.dark);
    for (let i = 0; i < 4; i++) p(x + 1 + i, y - 11 - i, 14 - 2 * i, 1, '#9C4A3A');
    p(x + 4, y - 8, 2, 2, glass); p(x + 10, y - 8, 2, 2, glass);
  },
  park: (p, x, y, s) => { // two trees and a bench
    tree(p, x, y, s.season); tree(p, x + 10, y, s.season);
    p(x + 5, y - 2, 5, 1, '#6B4A2B'); p(x + 5, y - 1, 1, 1, '#6B4A2B'); p(x + 9, y - 1, 1, 1, '#6B4A2B');
  },
  pool: (p, x, y, { t }) => { // deck, lanes, a sun umbrella
    p(x, y - 2, 24, 2, '#D8D0C0'); p(x + 2, y - 4, 20, 2, '#4FB3E8');
    for (let i = 4; i < 22; i += 4) p(x + i, y - 4, 1, 1, '#F4F4F4');
    p(x + 2 + ((Math.floor(t / 700) * 3) % 18), y - 3, 2, 1, '#BFE9FF'); // shimmer
    p(x + 22, y - 6, 1, 4, '#C0C0C0'); p(x, y - 7, 5, 1, '#E4572E'); p(x + 2, y - 6, 1, 4, '#6B4A2B');
  },
  shop: (p, x, y) => { // striped awning, shop window, door
    p(x, y - 10, 16, 10, '#C9A27A');
    for (let i = 0; i < 16; i += 2) p(x + i, y - 12, 2, 2, i % 4 ? '#F4F4F4' : '#E4572E');
    p(x + 2, y - 8, 7, 5, glass); p(x + 11, y - 7, 3, 7, C.dark);
  },
  factory: (p, x, y, { t }) => { // sawtooth roof, smokestack with slow puffs
    p(x, y - 12, 18, 12, '#7A6A5A');
    for (let i = 0; i < 18; i += 6) { p(x + i, y - 13, 5, 1, '#5A4A42'); p(x + i, y - 14, 3, 1, '#5A4A42'); }
    for (let i = 0; i < 3; i++) p(x + 2 + i * 5, y - 8, 3, 2, glass);
    p(x + 19, y - 22, 3, 22, '#5A4A42'); p(x + 19, y - 20, 3, 1, '#E4572E');
    for (let k = 0; k < 3; k++) {
      const f = (t / 3000 + k / 3) % 1;
      p(x + 20 + f * 5, y - 25 - f * 12, 2, 2, `rgba(225,225,225,${(1 - f) * 0.8})`);
    }
  },
  watertower: (p, x, y) => { // tank on legs
    p(x + 2, y - 12, 1, 12, '#6E8796'); p(x + 9, y - 12, 1, 12, '#6E8796'); p(x + 2, y - 7, 8, 1, '#6E8796');
    p(x + 1, y - 20, 10, 8, '#9FB8C8'); p(x + 1, y - 16, 10, 1, '#6E8796'); p(x + 2, y - 22, 8, 2, '#6E8796');
  },
  turbine: (p, x, y, { t }) => { // wind turbine, blades turn slowly
    p(x + 6, y - 22, 1, 22, '#E8E8E8');
    if (Math.floor(t / 600) % 2) { p(x + 6, y - 28, 1, 6, '#F4F4F4'); p(x + 1, y - 22, 5, 1, '#F4F4F4'); p(x + 7, y - 22, 5, 1, '#F4F4F4'); }
    else for (let i = 1; i < 5; i++) { p(x + 6 - i, y - 22 - i, 1, 1, '#F4F4F4'); p(x + 6 + i, y - 22 - i, 1, 1, '#F4F4F4'); p(x + 6 + i, y - 22 + i, 1, 1, '#F4F4F4'); }
  },
  fountain: (p, x, y, { t }) => { // plaza with a bubbling fountain and two bushes
    p(x, y - 1, 16, 1, '#B8B0A0'); p(x + 3, y - 3, 10, 2, '#8A8A9A'); p(x + 4, y - 3, 8, 1, '#7FC8F8');
    const f = Math.floor(t / 400) % 2;
    p(x + 7, y - 7 + f, 2, 4 - f, '#BFE3FF'); p(x + 5, y - 6 + f, 1, 1, '#BFE3FF'); p(x + 10, y - 6 + f, 1, 1, '#BFE3FF');
    p(x, y - 3, 2, 2, C.garden); p(x + 14, y - 3, 2, 2, C.garden);
  },
  school: (p, x, y) => { // brick block, bell tower with clock
    p(x, y - 12, 24, 12, '#B5523B'); p(x - 1, y - 13, 26, 1, C.slab);
    p(x + 9, y - 18, 6, 5, '#B5523B'); p(x + 10, y - 19, 4, 1, C.slab); p(x + 11, y - 17, 2, 2, '#F4F4F4');
    for (const wx of [2, 6, 16, 20]) p(x + wx, y - 9, 2, 3, glass);
    p(x + 10, y - 5, 4, 5, C.dark);
  },
  hospital: (p, x, y) => { // white block, big cross
    p(x, y - 18, 20, 18, '#E8E8EC');
    p(x + 9, y - 16, 2, 6, '#E4572E'); p(x + 7, y - 14, 6, 2, '#E4572E');
    for (const wx of [2, 6, 12, 16]) p(x + wx, y - 8, 2, 2, glass);
    p(x + 8, y - 4, 4, 4, '#9FC4E0');
  },
  clocktower: (p, x, y, { minute }) => { // the clock shows the real minute hand
    p(x + 2, y - 28, 10, 28, '#C9B38A'); p(x + 3, y - 30, 8, 2, '#8C5E48'); p(x + 5, y - 32, 4, 2, '#8C5E48'); p(x + 6, y - 34, 2, 2, '#8C5E48');
    p(x + 4, y - 25, 6, 6, '#F4F4F4'); p(x + 6, y - 23, 2, 2, C.dark);
    const [hx, hy, hw, hh] = ([[6, -25, 1, 2], [8, -23, 2, 1], [6, -21, 1, 2], [4, -23, 2, 1]] as const)[Math.floor(minute / 15)]!;
    p(x + hx, y + hy, hw, hh, C.dark); // minute hand, quarter-hour steps
    p(x + 6, y - 15, 2, 4, glass); p(x + 5, y - 5, 4, 5, C.dark);
  },
  skyscraper: (p, x, y, { t }) => { // glass tower, a few windows dark, slow beacon on the spire
    p(x, y - 60, 20, 60, '#4A6A8A'); p(x + 3, y - 62, 14, 2, '#36506A'); p(x + 9, y - 64, 2, 2, '#36506A');
    for (let j = 0; j < 14; j++) for (let c = 0; c < 4; c++)
      p(x + 2 + c * 5, y - 57 + j * 4, 3, 2, hash(`w${j}:${c}`) % 3 ? C.lit : '#2A3A4A');
    if (Math.floor(t / 1500) % 2) p(x + 9, y - 65, 1, 1, '#E4572E');
  },
  ferris: (p, x, y, { t }) => { // slowly turning wheel with coloured cabins
    const cx = x + 14, cy = y - 16, a0 = t / 9000;
    for (const lx of [-8, 8]) for (let k = 0; k <= 16; k++) p(cx + (lx * k) / 16, cy + k - 1, 1, 1, '#8A8A9A');
    p(x + 4, y - 1, 20, 1, '#8A8A9A');
    for (let k = 0; k < 28; k++) p(cx + Math.cos(k / 28 * 2 * Math.PI) * 12, cy + Math.sin(k / 28 * 2 * Math.PI) * 12, 1, 1, '#E8E8E8');
    for (let k = 0; k < 8; k++) {
      const a = a0 + (k / 8) * 2 * Math.PI;
      if (k % 2 === 0) for (let r = 2; r < 12; r += 2) p(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, '#C0C0C8');
      p(cx + Math.cos(a) * 12 - 1, cy + Math.sin(a) * 12, 3, 2, FLAGS[k % FLAGS.length]!);
    }
  },
  arena: (p, x, y, { night }) => { // seating bowl and floodlights
    p(x, y - 8, 32, 8, '#8A8A9A'); p(x + 2, y - 10, 28, 2, '#A8A8B8');
    for (let i = 4; i < 28; i += 3) p(x + i, y - 6, 2, 1, FLAGS[i % FLAGS.length]!);
    for (const lx of [0, 31]) { p(x + lx, y - 14, 1, 6, '#5A5A6A'); p(x + lx - 1, y - 15, 3, 1, night ? C.shine : '#DDDDDD'); }
  },
};

// The box behind each solid building (depth): [x offset, width, height, wall colour].
// Parks, pools, fountains, towers on legs, turbines and the wheel are open shapes: no box.
type Body = readonly [number, number, number, string];
const BODY: Partial<Record<Kind, Body>> = {
  office: [0, 16, 16, '#5E7A96'], apartment: [0, 16, 16, '#B9876A'], house: [2, 12, 10, '#8C6F5A'], shop: [0, 16, 10, '#C9A27A'],
  factory: [0, 18, 12, '#7A6A5A'], school: [0, 24, 12, '#B5523B'], hospital: [0, 20, 18, '#E8E8EC'], skyscraper: [0, 20, 60, '#4A6A8A'],
  clocktower: [2, 10, 28, '#C9B38A'], arena: [0, 32, 8, '#8A8A9A'],
};

// --- street life ---------------------------------------------------------
const boat = (p: Paint, x: number, y: number, color: string, dir: number, night: boolean) => { // little river boat with a wake
  p(x, y, 10, 2, color); p(x + 1, y + 2, 8, 1, '#22202B'); p(x + 3, y - 2, 4, 2, '#F4F4F4'); p(x + 4, y - 2, 1, 1, '#9FC4E0');
  p(dir > 0 ? x - 4 : x + 11, y + 2, 3, 1, '#BFE3FF');
  if (night) p(dir > 0 ? x + 9 : x, y - 1, 1, 1, C.shine);
};
const cart = (p: Paint, x: number, y: number) => { // y = ground line
  p(x, y - 4, 8, 3, '#E8D8B0'); p(x + 1, y - 1, 2, 1, '#111111'); p(x + 5, y - 1, 2, 1, '#111111');
  p(x + 4, y - 8, 1, 4, '#555555'); for (let i = 0; i < 10; i += 2) p(x - 1 + i, y - 9, 2, 1, i % 4 ? '#F4F4F4' : '#E4572E');
};
const balloon = (p: Paint, x: number, y: number, _t: number) => {
  p(x, y + 1, 6, 4, '#E4572E'); p(x + 1, y, 4, 6, '#E4572E'); p(x + 2, y, 2, 6, '#F2C230');
  p(x + 1, y + 6, 1, 2, '#6B4A2B'); p(x + 4, y + 6, 1, 2, '#6B4A2B'); p(x + 2, y + 8, 2, 2, '#6B4A2B');
};

const BASE = { lots: LOTS, storey: STOREY, roof, body: BODY, boat, cart, balloon, water: { day: '#2E4E70', night: '#141C33' } };
export type Kit = typeof BASE;
export type KitPatch = { [K in keyof Kit]?: Kit[K] extends Record<string, unknown> ? Partial<Kit[K]> : Kit[K] };

// The base kit, with a theme's blocks laid over it (only the ones it names).
export const kit = (patch: KitPatch = {}): Kit => ({
  ...BASE, ...patch,
  lots: { ...LOTS, ...patch.lots } as Kit['lots'],
  storey: { ...STOREY, ...patch.storey },
  body: { ...BODY, ...patch.body },
  water: { ...BASE.water, ...patch.water },
});
