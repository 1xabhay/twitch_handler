// Pure city layout, shared by tests and the browser overlay (served type-stripped).
import type { Floor, Town } from '../town.ts';
import { hash } from './ambient.ts';

export const FH = 8, GAP = 6;

// SimCity-style buildings a new task can roll, [width, height] in canvas pixels.
// Offices and apartments are listed twice: they're the ones the city can later build upward on.
export const SIZE = {
  office: [16, 16], apartment: [16, 16], house: [16, 15], shop: [16, 12], factory: [24, 22], park: [16, 9],
  pool: [24, 6], arena: [32, 15], school: [24, 18], hospital: [20, 20], watertower: [12, 22], turbine: [12, 28], fountain: [16, 8],
} as const;
export type Kind = keyof typeof SIZE;
export const POOL: readonly Kind[] = ['office', 'office', 'apartment', 'apartment', 'house', 'shop', 'factory', 'park', 'pool', 'arena', 'school', 'hospital', 'watertower', 'turbine', 'fountain'];
export const STACKABLE: ReadonlySet<Kind> = new Set(['office', 'apartment']);
export const pickKind = (r: number) => POOL[Math.min(POOL.length - 1, Math.floor(r * POOL.length))]!;

export type Storey = { id: string; done: boolean };
export type Lot = { kind: Kind; id: string; done: boolean; x: number; w: number; h: number; storeys: Storey[] };

// Blank canvas → tasks fill the street left to right in the order they were opened (scaffolding until done).
// Once nothing more fits, each new task adds a storey to the shortest office/apartment, so the city grows up.
export const cityLayout = (town: Town, width: number): Lot[] => {
  const items = Object.entries(town)
    .flatMap(([id, b]) => b.floors.map((f: Floor, i) => ({
      id, done: f.done,
      kind: f.kind ?? POOL[hash(`${id}:${f.task}`) % POOL.length]!, // floors saved before kinds existed
      at: f.at ?? i,
    })))
    .sort((a, b) => a.at - b.at);

  const lots: Lot[] = [];
  let x = 0;
  for (const { id, done, kind } of items) {
    const [w, h] = SIZE[kind];
    if (x + w <= width) { lots.push({ kind, id, done, x, w, h, storeys: [] }); x += w + GAP; continue; }
    const towers = lots.filter((l) => STACKABLE.has(l.kind));
    const pool = towers.length ? towers : lots;
    if (pool.length) pool.reduce((a, b) => (b.storeys.length < a.storeys.length ? b : a)).storeys.push({ id, done });
  }
  return lots;
};
