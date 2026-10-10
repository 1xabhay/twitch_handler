// Pure city layout, shared by tests and the browser overlay (served type-stripped).
import type { Floor, Town } from '../town.ts';
import { hash } from './ambient.ts';

export const MAX_FLOORS = 10; // towers rise to ~30% of the screen; more floors become a block next door

export type Lot = { row: number; col: number } & (
  | { kind: 'tower'; id: string; name: string | null; floors: Floor[]; complete: boolean }
  | { kind: 'house' | 'park' }
);

// Towers fill the front row left to right, then rows behind it (drawn smaller-looking, dimmer).
// Front lots nobody has built on yet are houses and parks, so the city never looks empty.
export const cityLayout = (town: Town, slots: number): Lot[] => {
  const towers = Object.entries(town).flatMap(([id, b]) => {
    const chunks = Array.from({ length: Math.ceil(b.floors.length / MAX_FLOORS) }, (_, i) =>
      b.floors.slice(i * MAX_FLOORS, (i + 1) * MAX_FLOORS));
    const allDone = b.floors.every((f) => f.done);
    return chunks.map((floors, i) =>
      ({ kind: 'tower' as const, id, name: i ? null : b.name, floors, complete: allDone && i === chunks.length - 1 }));
  });
  const placed = towers.map((t, i) => ({ ...t, row: Math.floor(i / slots), col: i % slots }));
  const fillers = Array.from({ length: Math.max(0, slots - towers.length) }, (_, i) => {
    const col = towers.length + i;
    return { kind: hash(`lot${col}`) % 3 ? ('house' as const) : ('park' as const), row: 0, col };
  });
  return [...placed, ...fillers];
};
