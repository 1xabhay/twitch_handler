import { describe, expect, it } from 'vitest';
import { cityLayout, farRow, oldTown, FOCUS_ID, nameOf, GAP, LANDMARKS, landmarkFor, pickKind, POOL, SIZE, STACKABLE, streetLife, type Kind } from './city.ts';
import type { Floor, Town } from '../town.ts';

const fl = (kind: Kind, at: number, done = false): Floor => ({ task: `t${at}`, done, kind, at });

describe('pickKind', () => {
  it('maps a random number onto the whole pool', () => {
    expect(pickKind(0)).toBe(POOL[0]);
    expect(pickKind(0.9999)).toBe(POOL.at(-1));
    expect(new Set(Array.from({ length: 1000 }, (_, i) => pickKind(i / 1000)))).toEqual(new Set(POOL));
  });
});

const overlaps = (lots: { x: number; w: number; row: string }[]) =>
  lots.some((a, i) => lots.some((b, j) => i < j && a.row === b.row && a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP));

describe('cityLayout', () => {
  it('starts from a blank canvas', () => {
    expect(cityLayout({}, 200)).toEqual([]);
  });

  it('low buildings line the riverfront, towers stand behind', () => {
    const lots = cityLayout({ a: { name: 'a', floors: [fl('park', 1), fl('office', 2), fl('pool', 3), fl('hospital', 4)] } }, 500);
    expect(lots.map((l) => [l.kind, l.row])).toEqual([['park', 'front'], ['office', 'back'], ['pool', 'front'], ['hospital', 'back']]);
  });

  it('scatters lots across the whole city, not just the core', () => {
    const lots = cityLayout({ a: { name: 'a', floors: Array.from({ length: 8 }, (_, i) => fl('office', 1_790_000_000_000 + i * 60_000)) } }, 480);
    const mid = lots.map((l) => l.x + l.w / 2);
    expect(mid.some((m) => m < 160) && mid.some((m) => m > 320)).toBe(true); // reaches both outer thirds
  });

  it('keeps a new lot out from behind the other row while there is room', () => {
    const floors = Array.from({ length: 10 }, (_, i) => fl(i % 2 ? 'office' : 'park', 1_790_000_000_000 + i * 60_000));
    const lots = cityLayout({ a: { name: 'a', floors } }, 480);
    const hidden = lots.some((a) => lots.some((b) => a.row !== b.row && a.x < b.x + b.w && b.x < a.x + a.w));
    expect(hidden).toBe(false);
  });

  it('never overlaps within a row, stays inside the city, and a new task never moves earlier lots', () => {
    const floors = Array.from({ length: 40 }, (_, i) => fl(POOL[i % POOL.length]!, i));
    const before = cityLayout({ a: { name: 'a', floors: floors.slice(0, 20) } }, 300);
    const after = cityLayout({ a: { name: 'a', floors } }, 300);
    expect(overlaps(after)).toBe(false);
    expect(after.every((l) => l.x >= 0 && l.x + l.w <= 300)).toBe(true);
    expect(after.slice(0, before.length).map((l) => l.x)).toEqual(before.map((l) => l.x));
  });

  it('once the back row is full, new tasks build storeys on the shortest office/apartment', () => {
    const width = 60; // scattered lots leave slivers: room for two towers here, not three
    const town: Town = { a: { name: 'a', floors: [fl('office', 1), fl('apartment', 2), fl('hospital', 3, true), fl('school', 4), fl('factory', 5)] } };
    const [office, apartment, ...rest] = cityLayout(town, width);
    expect(rest).toEqual([]);
    expect(office!.storeys).toEqual([{ id: 'a', done: true, at: 3 }, { id: 'a', done: false, at: 5 }]);
    expect(apartment!.storeys).toEqual([{ id: 'a', done: false, at: 4 }]);
  });

  it('stacks on whatever is there when no lot is stackable', () => {
    const lots = cityLayout({ a: { name: 'a', floors: [fl('park', 1), fl('park', 2)] } }, SIZE.park[0]);
    expect(lots).toHaveLength(1);
    expect(lots[0]!.storeys).toHaveLength(1);
  });

  it('lays out older floors saved without kind/at', () => {
    const lots = cityLayout({ a: { name: 'a', floors: [{ task: 'x', done: true }] } }, 500);
    expect(POOL).toContain(lots[0]!.kind);
  });

  it('only offices and apartments are stackable', () => {
    expect([...STACKABLE].sort()).toEqual(['apartment', 'office']);
  });
});

