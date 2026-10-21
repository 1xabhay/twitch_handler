import { describe, expect, it } from 'vitest';
import { catRoof, drift, phaseAt, phaseFromSun, seasonOf, weatherOn, weatherOfCode, celestial, project, carrier } from './ambient.ts';

describe('phaseAt (local hour)', () => {
  it.each([
    [0, 'night'], [4, 'night'], [5, 'dawn'], [6, 'dawn'], [7, 'day'],
    [12, 'day'], [17, 'day'], [18, 'dusk'], [20, 'dusk'], [21, 'night'], [23, 'night'],
  ])('%i:00 is %s', (h, phase) => expect(phaseAt(h)).toBe(phase));
});

describe('seasonOf (month 0-11, northern hemisphere)', () => {
  it.each([
    [0, 'winter'], [1, 'winter'], [2, 'spring'], [4, 'spring'], [5, 'summer'],
    [7, 'summer'], [8, 'autumn'], [10, 'autumn'], [11, 'winter'],
  ])('month %i is %s', (m, s) => expect(seasonOf(m)).toBe(s));
});

describe('weatherOn', () => {
  const days = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10));

  it('is the same all day (deterministic per date)', () => {
    expect(weatherOn('2026-10-10', 'autumn')).toBe(weatherOn('2026-10-10', 'autumn'));
  });

  it('is mostly clear, sometimes not', () => {
    const wet = days.filter((d) => weatherOn(d, 'autumn') !== 'clear').length;
    expect(wet).toBeGreaterThan(20);
    expect(wet).toBeLessThan(120);
  });

  it('snows only in winter and never rains in winter', () => {
    expect(days.some((d) => weatherOn(d, 'summer') === 'snow')).toBe(false);
    expect(days.some((d) => weatherOn(d, 'winter') === 'rain')).toBe(false);
    expect(days.some((d) => weatherOn(d, 'winter') === 'snow')).toBe(true);
  });
});

describe('weatherOfCode (real weather, WMO codes from Open-Meteo)', () => {
  it('drizzle, rain, showers and storms rain; snow falls; the rest is clear', () => {
    expect([0, 3, 45].map(weatherOfCode)).toEqual(['clear', 'clear', 'clear']);
    expect([51, 61, 67, 80, 95, 99].map(weatherOfCode)).toEqual(Array(6).fill('rain'));
    expect([71, 77, 85, 86].map(weatherOfCode)).toEqual(Array(4).fill('snow'));
  });
});

describe('drift (clouds/birds moving across and wrapping)', () => {
  it('moves right over time', () => {
    expect(drift(0, 10_000, 480, 2)).toBeGreaterThan(drift(0, 0, 480, 2));
  });

  it('always stays within [-margin, width + margin)', () => {
    for (let t = 0; t < 1_000_000; t += 7919) {
      const x = drift(3, t, 480, 5);
      expect(x).toBeGreaterThanOrEqual(-30);
      expect(x).toBeLessThan(510);
    }
  });

  it('spreads different seeds apart', () => {
    expect(drift(1, 0, 480, 2)).not.toBe(drift(2, 0, 480, 2));
  });
});

describe('catRoof', () => {
  it('returns null with no buildings', () => expect(catRoof(0, 0)).toBeNull());

  it('stays on one roof for a while, then may move', () => {
    const tenMin = 10 * 60_000;
    expect(catRoof(5, 1000)).toBe(catRoof(5, 2000));
    const spots = new Set(Array.from({ length: 50 }, (_, i) => catRoof(5, i * tenMin)));
    expect(spots.size).toBeGreaterThan(1);
    for (const s of spots) expect(s).toBeGreaterThanOrEqual(0), expect(s).toBeLessThan(5);
  });
});

describe('phaseFromSun (real sunrise/sunset)', () => {
  const at = (hhmm: string) => new Date(`2026-12-15T${hhmm}:00-05:00`).getTime();
  const sun = { dawn: at('06:46'), sunrise: at('07:16'), sunset: at('16:37'), dusk: at('17:08') };
  it.each([
    ['05:00', 'night'], ['06:50', 'dawn'], ['07:30', 'dawn'], ['12:00', 'day'],
    ['16:20', 'dusk'], ['17:00', 'dusk'], ['17:30', 'night'], ['23:00', 'night'],
  ])('%s mid-December, US East Coast is %s', (t, phase) => expect(phaseFromSun(at(t), sun)).toBe(phase));
});

describe('celestial', () => {
  const H = 3_600_000, sun = { sunrise: 6 * H, sunset: 18 * H }; // a day on a simple clock
  it('the sun crosses the sky from sunrise to sunset', () => {
    expect(celestial(6 * H, sun)).toEqual({ body: 'sun', f: 0 });
    expect(celestial(12 * H, sun)).toEqual({ body: 'sun', f: 0.5 });
  });
  it('the moon crosses the night, after sunset and before sunrise', () => {
    expect(celestial(18 * H, sun)).toEqual({ body: 'moon', f: 0 });
    expect(celestial(24 * H, sun)).toEqual({ body: 'moon', f: 0.5 }); // midnight, after sunset
    expect(celestial(0, sun)).toEqual({ body: 'moon', f: 0.5 }); // same midnight, seen from before sunrise
  });
});

describe('project (sky panorama: north at both edges, south in the middle)', () => {
  const box = { width: 360, top: 0, bottom: 90 };
  it('maps azimuth across and altitude up', () => {
    expect(project({ az: 180, alt: 0 }, box)).toEqual({ x: 180, y: 90 });
    expect(project({ az: 90, alt: 45 }, box)).toEqual({ x: 90, y: 45 });
    expect(project({ az: 270, alt: 90 }, box)).toEqual({ x: 270, y: 0 });
  });
});

describe('carrier (what the focus timer rides)', () => {
  const up = { az: 100, alt: 20 }, down = { az: 100, alt: -5 };
  const stars = [{ name: 'dim', az: 10, alt: 30, mag: 2 }, { name: 'Vega', az: 280, alt: 40, mag: 0 }];
  it('the sun when it is up', () => expect(carrier({ sun: up, moon: up, stars })).toEqual({ body: 'sun', ...up }));
  it('else the moon when it is up', () => expect(carrier({ sun: down, moon: up, stars })).toEqual({ body: 'moon', ...up }));
  it('else the brightest star in view', () => expect(carrier({ sun: down, moon: down, stars })).toEqual({ body: 'star', az: 280, alt: 40 }));
  it('nothing when the sky is empty', () => expect(carrier({ sun: down, moon: down, stars: [] })).toBeNull());
});
