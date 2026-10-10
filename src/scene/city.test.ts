import { describe, expect, it } from 'vitest';
import { cityLayout, MAX_FLOORS } from './city.ts';
import type { Town } from '../town.ts';

const floors = (n: number, done = true) => Array.from({ length: n }, (_, i) => ({ task: `t${i}`, done }));
const towers = (town: Town, slots = 5) => cityLayout(town, slots).filter((l) => l.kind === 'tower');

describe('cityLayout', () => {
  it('an empty town is still a city: every front lot is a house or park', () => {
    const lots = cityLayout({}, 5);
    expect(lots).toHaveLength(5);
    expect(lots.every((l) => l.kind === 'house' || l.kind === 'park')).toBe(true);
    expect(cityLayout({}, 5)).toEqual(lots); // deterministic
  });

  it('caps towers at MAX_FLOORS, spilling extra floors into a block next door', () => {
    const t = towers({ a: { name: 'amy', floors: floors(MAX_FLOORS * 2 + 1) } });
    expect(t.map((l) => l.kind === 'tower' && l.floors.length)).toEqual([MAX_FLOORS, MAX_FLOORS, 1]);
    expect(t.map((l) => l.kind === 'tower' && l.name)).toEqual(['amy', null, null]); // label once
  });

  it('flags only the top tower of a fully done building', () => {
    const t = towers({ a: { name: 'amy', floors: floors(MAX_FLOORS + 1) }, b: { name: 'bo', floors: [...floors(1), ...floors(1, false)] } });
    expect(t.map((l) => l.kind === 'tower' && l.complete)).toEqual([false, true, false]);
  });

  it('wraps into back rows instead of growing taller, leaving no filler behind', () => {
    const town: Town = Object.fromEntries(['a', 'b', 'c', 'd'].map((id) => [id, { name: id, floors: floors(1) }]));
    const lots = cityLayout(town, 3);
    expect(lots.filter((l) => l.row === 1).map((l) => l.kind === 'tower' && l.id)).toEqual(['d']);
    expect(lots.filter((l) => l.row === 0).every((l) => l.kind === 'tower')).toBe(true);
  });

  it('skips viewers with no floors', () => {
    expect(towers({ a: { name: 'amy', floors: [] } })).toEqual([]);
  });
});
