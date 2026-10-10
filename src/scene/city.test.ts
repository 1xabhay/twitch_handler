import { describe, expect, it } from 'vitest';
import { cityLayout, kindOf, MAX_FLOORS, type Lot } from './city.ts';
import type { Town } from '../town.ts';

// Task texts that roll a given lot kind for viewer 'a' (the roll is stable per viewer + text).
const tasksOf = (kind: string, n = 1) => Array.from({ length: 5000 }, (_, i) => `t${i}`).filter((t) => kindOf('a', t) === kind).slice(0, n);
const towerTasks = (n: number, done = true) => tasksOf('tower', n).map((task) => ({ task, done }));
const built = (lots: Lot[]) => lots.filter((l) => l.kind !== 'house' && l.kind !== 'park');

describe('kindOf', () => {
  it('is stable and mostly towers, with every SimCity extra possible', () => {
    expect(kindOf('a', 'read')).toBe(kindOf('a', 'read'));
    const kinds = new Set(Array.from({ length: 2000 }, (_, i) => kindOf('a', `t${i}`)));
    expect([...kinds].sort()).toEqual(['factory', 'fountain', 'hospital', 'school', 'shop', 'stadium', 'tower', 'turbine', 'watertower']);
  });
});

describe('cityLayout', () => {
  it('an empty town is still a city: houses and parks across the street', () => {
    const lots = cityLayout({}, 100);
    expect(lots.length).toBeGreaterThan(2);
    expect(lots.every((l) => (l.kind === 'house' || l.kind === 'park') && l.x + l.w <= 100)).toBe(true);
    expect(cityLayout({}, 100)).toEqual(lots); // deterministic
  });

  it('tower tasks stack into towers capped at MAX_FLOORS, spilling into a block next door', () => {
    const t = built(cityLayout({ a: { name: 'amy', floors: towerTasks(MAX_FLOORS + 1) } }, 500));
    expect(t.map((l) => l.kind === 'tower' && l.floors.length)).toEqual([MAX_FLOORS, 1]);
    expect(t.map((l) => l.kind === 'tower' && l.complete)).toEqual([false, true]); // flag on top only
  });

  it('other tasks become their own lot, open = under construction until done', () => {
    const [shop] = tasksOf('shop'), [plaza] = tasksOf('fountain');
    const t = built(cityLayout({ a: { name: 'amy', floors: [{ task: shop!, done: true }, { task: plaza!, done: false }] } }, 500));
    expect(t.map((l) => [l.kind, 'done' in l && l.done])).toEqual([['shop', true], ['fountain', false]]);
  });

  it('wraps into back rows instead of spilling off screen', () => {
    const town: Town = Object.fromEntries(['a', 'b', 'c', 'd'].map((id) => [id, { name: id, floors: [{ task: 'x', done: true }] }]));
    const lots = cityLayout(town, 60);
    expect(built(lots).every((l) => l.x + l.w <= 60)).toBe(true);
    expect(Math.max(...lots.map((l) => l.row))).toBeGreaterThan(0);
  });
});
