import { describe, expect, it } from 'vitest';
import { kit, type Kit, type Paint } from './blocks.ts';
import { SIZE, STACKABLE, type Kind } from './city.ts';
import { THEMES } from './theme.ts';

// Records every rectangle a block paints, so tests can check where it drew.
const record = () => {
  const rects: [number, number, number, number][] = [];
  const p: Paint = (x, y, w, h) => { rects.push([Math.round(x), Math.round(y), w, h]); };
  return { p, rects };
};
const S = { t: 1234, night: true, season: 'summer', minute: 7 } as const;
const SLACK = 4; // smoke, floodlights and spires may poke out a little

const fits = (k: Kit) => {
  for (const kind of Object.keys(SIZE) as Kind[]) {
    const { p, rects } = record(), [w, h] = SIZE[kind];
    k.lots[kind](p, 100, 200, S);
    expect(rects.length, kind).toBeGreaterThan(0);
    for (const [x, y, rw, rh] of rects) {
      expect(x, kind).toBeGreaterThanOrEqual(100 - SLACK);
      expect(x + rw, kind).toBeLessThanOrEqual(100 + w + SLACK);
      expect(y + rh, kind).toBeLessThanOrEqual(200); // nothing below the ground line
      expect(y, kind).toBeGreaterThanOrEqual(200 - h - SLACK - 12); // smoke rises a bit higher
    }
  }
  for (const kind of STACKABLE) {
    const { p, rects } = record();
    k.storey[kind]!(p, 100, 200, S);
    for (const [x, y, rw, rh] of rects) expect([x >= 100, x + rw <= 116, y >= 200, y + rh <= 208], kind).toEqual([true, true, true, true]);
  }
};

describe('building blocks', () => {
  it('the base kit draws every kind inside its lot', () => fits(kit()));
  it('every theme reskins, never resizes: its blocks fit the same lots', () => {
    for (const theme of Object.values(THEMES)) fits(kit(theme.kit));
  });
  it('a theme overrides only the blocks it names', () => {
    const base = kit(), themed = kit({ lots: { park: base.lots.pool } });
    expect(themed.lots.park).toBe(base.lots.pool);
    expect(themed.lots.office).toBe(base.lots.office);
  });
});
