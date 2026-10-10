import type { Chatter } from '../greet.ts';

// Server side: who shows up as a builder. Anyone who chatted in the last 30 min, unless they !leave.
export const ACTIVE_MS = 30 * 60_000;
export type Crowd = Readonly<Record<string, { name: string; lastSeen: number; hidden: boolean }>>;

export const handleCrowd = (crowd: Crowd, { userId, userName }: Chatter, text: string, now: number): Crowd => {
  const cmd = text.trim().toLowerCase();
  const hidden = cmd === '!leave' ? true : cmd === '!join' ? false : (crowd[userId]?.hidden ?? false);
  return { ...crowd, [userId]: { name: userName, lastSeen: now, hidden } };
};

export const activeBuilders = (crowd: Crowd, now: number) =>
  Object.entries(crowd)
    .filter(([, v]) => !v.hidden && now - v.lastSeen < ACTIVE_MS)
    .map(([id, v]) => ({ id, name: v.name }));

// Overlay side: one step of a builder's little life. Walk to your scaffolding and hammer;
// with nothing to build, rest a few seconds, then wander somewhere random.
export type Walker = { x: number; target: number; mode: 'walk' | 'hammer' | 'idle'; until: number };
type Step = { dt: number; now: number; home: number | null; rand: () => number; width: number };
const SPEED = 12; // px per second

export const stepWalker = (w: Walker, { dt, now, home, rand, width }: Step): Walker => {
  if (w.mode === 'idle' && home === null) {
    return now < w.until ? w : { ...w, mode: 'walk', target: rand() * width };
  }
  const target = home ?? w.target;
  const dist = target - w.x;
  const move = (SPEED * dt) / 1000;
  if (Math.abs(dist) <= move) {
    return home !== null
      ? { ...w, x: target, target, mode: 'hammer' }
      : { ...w, x: target, target, mode: 'idle', until: now + 2000 + rand() * 6000 };
  }
  return { ...w, x: w.x + Math.sign(dist) * move, target, mode: 'walk' };
};
