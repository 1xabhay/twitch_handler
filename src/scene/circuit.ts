// Control logic for the street: named signals wired through AND / OR / NOT gates.
// Inputs are facts about the city (night, rain, what's unlocked); outputs switch street things on and off.
import type { Weather } from './ambient.ts';

export type Gate = { op: 'and' | 'or' | 'not'; in: readonly string[] };
export type Circuit = Readonly<Record<string, Gate>>;

// Every gate's value. Unknown signals read false; a loop reads false where it closes instead of hanging.
export const evaluate = (c: Circuit, inputs: Readonly<Record<string, boolean>>) => {
  const out: Record<string, boolean> = { ...inputs }, busy = new Set<string>();
  const val = (name: string): boolean => {
    if (name in out) return out[name]!;
    const g = c[name];
    if (!g || busy.has(name)) return false;
    busy.add(name);
    const v = g.in.map(val);
    busy.delete(name);
    return (out[name] = g.op === 'and' ? v.every(Boolean) : g.op === 'or' ? v.some(Boolean) : !v[0]);
  };
  Object.keys(c).forEach(val);
  return out;
};

export const streetInputs = ({ night, weather, life, built }: { night: boolean; weather: Weather; life: readonly string[]; built: number }) => ({
  night, rain: weather === 'rain', snow: weather === 'snow', built: built > 0,
  ...Object.fromEntries(life.map((what) => [`${what}Unlocked`, true])),
});

export const STREET: Circuit = {
  wet: { op: 'or', in: ['rain', 'snow'] },
  dry: { op: 'not', in: ['wet'] },
  day: { op: 'not', in: ['night'] },
  lamps: { op: 'or', in: ['night', 'wet'] },
  boats: { op: 'and', in: ['boatsUnlocked'] },
  cart: { op: 'and', in: ['cartUnlocked', 'dry'] },
  balloon: { op: 'and', in: ['balloonUnlocked', 'day'] },
  power: { op: 'or', in: ['built'] }, // the line under the promenade, fed by finished buildings
};
