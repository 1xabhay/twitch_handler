// The land the city is built on (town view 'city'): a new landscape each day. Pure: elevation, water and ground
// cover at any spot, x across the screen (0..width) and k deep (0 at the horizon, 1 at the riverfront).
import { hash } from './ambient.ts';
import type { Season } from './ambient.ts';

export const BIOMES = ['coast', 'alpine', 'valley', 'mesa', 'archipelago', 'fjord'] as const;
export type Biome = (typeof BIOMES)[number];
export type Cover = 'water' | 'beach' | 'rock' | 'snow' | 'forest' | 'field' | 'meadow' | 'sand';

// smooth value noise: a hashed lattice, eased between corners, a few octaves stacked (0..1)
const corner = (s: number, i: number, j: number) => {
  let h = s ^ Math.imul(i, 374761393) ^ Math.imul(j, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const ease = (t: number) => t * t * (3 - 2 * t);
const noise = (s: number, x: number, y: number) => {
  const i = Math.floor(x), j = Math.floor(y), fx = ease(x - i), fy = ease(y - j);
  const top = corner(s, i, j) + (corner(s, i + 1, j) - corner(s, i, j)) * fx;
  const bot = corner(s, i, j + 1) + (corner(s, i + 1, j + 1) - corner(s, i, j + 1)) * fx;
  return top + (bot - top) * fy;
};
export const fbm = (s: number, x: number, y: number, octaves = 4) => {
  let sum = 0, amp = 1, norm = 0;
  for (let o = 0; o < octaves; o++, amp /= 2) { sum += amp * noise(s + o * 101, x * 2 ** o, y * 2 ** o); norm += amp; }
  return sum / norm;
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Per landscape: water level, snowline, how wooded (lower = more forest), and the river's width.
const TRAITS: Record<Biome, { water: number; snow: number; wood: number; river: number; beach: boolean }> = {
  coast: { water: 0.25, snow: 0.95, wood: 0.6, river: 1, beach: true },
  alpine: { water: 0.18, snow: 0.62, wood: 0.48, river: 0.8, beach: false },
  valley: { water: 0.2, snow: 0.9, wood: 0.58, river: 1, beach: true },
  mesa: { water: 0.12, snow: 9, wood: 0.8, river: 0.7, beach: false },
  archipelago: { water: 0.42, snow: 9, wood: 0.52, river: 0.6, beach: true },
  fjord: { water: 0.24, snow: 0.72, wood: 0.47, river: 2, beach: false },
};

export type Land = ReturnType<typeof land>;
export const land = (seed: string, width: number, { biome, season = 'summer' }: { biome?: Biome; season?: Season } = {}) => {
  const s = hash(`${seed}:land`), b: Biome = biome ?? BIOMES[hash(`${seed}:biome`) % BIOMES.length]!, T = TRAITS[b];
  const side = s % 2, bend = (s % 628) / 100;
  const river = (k: number) => {
    const w = Math.round((3 + 30 * k) * T.river);
    return { x: Math.round(width * (0.5 + 0.32 * Math.sin(bend + k * 3.2)) - w / 2), w };
  };
  const shape = (x: number, k: number) => {
    const n = fbm(s, x / 110, k * 3.5), ridged = 1 - Math.abs(2 * fbm(s + 7, x / 70, k * 3) - 1);
    switch (b) {
      case 'valley': return 0.12 + 0.5 * n;
      case 'alpine': return 0.15 + 0.4 * n + 0.8 * (1 - k) ** 2 * ridged ** 2;
      case 'fjord': return 0.2 + 0.7 * ridged * (1 - 0.5 * k);
      case 'coast': return 0.65 * n + 0.7 * ((side ? x / width : 1 - x / width) - 0.4);
      case 'archipelago': return 0.85 * n;
      case 'mesa': return 0.15 + (Math.floor((0.1 + n) * 4.5) / 4.5) * 0.55; // terraces with sheer steps
    }
  };
  const elev = (x: number, k: number) => { // the river carves its valley (a canyon in hard rock) down below the water
    const r = river(k), d = Math.abs(x + 0.5 - (r.x + r.w / 2)) - r.w / 2, e = shape(x, k);
    if (d < 0) return T.water - 0.03;
    const bank = b === 'mesa' ? 3 : 6 + r.w, carved = d >= bank ? e : Math.min(e, T.water + (e - T.water) * ease(d / bank) + 0.01);
    return k > 0.85 ? Math.max(carved, T.water + 0.06 * ease((k - 0.85) / 0.15)) : carved; // dry land meets the promenade
  };
  const snowline = season === 'winter' ? Math.min(T.snow - 0.2, T.water + 0.3) : T.snow; // winter whitens the hills too
  const cover = (x: number, k: number): Cover => {
    const e = elev(x, k);
    if (e < T.water) return 'water';
    const steep = Math.max(Math.abs(elev(x + 4, k) - elev(x - 4, k)), Math.abs(e - elev(x, Math.min(1, k + 0.05)))) * 2;
    if (e > snowline && steep < 0.5) return 'snow';
    if (steep > (b === 'mesa' ? 0.12 : 0.35)) return 'rock';
    if (T.beach && e < T.water + 0.04) return 'beach';
    const wet = fbm(s + 13, x / 60, k * 5);
    if (wet > T.wood) return 'forest';
    if (b === 'valley' && wet < 0.42) return 'field';
    return b === 'mesa' ? 'sand' : 'meadow';
  };
  return { seed, biome: b, season, width, water: T.water, river, elev, cover, snowline };
};

// how far the ground at x, k deep stands above its row's base line on screen; 0 at the riverfront, capped below
// the sky clock (max)
export const liftAt = (L: Land, x: number, k: number, max = 46) =>
  0 + Math.min(max, Math.round(Math.max(L.elev(x, k), L.water) * 58 * (1 - k) ** 1.3));
