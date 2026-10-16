// Pure city layout, shared by tests and the browser overlay (served type-stripped).
import type { Floor, Town } from '../town.ts';
import { hash } from './ambient.ts';

export const FH = 8, GAP = 6;

// SimCity-style buildings, [width, height] in canvas pixels.
export const SIZE = {
  office: [16, 16], apartment: [16, 16], house: [16, 15], shop: [16, 12], factory: [24, 22], park: [16, 9],
  pool: [24, 6], arena: [32, 15], school: [24, 18], hospital: [20, 20], watertower: [12, 22], turbine: [12, 28], fountain: [16, 8],
  clocktower: [14, 34], skyscraper: [20, 64], ferris: [28, 30], // focus landmarks only
} as const;
export type Kind = keyof typeof SIZE;
// What a new task can roll. Offices and apartments are listed twice: they're what the city builds upward on.
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

// How chat says a kind: 'a water tower', or bare 'water tower' with article = false.
const SPELLED: Partial<Record<Kind, string>> = { watertower: 'water tower', clocktower: 'clock tower', ferris: 'ferris wheel' };
export const nameOf = (k: Kind, article = true) => {
  const name = SPELLED[k] ?? k;
  return article ? `${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}` : name;
};

export const kindOfFloor = (id: string, f: Floor): Kind => f.kind ?? POOL[hash(`${id}:${f.task}`) % POOL.length]!; // older floors had no kind

export type Storey = { id: string; done: boolean; at: number };
export type Row = 'front' | 'back';
export type Lot = { kind: Kind; id: string; done: boolean; at: number; row: Row; x: number; w: number; h: number; storeys: Storey[] };

// Skyline seen from across the river: low buildings line the riverfront, towers rise behind them.
const FRONT: ReadonlySet<Kind> = new Set(['park', 'pool', 'fountain', 'shop', 'house', 'arena', 'ferris']);
export const rowOf = (k: Kind): Row => (FRONT.has(k) ? 'front' : 'back');

// Each lot rolls its own spot anywhere along the street (seeded by its task, so it never moves once placed)
// and takes the free spot nearest to it, preferring spots the other row doesn't stand in front of or behind.
const place = (taken: readonly Lot[], other: readonly Lot[], w: number, seed: string, width: number): number | null => {
  const want = (hash(seed) % 1000) / 1000 * (width - w);
  const fits = (x: number) => x >= 0 && x + w <= width && taken.every((l) => x + w + GAP <= l.x || x >= l.x + l.w + GAP);
  const hidden = (x: number) => other.some((l) => x < l.x + l.w && l.x < x + w);
  const edges = [...taken.flatMap((l) => [l.x + l.w + GAP, l.x - GAP - w]), ...other.flatMap((l) => [l.x + l.w, l.x - w])];
  const spots = [Math.round(want), 0, width - w, ...edges].filter(fits);
  const cost = (x: number) => Math.abs(x - want) + (hidden(x) ? width : 0);
  return spots.length ? spots.reduce((a, b) => (cost(b) < cost(a) ? b : a)) : null;
};

// Blank city → each task takes a lot in its row (scaffolding until done).
// Once its row is full, the task adds a storey to the shortest office/apartment, so the city grows up.
export const cityLayout = (town: Town, width: number): Lot[] => {
  const items = Object.entries(town)
    .flatMap(([id, b]) => b.floors.map((f: Floor, i) => ({
      id, done: f.done,
      kind: kindOfFloor(id, f),
      at: f.at ?? i,
    })))
    .sort((a, b) => a.at - b.at);

  // landmarks get at most half the city's width: the newest that fit stay, oldest drop out of view
  // ponytail: a dropped landmark frees its lot, so later lots may shift once; fine at one drop per long day
  const shown = new Set<object>();
  let room = width / 2 + GAP;
  for (const it of items.filter((i) => i.id === FOCUS_ID).reverse()) {
    if (SIZE[it.kind][0] + GAP > room) break;
    room -= SIZE[it.kind][0] + GAP;
    shown.add(it);
  }

  const lots: Lot[] = [];
  for (const it of items) {
    if (it.id === FOCUS_ID && !shown.has(it)) continue;
    const { id, done, kind, at } = it, [w, h] = SIZE[kind], row = rowOf(kind);
    const x = place(lots.filter((l) => l.row === row), lots.filter((l) => l.row !== row), w, `${id}:${at}`, width);
    if (x !== null) { lots.push({ kind, id, done, at, row, x, w, h, storeys: [] }); continue; }
    if (id === FOCUS_ID) continue; // landmarks never become storeys
    const street = lots.filter((l) => l.id !== FOCUS_ID), towers = street.filter((l) => STACKABLE.has(l.kind));
    const pool = towers.length ? towers : street;
    if (pool.length) pool.reduce((a, b) => (b.storeys.length < a.storeys.length ? b : a)).storeys.push({ id, done, at });
  }
  return lots;
};

// Calm street life that moves in as the city grows (finished buildings + storeys).
const LIFE = [[3, 'boats'], [6, 'cart'], [12, 'balloon']] as const;
export const streetLife = (lots: Lot[]) => {
  const built = lots.reduce((n, l) => n + (l.done ? 1 : 0) + l.storeys.filter((s) => s.done).length, 0);
  return LIFE.filter(([at]) => built >= at).map(([, what]) => what);
};

// The far shore: faint towers across the bay, a new skyline each day. More appear as the city grows;
// k is each tower's share of the far skyline's height, which the overlay ties to the tallest real building.
export const farRow = (width: number, n: number, seed: string) =>
  Array.from({ length: n }, (_, i) => {
    const r = (s: string) => hash(`${seed}:${i}:${s}`);
    const w = 6 + (r('w') % 9);
    return { x: r('x') % (width - w + 1), w, k: 0.4 + (r('k') % 61) / 100 };
  });

// The old town: low rooftops that cover the whole street from the start of the day, a new layout each day,
// a little taller toward the core. New towers in the back row replace the houses they stand on.
export type House = { x: number; w: number; h: number; peak: boolean };
export const oldTown = (width: number, seed: string, lots: readonly Lot[]): House[] => {
  const houses: House[] = [];
  for (let x = 0, i = 0; x < width; i++) {
    const r = (s: string) => hash(`${seed}:old${i}:${s}`);
    const w = Math.min(width - x, 8 + (r('w') % 9)), core = 1 - Math.abs(x + w / 2 - width / 2) / (width / 2);
    houses.push({ x, w, h: Math.min(14, 5 + (r('h') % 5) + Math.round(5 * core)), peak: r('p') % 3 === 0 });
    x += w + (r('g') % 4);
  }
  const back = lots.filter((l) => l.row === 'back');
  return houses.filter((b) => back.every((l) => b.x + b.w + GAP <= l.x || b.x >= l.x + l.w + GAP));
};
