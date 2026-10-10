// Workout Meter: viewers earn 🧱 bricks and pour them into a shared meter. Each filled tier queues a harder
// exercise for the streamer, done at the next break (movement breaks: docs/FOCUS.md), capped per hour.
import type { Chatter } from './greet.ts';

export const LADDER = [
  { name: '20 jumping jacks', cost: 50 },
  { name: '20 squats', cost: 100 },
  { name: '15 push-ups', cost: 150 },
  { name: '10 burpees', cost: 250 },
  { name: '🥊 2 min shadow boxing', cost: 400 },
];
export const WELCOME = 20;
const PER_CHAT = 1, PER_PRESENCE = 5, PER_DONE = 10, CHAT_EVERY = 60_000;
const CAP = 2, HOUR = 60 * 60_000, GAP = 10 * 60_000;

type Wallet = Readonly<Record<string, number>>;
export type Workout = { name: string; by: string[] };
export type Gym = {
  wallet: Wallet; lastChat: Wallet; meter: number; tier: number;
  contributors: Wallet; pending: Workout[]; doneAt: number[]; enabled: boolean;
};

const add = (w: Wallet, id: string, n: number): Wallet => ({ ...w, [id]: (w[id] ?? 0) + n });

export const earnChat = (g: Gym, id: string, now: number): Gym => {
  if (!(id in g.wallet)) return { ...g, wallet: add(g.wallet, id, WELCOME), lastChat: { ...g.lastChat, [id]: now } };
  if (now - (g.lastChat[id] ?? -Infinity) < CHAT_EVERY) return g;
  return { ...g, wallet: add(g.wallet, id, PER_CHAT), lastChat: { ...g.lastChat, [id]: now } };
};
export const earnPresence = (g: Gym, ids: string[]): Gym => ({ ...g, wallet: ids.reduce((w, id) => add(w, id, PER_PRESENCE), g.wallet) });
export const earnDone = (g: Gym, id: string): Gym => ({ ...g, wallet: add(g.wallet, id, PER_DONE) });

// Pour bricks in; every tier the meter passes queues its exercise and credits the top 3 contributors.
const pour = (g: Gym, name: string, n: number): Gym => {
  let { meter, tier, contributors, pending } = g;
  meter += n;
  contributors = add(contributors, name, n);
  while (meter >= LADDER[tier]!.cost) {
    meter -= LADDER[tier]!.cost;
    const by = Object.entries(contributors).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([who]) => who);
    pending = [...pending, { name: LADDER[tier]!.name, by }];
    tier = (tier + 1) % LADDER.length;
    contributors = meter > 0 ? { [name]: meter } : {};
  }
  return { ...g, meter, tier, contributors, pending };
};

export const status = (g: Gym) => {
  const next = LADDER[g.tier]!;
  return `🏋️ meter ${g.meter}/${next.cost} → ${next.name}${g.pending.length ? ` · ${g.pending.length} queued for the next break` : ''}`;
};

// !workout [n] · !bricks · mods: !workout off|on
export const handleWorkout = (g: Gym, { userId, userName }: Chatter, isMod: boolean, text: string) => {
  const m = text.trim().match(/^!(workout|bricks)(?:\s+(\S+))?\s*$/i);
  if (!m) return null;
  const [, cmd, arg = ''] = m;
  const mine = g.wallet[userId] ?? 0;
  const keep = (reply: string) => ({ gym: g, reply: `@${userName} ${reply}` });

  if (cmd!.toLowerCase() === 'bricks') return keep(`you have ${mine} 🧱`);
  if (/^(off|on)$/i.test(arg)) {
    if (!isMod) return keep('only mods can switch the workout meter');
    const enabled = arg.toLowerCase() === 'on';
    return { gym: { ...g, enabled }, reply: enabled ? '🏋️ workout meter is ON' : '😮‍💨 workout meter paused' };
  }
  if (!arg) return keep(`${status(g)} · you have ${mine} 🧱 · !workout 20 to chip in`);
  if (!g.enabled) return keep('the workout meter is paused right now 😮‍💨');
  const n = Math.min(Number.parseInt(arg, 10) || 0, mine);
  if (n <= 0) return keep(`you have ${mine} 🧱. chat, hang out and finish !task floors to earn more`);
  const next = pour({ ...g, wallet: add(g.wallet, userId, -n) }, userName, n);
  const filled = next.pending.length - g.pending.length;
  return { gym: next, reply: `@${userName} poured ${n} 🧱${filled ? ` · tier filled! queued for the next break 💪` : ''} · ${status(next)}` };
};

// At a break (or anytime when no focus timer runs): the oldest queued workout, unless the hourly cap is reached.
export const nextWorkout = (g: Gym, now: number, atBreak: boolean): { gym: Gym; workout: Workout | null } => {
  const recent = g.doneAt.filter((t) => now - t < HOUR);
  if (!atBreak || !g.pending.length || recent.length >= CAP || now - (recent.at(-1) ?? -Infinity) < GAP) return { gym: g, workout: null };
  const [workout, ...pending] = g.pending;
  return { gym: { ...g, pending, doneAt: [...recent, now] }, workout: workout! };
};
