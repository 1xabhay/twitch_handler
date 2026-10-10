// Pure city layout, shared by tests and the browser overlay (served type-stripped).
import type { Floor, Town } from '../town.ts';
import { hash } from './ambient.ts';

export const MAX_FLOORS = 10; // towers rise to ~30% of the screen; more floors become a block next door
export const FH = 8, GAP = 10;

// SimCity-style lots, [width, height] in canvas pixels. Towers grow a floor per task, the rest are one task each.
export const SIZE = {
  tower: [16, 0], shop: [16, 12], factory: [24, 22], watertower: [12, 22], turbine: [12, 28],
  fountain: [16, 8], school: [24, 18], hospital: [20, 20], stadium: [32, 12], house: [16, 15], park: [16, 9],
} as const;
const ROLL = ['tower', 'tower', 'tower', 'tower', 'shop', 'factory', 'watertower', 'turbine', 'fountain', 'school', 'hospital', 'stadium'] as const;
type Special = Exclude<(typeof ROLL)[number], 'tower'>;

// Each new task rolls what it builds. Same viewer + same text → same pick, so lots never reshuffle on reload.
export const kindOf = (id: string, task: string) => ROLL[hash(`${id}:${task}`) % ROLL.length]!;

export type Lot = { row: number; x: number; w: number; h: number } & (
  | { kind: 'tower'; id: string; name: string | null; floors: Floor[]; complete: boolean }
  | { kind: Special; id: string; done: boolean }
  | { kind: 'house' | 'park' }
);
type Unplaced<L = Lot> = L extends Lot ? Omit<L, 'row' | 'x'> : never; // distributes over the union

// A viewer's tower(s) and extras sit together as a neighbourhood. Lots fill the front row left to right,
// then rows behind it. Front lots nobody has built on yet are houses and parks, so the city never looks empty.
export const cityLayout = (town: Town, width: number): Lot[] => {
  const items = Object.entries(town).flatMap(([id, b]): Unplaced[] => {
    const floors = b.floors.filter((f) => kindOf(id, f.task) === 'tower');
    const allDone = b.floors.every((f) => f.done);
    const chunks = Array.from({ length: Math.ceil(floors.length / MAX_FLOORS) }, (_, i) =>
      floors.slice(i * MAX_FLOORS, (i + 1) * MAX_FLOORS));
    const towers = chunks.map((fs, i) => ({
      kind: 'tower' as const, id, name: i ? null : b.name, floors: fs,
      complete: allDone && i === chunks.length - 1, w: SIZE.tower[0], h: fs.length * FH,
    }));
    const extras = b.floors.flatMap((f) => {
      const kind = kindOf(id, f.task);
      return kind === 'tower' ? [] : [{ kind, id, done: f.done, w: SIZE[kind][0], h: SIZE[kind][1] }];
    });
    return [...towers, ...extras];
  });

  const lots: Lot[] = [];
  let row = 0, x = 0;
  const place = (item: Unplaced) => {
    if (x && x + item.w > width) { row++; x = 0; }
    lots.push({ ...item, row, x } as Lot);
    x += item.w + GAP;
  };
  items.forEach(place);
  while (row === 0 && x + SIZE.house[0] <= width) {
    const kind = hash(`lot${lots.length}`) % 3 ? 'house' : 'park';
    place({ kind, w: SIZE[kind][0], h: SIZE[kind][1] });
  }
  return lots;
};
