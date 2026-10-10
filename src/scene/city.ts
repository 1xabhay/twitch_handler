// Pure city layout, shared by tests and the browser overlay (served type-stripped).
import type { Floor, Town } from '../town.ts';
import { hash } from './ambient.ts';

export const FH = 8, GAP = 6;

// SimCity-style buildings a new task can roll, [width, height] in canvas pixels.
// Offices and apartments are listed twice: they're the ones the city can later build upward on.
export const SIZE = {
  office: [16, 16], apartment: [16, 16], house: [16, 15], shop: [16, 12], factory: [24, 22], park: [16, 9],
  pool: [24, 6], arena: [32, 15], school: [24, 18], hospital: [20, 20], watertower: [12, 22], turbine: [12, 28], fountain: [16, 8],
  clocktower: [14, 34], skyscraper: [20, 64], ferris: [28, 30], // focus landmarks only
} as const;
export type Kind = keyof typeof SIZE;
export const POOL: readonly Kind[] = ['office', 'office', 'apartment', 'apartment', 'house', 'shop', 'factory', 'park', 'pool', 'arena', 'school', 'hospital', 'watertower', 'turbine', 'fountain'];
export const STACKABLE: ReadonlySet<Kind> = new Set(['office', 'apartment']);
const pick = <T>(list: readonly T[], r: number) => list[Math.min(list.length - 1, Math.floor(r * list.length))]!;
export const pickKind = (r: number) => pick(POOL, r);

// The streamer's focus blocks build landmarks; longer blocks build grander ones.
export const FOCUS_ID = 'focus'; // town key for landmarks (Twitch user ids are numeric, no clash)
export const LANDMARKS = {
  small: ['shop', 'fountain', 'pool'], civic: ['school', 'hospital', 'clocktower'], grand: ['skyscraper', 'arena', 'ferris'],
} as const satisfies Record<string, readonly Kind[]>;
export const landmarkFor = (min: number, r: number): Kind =>
  pick(min >= 80 ? LANDMARKS.grand : min >= 40 ? LANDMARKS.civic : LANDMARKS.small, r);

export type Storey = { id: string; done: boolean };
export type Lot = { kind: Kind; id: string; done: boolean; x: number; w: number; h: number; storeys: Storey[] };

// Blank canvas → tasks fill the street left to right in the order they were opened (scaffolding until done).
// Once nothing more fits, each new task adds a storey to the shortest office/apartment, so the city grows up.
// Focus landmarks fill in from the right end, so a new one never shuffles viewers' lots.
export const cityLayout = (town: Town, width: number): Lot[] => {
  const items = Object.entries(town)
    .flatMap(([id, b]) => b.floors.map((f: Floor, i) => ({
      id, done: f.done,
      kind: f.kind ?? POOL[hash(`${id}:${f.task}`) % POOL.length]!, // floors saved before kinds existed
      at: f.at ?? i,
    })))
    .sort((a, b) => a.at - b.at);

  const lots: Lot[] = [];
  let right = width;
  for (const { id, done, kind } of items.filter((it) => it.id === FOCUS_ID)) {
    const [w, h] = SIZE[kind];
    lots.push({ kind, id, done, x: right - w, w, h, storeys: [] }); // ponytail: ~15 landmarks fill the street; trim old ones if a streak gets that long
    right -= w + GAP;
  }
  let x = 0;
  for (const { id, done, kind } of items.filter((it) => it.id !== FOCUS_ID)) {
    const [w, h] = SIZE[kind];
    if (x + w <= right) { lots.push({ kind, id, done, x, w, h, storeys: [] }); x += w + GAP; continue; }
    const street = lots.filter((l) => l.id !== FOCUS_ID), towers = street.filter((l) => STACKABLE.has(l.kind));
    const pool = towers.length ? towers : street;
    if (pool.length) pool.reduce((a, b) => (b.storeys.length < a.storeys.length ? b : a)).storeys.push({ id, done });
  }
  return lots;
};

// Calm street life that moves in as the city grows (finished buildings + storeys).
const LIFE = [[3, 'cars'], [6, 'cart'], [12, 'balloon']] as const;
export const streetLife = (lots: Lot[]) => {
  const built = lots.reduce((n, l) => n + (l.done ? 1 : 0) + l.storeys.filter((s) => s.done).length, 0);
  return LIFE.filter(([at]) => built >= at).map(([, what]) => what);
};
