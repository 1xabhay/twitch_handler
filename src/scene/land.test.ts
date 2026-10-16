import { describe, expect, it } from 'vitest';
import { BIOMES, land, liftAt } from './land.ts';

const grid = (L: ReturnType<typeof land>) =>
  Array.from({ length: 24 }, (_, i) => Array.from({ length: 48 }, (_, j) => L.cover(j * 10, i / 23))).flat();
const share = (L: ReturnType<typeof land>, c: string) => grid(L).filter((x) => x === c).length / grid(L).length;

describe('land', () => {
  it('rolls a landscape per day, every kind turns up, and can be pinned', () => {
    const days = Array.from({ length: 60 }, (_, i) => land(`2026-11-${i}`, 480).biome);
    expect(new Set(days)).toEqual(new Set(BIOMES));
    expect(land('2026-10-16', 480).elev(123, 0.4)).toBe(land('2026-10-16', 480).elev(123, 0.4));
    expect(land('2026-10-16', 480, { biome: 'mesa' }).biome).toBe('mesa');
  });

  it('every landscape is varied: several kinds of ground, some water', () => {
    for (const biome of BIOMES) {
      const L = land('2026-10-16', 480, { biome }), kinds = new Set(grid(L));
      expect(kinds.size, biome).toBeGreaterThanOrEqual(4);
      expect(kinds.has('water'), biome).toBe(true);
    }
  });

  it('each landscape has its own character', () => {
    const at = (biome: (typeof BIOMES)[number], c: string, season: 'summer' | 'winter' = 'summer') => share(land('2026-10-16', 480, { biome, season }), c);
    expect(at('archipelago', 'water')).toBeGreaterThan(at('mesa', 'water'));
    expect(at('alpine', 'snow')).toBeGreaterThan(0);
    expect(at('mesa', 'snow')).toBe(0);
    expect(at('valley', 'snow', 'winter')).toBeGreaterThan(at('valley', 'snow'));
    expect(at('valley', 'field')).toBeGreaterThan(0);
    expect(at('mesa', 'rock')).toBeGreaterThan(at('valley', 'rock'));
    expect(at('archipelago', 'beach')).toBeGreaterThan(0);
  });

  it('water lies flat at its level, the river runs as water down to us', () => {
    const L = land('2026-10-16', 480, { biome: 'valley' });
    for (let x = 0; x < 480; x += 7) for (const k of [0.2, 0.5, 0.8]) expect(L.cover(x, k) === 'water').toBe(L.elev(x, k) < L.water);
    for (const k of [0.1, 0.5, 0.9]) expect(L.cover(L.river(k).x + L.river(k).w / 2, k)).toBe('water');
  });

  it('at the riverfront the only water is the river, which runs on into the bay', () => {
    for (const biome of BIOMES) {
      const L = land('2026-10-16', 480, { biome }), m = L.river(1);
      for (let x = 0; x < 480; x++) expect(L.cover(x, 1) === 'water', `${biome} ${x}`).toBe(x >= m.x && x < m.x + m.w);
    }
  });

  it('lifts the ground on screen, flat at the riverfront, never up into the top of the sky', () => {
    const L = land('2026-10-16', 480, { biome: 'alpine' });
    expect(liftAt(L, 200, 1)).toBe(0);
    for (let x = 0; x < 480; x += 5) expect(70 - liftAt(L, x, 0)).toBeGreaterThanOrEqual(24);
  });
});
