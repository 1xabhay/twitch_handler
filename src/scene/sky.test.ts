import { describe, expect, it } from 'vitest';
import { horizontal, lst, skyAt, STARS } from './sky.ts';

const PHILLY = { lat: 39.95, lon: -75.17 };
const star = (name: string) => STARS.find((s) => s.name === name)!;

describe('lst (local sidereal time, degrees)', () => {
  it('matches the J2000 reference at Greenwich', () => {
    expect(lst(new Date('2000-01-01T12:00:00Z'), 0)).toBeCloseTo(280.46, 1);
  });
  it('shifts with longitude', () => {
    const t = new Date('2026-10-15T00:00:00Z');
    expect((lst(t, 0) - lst(t, -75.17) + 360) % 360).toBeCloseTo(75.17, 5);
  });
});

describe('horizontal (RA/Dec → azimuth from north, altitude)', () => {
  it('Polaris sits due north at the latitude, any time', () => {
    for (const iso of ['2026-10-15T02:00:00Z', '2026-10-15T14:00:00Z']) {
      const { az, alt } = horizontal(star('Polaris'), new Date(iso), PHILLY);
      expect(alt).toBeGreaterThan(PHILLY.lat - 1.5);
      expect(alt).toBeLessThan(PHILLY.lat + 1.5);
      expect(Math.min(az, 360 - az)).toBeLessThan(2);
    }
  });
  it('a star at dec = latitude passes overhead when it transits', () => {
    const t = new Date('2026-10-15T04:00:00Z');
    const { alt } = horizontal({ ra: lst(t, PHILLY.lon), dec: PHILLY.lat }, t, PHILLY);
    expect(alt).toBeCloseTo(90, 3);
  });
});

describe('skyAt (Philly)', () => {
  it('equinox noon: the sun is due south, 90 - latitude high', () => {
    const { sun } = skyAt(new Date('2026-03-20T17:05:00Z'), PHILLY);
    expect(Math.abs(sun.az - 180)).toBeLessThan(5);
    expect(Math.abs(sun.alt - 50)).toBeLessThan(2);
  });
  it('only lists stars above the horizon, and lines only join listed stars', () => {
    const { stars, lines } = skyAt(new Date('2026-10-16T02:00:00Z'), PHILLY);
    expect(stars.length).toBeGreaterThan(5);
    expect(stars.every((s) => s.alt > 0)).toBe(true);
    expect(lines.flat().every((i) => i >= 0 && i < stars.length)).toBe(true);
  });
  it('an October evening shows the Summer Triangle going west', () => {
    const names = skyAt(new Date('2026-10-16T01:00:00Z'), PHILLY).stars.map((s) => s.name); // 9 pm EDT
    expect(names).toEqual(expect.arrayContaining(['Vega', 'Deneb', 'Altair']));
  });
  it('moon phase runs 0 (new) to 1 and lit fraction 0 to 1', () => {
    const { moon } = skyAt(new Date('2026-10-15T12:00:00Z'), PHILLY);
    expect(moon.phase).toBeGreaterThanOrEqual(0); expect(moon.phase).toBeLessThan(1);
    expect(moon.lit).toBeGreaterThanOrEqual(0); expect(moon.lit).toBeLessThanOrEqual(1);
  });
});
