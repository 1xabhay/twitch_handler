// Pure city layout, shared by tests and the browser overlay (served type-stripped).
import type { Floor, Town } from '../town.ts';
import { hash } from './ambient.ts';
import { liftAt, type Cover, type Land } from './land.ts';

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
export const nameOf = (k: Kind, article = true, names: Partial<Record<Kind, string>> = {}) => { // names: a theme's
  const name = names[k] ?? SPELLED[k] ?? k;
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
// keep: a span left open for the river mouth (city view), so the river reaches the bay
export const cityLayout = (town: Town, width: number, keep?: { x: number; w: number }): Lot[] => {
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
  const mouth: Lot[] = keep ? (['front', 'back'] as const).map((row) => ({ kind: 'park', id: '', done: true, at: 0, row, x: keep.x, w: keep.w, h: 0, storeys: [] })) : [];
  for (const it of items) {
    if (it.id === FOCUS_ID && !shown.has(it)) continue;
    const { id, done, kind, at } = it, [w, h] = SIZE[kind], row = rowOf(kind);
    const x = place([...mouth, ...lots].filter((l) => l.row === row), lots.filter((l) => l.row !== row), w, `${id}:${at}`, width);
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

// The city behind (town view 'city'): the same city further back, built from the same blocks, seen from up high,
// on the day's land (land.ts). Rows run from the horizon down to the riverfront, each nearer, lower on screen and
// drawn bigger (s = scale). The city grows organically: thickest downtown on the best flat ground (`core`), a
// couple of satellite towns, thinning into nature; never on water, bare rock or snow. One skyscraper landmark,
// bridges where the river runs through town, a viaduct across part of it.
export const GROUPS = {
  essential: ['house', 'apartment', 'office', 'shop', 'factory', 'watertower', 'turbine'],
  public: ['school', 'hospital', 'clocktower', 'fountain'],
  recreation: ['park', 'pool', 'arena', 'ferris'],
} as const satisfies Record<string, readonly Kind[]>;
const OUTSKIRTS: readonly Kind[] = ['house', 'house', 'house', 'apartment', 'apartment', 'shop', 'shop', 'office', 'factory', 'watertower', 'turbine'];
const SOLID: ReadonlySet<Cover> = new Set(['meadow', 'field', 'sand', 'beach', 'forest']);
export type Piece = { kind: Kind; x: number; y: number; w: number; h: number; storeys: number };
export type ViewRow = { y: number; k: number; s: number; pieces: Piece[]; river: { x: number; w: number }; bridge: boolean };
export const cityscape = (width: number, horizon: number, bottom: number, L: Land, n = 32) => {
  const r0 = (t: string) => hash(`${L.seed}:${t}`);
  // where to build: score spots by solid, gentle ground through the middle distance; downtown takes the best
  const firm = (x: number, k: number) => SOLID.has(L.cover(x, k)) && L.cover(x, k) !== 'forest';
  const score = (x: number) => [0.45, 0.6, 0.75, 0.9].reduce((n, k) => n + [-40, -20, 0, 20, 40].filter((d) => firm(x + d, k)).length, 0);
  const spots = Array.from({ length: Math.floor(width / 16) }, (_, i) => 8 + i * 16 + (r0(`spot${i}`) % 9))
    .sort((a, b) => score(b) - score(a) || r0(`tie${a}`) - r0(`tie${b}`)); // ties: a different winner each day
  const core = spots[0]!, towns = spots.filter((x) => Math.abs(x - core) > 130).slice(0, 2);
  const towns2 = towns.filter((x, i) => i === 0 || Math.abs(x - towns[0]!) > 100);
  // each town is a blob at its own depth: thick in the middle, fading out across and back
  const deep = (t: string) => 0.45 + (r0(t) % 40) / 100, ck = deep('ck'), tk = towns2.map((_, i) => deep(`tk${i}`));
  const blob = (x: number, k: number, cx: number, ckk: number, r: number) => Math.exp(-(((x - cx) / r) ** 2) - (((k - ckk) / 0.4) ** 2));
  const downtownAt = (x: number, k: number) => blob(x, k, core, ck, 100);
  const density = (x: number, k: number) => Math.max(downtownAt(x, k), ...towns2.map((t, i) => 0.65 * blob(x, k, t, tk[i]!, 50)), 0.06);
  const from = r0('viaFrom') % Math.round(width / 2), landmark = Math.round(n / 2.5);
  const viaduct = { row: Math.round(n / 2) + (r0('via') % 7) - 3, from, to: Math.min(width, from + Math.round(width * (0.4 + (r0('viaLen') % 40) / 100))) };
  const rows: ViewRow[] = Array.from({ length: n }, (_, i) => {
    const k = i / (n - 1), y = Math.round(horizon + (bottom - horizon) * k ** 1.6), s = Math.round((0.3 + 0.55 * k) * 100) / 100;
    const river = L.river(k), pieces: Piece[] = [];
    for (let x = -(r0(`${i}`) % 8), j = 0; x < width; j++) {
      const r = (t: string) => hash(`${L.seed}:${i}:${j}:${t}`), pick = <T>(list: readonly T[], t: string) => list[r(t) % list.length]!;
      const d = density(x, k), downtown = downtownAt(x, k);
      const kind: Kind = r('civic') % 100 < 12 ? pick(GROUPS.public, 'kind')
        : downtown < 0.4 && r('play') % 100 < 14 ? pick(GROUPS.recreation, 'kind')
        : downtown > 0.55 ? pick(['office', 'apartment'] as const, 'kind') : pick(OUTSKIRTS, 'kind');
      const storeys = STACKABLE.has(kind) ? Math.floor((r('st') % 100) / 100 * (1 + 5 * downtown ** 1.2)) : 0;
      const w = Math.max(2, Math.round(SIZE[kind][0] * s)), h = Math.round((SIZE[kind][1] + storeys * FH) * s);
      const ground = [x, x + w / 2, x + w - 1].map((gx) => L.cover(gx, k));
      const solid = ground.every((c) => SOLID.has(c)) && (ground.every((c) => c !== 'forest') || d > 0.5); // the city clears woods near its heart
      const base = y - liftAt(L, x + w / 2, k);
      if (solid && (r('grow') % 100) / 100 < d && base - h >= 24) pieces.push({ kind, x, y: base, w, h, storeys });
      x += solid ? w + (r('g') % 3 === 0 ? 1 + Math.round(3 * k) : 0) : Math.max(2, Math.round(4 * s)); // off solid ground: look a little further on
    }
    return { y, k, s, pieces, river, bridge: i > 0 && i !== viaduct.row && r0(`bridge${i}`) % (density(river.x + river.w / 2, k) > 0.3 ? 3 : 6) === 0 }; // in town often, in the country now and then
  });
  // the skyscraper: downtown, on the first solid spot searching out from the core and forward from its row
  for (const i of rows.keys()) for (const dx of [0, 8, -8, 16, -16, 24, -24, 32, -32]) {
    const lm = rows[(landmark + i) % n]!, w = Math.round(SIZE.skyscraper[0] * lm.s), x = Math.round(core + dx - w / 2);
    if (![x, x + w / 2, x + w - 1].every((gx) => SOLID.has(L.cover(gx, lm.k)))) continue;
    const y = lm.y - liftAt(L, x + w / 2, lm.k), h = Math.min(Math.round(SIZE.skyscraper[1] * lm.s), y - 24);
    lm.pieces = [...lm.pieces.filter((p) => p.x + p.w <= x || p.x >= x + w), { kind: 'skyscraper' as const, x, y, w, h, storeys: 0 }]
      .sort((a, b) => a.x - b.x);
    return { rows, core, viaduct };
  }
  return { rows, core, viaduct };
};

// The old town: low rooftops that cover the whole street from the start of the day, a new layout each day,
// a little taller toward the core. New towers in the back row replace the houses they stand on.
export type House = { x: number; w: number; h: number; peak: boolean };
export const oldTown = (width: number, seed: string, lots: readonly Lot[], keep?: { x: number; w: number }): House[] => {
  const houses: House[] = [];
  for (let x = 0, i = 0; x < width; i++) {
    const r = (s: string) => hash(`${seed}:old${i}:${s}`);
    const w = Math.min(width - x, 8 + (r('w') % 9)), core = 1 - Math.abs(x + w / 2 - width / 2) / (width / 2);
    houses.push({ x, w, h: Math.min(14, 5 + (r('h') % 5) + Math.round(5 * core)), peak: r('p') % 3 === 0 });
    x += w + (r('g') % 4);
  }
  const back = lots.filter((l) => l.row === 'back');
  return houses.filter((b) => back.every((l) => b.x + b.w + GAP <= l.x || b.x >= l.x + l.w + GAP) && (!keep || b.x + b.w <= keep.x || b.x >= keep.x + keep.w));
};
