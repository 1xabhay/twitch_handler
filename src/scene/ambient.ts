// Pure ambient-scene rules, shared by tests and the browser overlay (served type-stripped).

export type Phase = 'night' | 'dawn' | 'day' | 'dusk';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'clear' | 'rain' | 'snow';

export const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

export const phaseAt = (hour: number): Phase =>
  hour < 5 || hour >= 21 ? 'night' : hour < 7 ? 'dawn' : hour < 18 ? 'day' : 'dusk';

// ponytail: northern hemisphere only; add a hemisphere setting if someone streams from the south.
export const seasonOf = (month: number): Season =>
  (['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'] as const)[month]!;

// ~1 in 6 days is wet; the same date always gives the same weather.
export const weatherOn = (date: string, season: Season): Weather =>
  hash(date) % 6 !== 0 ? 'clear' : season === 'winter' ? 'snow' : 'rain';

// x position of a drifting thing (cloud, bird) at time t ms; wraps with a 30px margin.
export const drift = (seed: number, t: number, width: number, pxPerSec: number) => {
  const span = width + 60;
  return ((((seed * 137 + (t / 1000) * pxPerSec) % span) + span) % span) - 30;
};

// The cat naps on one roof, hopping to another every 10 minutes.
export const catRoof = (buildings: number, t: number) =>
  buildings ? hash(String(Math.floor(t / 600_000))) % buildings : null;