describe('focus landmarks', () => {
  it('scale with focus length', () => {
    expect(LANDMARKS.small).toContain(landmarkFor(25, 0));
    expect(LANDMARKS.civic).toContain(landmarkFor(50, 0.5));
    expect(LANDMARKS.grand).toContain(landmarkFor(90, 0.99));
  });

  it('mix into the city and never become storeys', () => {
    const town: Town = {
      [FOCUS_ID]: { name: 'focus', floors: [fl('skyscraper', 1, true), fl('fountain', 5)] },
      a: { name: 'a', floors: [fl('office', 2), fl('arena', 3), fl('park', 4)] },
    };
    const lots = cityLayout(town, 300);
    expect(lots.filter((l) => l.id === FOCUS_ID).map((l) => l.kind)).toEqual(['skyscraper', 'fountain']);
    expect(lots.every((l) => l.storeys.every((s) => s.id !== FOCUS_ID))).toBe(true);
    expect(overlaps(lots)).toBe(false);
  });
});

describe('streetLife', () => {
  it('unlocks calm street life as buildings get finished', () => {
    const city = (n: number) => cityLayout({ a: { name: 'a', floors: Array.from({ length: n }, (_, i) => fl('office', i, true)) } }, 2000);
    expect(streetLife(city(2))).toEqual([]);
    expect(streetLife(city(3))).toEqual(['boats']);
    expect(streetLife(city(12))).toEqual(['boats', 'cart', 'balloon']);
  });
});

describe('landmark room', () => {
  it('landmarks never take more than half the street: the newest that fit stay', () => {
    const width = 100; // half = 50 → room for two 20px skyscrapers incl. gap, not three
    const town: Town = { [FOCUS_ID]: { name: 'focus', floors: [fl('skyscraper', 1, true), fl('skyscraper', 2, true), fl('skyscraper', 3)] } };
    const lots = cityLayout(town, width);
    expect(lots.map((l) => l.at)).toEqual([2, 3]);
  });
});

describe('farRow', () => {
  it('is the same all day, stays inside the city, and growing never moves the towers already there', () => {
    const few = farRow(300, 5, '2026-10-13'), more = farRow(300, 12, '2026-10-13');
    expect(farRow(300, 5, '2026-10-13')).toEqual(few);
    expect(more.slice(0, 5)).toEqual(few);
    expect(more.every((f) => f.x >= 0 && f.x + f.w <= 300 && f.k > 0 && f.k <= 1)).toBe(true);
    expect(farRow(300, 5, '2026-10-14')).not.toEqual(few);
  });
});

describe('oldTown', () => {
  const lot = (x: number, w: number, row: 'front' | 'back') => ({ kind: 'office' as const, id: 'a', done: true, at: 1, row, x, w, h: 16, storeys: [] });

  it('covers the whole width with low houses from the start, a new town each day', () => {
    const town = oldTown(400, '2026-10-14', []);
    expect(town.every((b) => b.x >= 0 && b.x + b.w <= 400 && b.h <= 14)).toBe(true);
    const gaps = town.slice(1).map((b, i) => b.x - town[i]!.x - town[i]!.w);
    expect(Math.max(town[0]!.x, 400 - town.at(-1)!.x - town.at(-1)!.w, ...gaps)).toBeLessThanOrEqual(4);
    expect(oldTown(400, '2026-10-14', [])).toEqual(town);
    expect(oldTown(400, '2026-10-15', [])).not.toEqual(town);
  });

  it('makes way where new towers rise, not behind the riverfront', () => {
    const all = oldTown(400, 'd', []);
    const left = oldTown(400, 'd', [lot(100, 20, 'back'), lot(300, 20, 'front')]);
    expect(left.some((b) => b.x < 120 + GAP && b.x + b.w + GAP > 100)).toBe(false);
    expect(left.length).toBeLessThan(all.length);
    expect(left.filter((b) => b.x < 320 && b.x + b.w > 300)).toEqual(all.filter((b) => b.x < 320 && b.x + b.w > 300));
  });
});

describe('nameOf', () => {
  it('spells kinds out for chat, with the right article', () => {
    expect(nameOf('watertower')).toBe('a water tower');
    expect(nameOf('ferris')).toBe('a ferris wheel');
    expect(nameOf('office')).toBe('an office');
    expect(nameOf('arena', false)).toBe('arena');
    expect(nameOf('clocktower', true, { clocktower: 'lighthouse' })).toBe('a lighthouse'); // a theme renames
  });
});
