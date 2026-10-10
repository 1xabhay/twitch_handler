import { describe, expect, it } from 'vitest';
import { cityLayout, FOCUS_ID, GAP, LANDMARKS, landmarkFor, pickKind, POOL, SIZE, STACKABLE, streetLife, type Kind } from './city.ts';
import type { Floor, Town } from '../town.ts';

const fl = (kind: Kind, at: number, done = false): Floor => ({ task: `t${at}`, done, kind, at });

describe('pickKind', () => {
  it('maps a random number onto the whole pool', () => {
    expect(pickKind(0)).toBe(POOL[0]);
    expect(pickKind(0.9999)).toBe(POOL.at(-1));
    expect(new Set(Array.from({ length: 1000 }, (_, i) => pickKind(i / 1000)))).toEqual(new Set(POOL));
  });
});

describe('cityLayout', () => {
  it('starts from a blank canvas', () => {
    expect(cityLayout({}, 200)).toEqual([]);
  });

  it('fills the street left to right in the order tasks were opened, whoever opened them', () => {
    const town: Town = { a: { name: 'a', floors: [fl('park', 3), fl('office', 1, true)] }, b: { name: 'b', floors: [fl('pool', 2)] } };
    const lots = cityLayout(town, 500);
    expect(lots.map((l) => [l.kind, l.done, l.id])).toEqual([['office', true, 'a'], ['pool', false, 'b'], ['park', false, 'a']]);
    expect(lots.map((l) => l.x)).toEqual([0, SIZE.office[0] + 6, SIZE.office[0] + SIZE.pool[0] + 12]);
  });

  it('once the street is full, new tasks build storeys on the shortest office/apartment', () => {
    const width = SIZE.office[0] + 6 + SIZE.apartment[0]; // room for exactly two lots
    const town: Town = { a: { name: 'a', floors: [fl('office', 1), fl('apartment', 2), fl('arena', 3, true), fl('park', 4), fl('pool', 5)] } };
    const [office, apartment, ...rest] = cityLayout(town, width);
    expect(rest).toEqual([]);
    expect(office!.storeys).toEqual([{ id: 'a', done: true, at: 3 }, { id: 'a', done: false, at: 5 }]);
    expect(apartment!.storeys).toEqual([{ id: 'a', done: false, at: 4 }]);
  });

  it('stacks on whatever is there when no lot is stackable', () => {
    const lots = cityLayout({ a: { name: 'a', floors: [fl('park', 1), fl('pool', 2)] } }, SIZE.park[0]);
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

  it('fill from the right end of the street and never become storeys', () => {
    const width = 100;
    const town: Town = {
      [FOCUS_ID]: { name: 'focus', floors: [fl('skyscraper', 1, true), fl('fountain', 5)] },
      a: { name: 'a', floors: [fl('office', 2), fl('arena', 3), fl('park', 4)] },
    };
    const lots = cityLayout(town, width);
    const [sky, fountain] = lots.filter((l) => l.id === FOCUS_ID);
    expect(sky!.x + sky!.w).toBe(width);
    expect(fountain!.x + fountain!.w).toBe(sky!.x - GAP);
    expect(lots.filter((l) => l.id === 'a').every((l) => l.x + l.w <= fountain!.x)).toBe(true);
  });
});

describe('streetLife', () => {
  it('unlocks calm street life as buildings get finished', () => {
    const city = (n: number) => cityLayout({ a: { name: 'a', floors: Array.from({ length: n }, (_, i) => fl('office', i, true)) } }, 2000);
    expect(streetLife(city(2))).toEqual([]);
    expect(streetLife(city(3))).toEqual(['cars']);
    expect(streetLife(city(12))).toEqual(['cars', 'cart', 'balloon']);
  });
});

describe('landmark room', () => {
  it('landmarks never take more than half the street: the newest that fit stay', () => {
    const width = 100; // half = 50 → room for two 20px skyscrapers incl. gap, not three
    const town: Town = { [FOCUS_ID]: { name: 'focus', floors: [fl('skyscraper', 1, true), fl('skyscraper', 2, true), fl('skyscraper', 3)] } };
    const lots = cityLayout(town, width);
    expect(lots.map((l) => l.at)).toEqual([2, 3]);
    expect(lots.every((l) => l.x >= width / 2 - GAP)).toBe(true);
  });
});
