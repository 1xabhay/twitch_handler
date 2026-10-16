// Workout Meter: viewers spend Channel Points on an exercise for the streamer, done at the next break
// (movement breaks: docs/FOCUS.md), capped per hour. One Channel Points reward per rung, titled with its name.
import type { Chatter } from './greet.ts';

export const LADDER = [
  { name: '20 jumping jacks', cost: 400 },
  { name: '20 squats', cost: 800 },
  { name: '15 push-ups', cost: 1200 },
  { name: '10 burpees', cost: 2000 },
  { name: '🥊 2 min shadow boxing', cost: 3200 },
];
const CAP = 2, HOUR = 60 * 60_000, GAP = 10 * 60_000;

// redemption: which Channel Points redemption to mark fulfilled once it's done
export type Workout = { name: string; by: string[]; redemption?: { rewardId: string; id: string } };
export type Gym = { pending: Workout[]; doneAt: number[]; enabled: boolean };
export type Redemption = { id: string; rewardId: string; rewardTitle: string; userName: string };

const queue = (g: Gym) => g.pending.length ? `${g.pending.length} queued for the next break: ${g.pending.map((w) => w.name).join(', ')}` : 'nothing queued';
export const status = (g: Gym) => `🏋️ ${queue(g)} · buy a workout with Channel Points`;

// null = not a workout reward. accepted false = refund it (meter paused).
export const redeem = (g: Gym, r: Redemption) => {
  const rung = LADDER.find((t) => t.name === r.rewardTitle);
  if (!rung) return null;
  if (!g.enabled) return { gym: g, accepted: false, reply: `@${r.userName} the workout meter is paused, your points are refunded 😮‍💨` };
  const gym = { ...g, pending: [...g.pending, { name: rung.name, by: [r.userName], redemption: { rewardId: r.rewardId, id: r.id } }] };
  return { gym, accepted: true, reply: `@${r.userName} bought ${rung.name} 💪 coming up at the next break · ${queue(gym)}` };
};

// !workout · mods: !workout off|on
export const handleWorkout = (g: Gym, { userName }: Chatter, isMod: boolean, text: string) => {
  const m = text.trim().match(/^!workout(?:\s+(\S+))?\s*$/i);
  if (!m) return null;
  const arg = (m[1] ?? '').toLowerCase();
  const keep = (reply: string) => ({ gym: g, reply: `@${userName} ${reply}` });
  if (arg === 'off' || arg === 'on') {
    if (!isMod) return keep('only mods can switch the workout meter');
    const enabled = arg === 'on';
    return { gym: { ...g, enabled }, reply: enabled ? '🏋️ workout meter is ON' : '😮‍💨 workout meter paused' };
  }
  return keep(g.enabled ? status(g) : 'the workout meter is paused right now 😮‍💨');
};

// At a break (or anytime when no focus timer runs): the oldest queued workout, unless the hourly cap is reached.
export const nextWorkout = (g: Gym, now: number, atBreak: boolean): { gym: Gym; workout: Workout | null } => {
  const recent = g.doneAt.filter((t) => now - t < HOUR);
  if (!atBreak || !g.pending.length || recent.length >= CAP || now - (recent.at(-1) ?? -Infinity) < GAP) return { gym: g, workout: null };
  const [workout, ...pending] = g.pending;
  return { gym: { ...g, pending, doneAt: [...recent, now] }, workout: workout! };
};
