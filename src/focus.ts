import { E } from './emotes.ts';
// Focus timer for co-working streams. Research and preset rationale: docs/FOCUS.md.
export type Kind = 'kickoff' | 'focus' | 'break' | 'lunch' | 'replan' | 'recap';
export type Phase = { kind: Kind; min: number };
export type Timer = { preset: Preset; startedAt: number; pausedAt: number | null } | null;

const f = (min: number): Phase => ({ kind: 'focus', min });
const b = (min: number): Phase => ({ kind: 'break', min });
const pomodoroCycle = [f(25), b(5), f(25), b(5), f(25), b(5), f(25), b(15)];

export const PRESETS = {
  // 50/10 on the hour, lunch at 4h, lighter afternoon (post-lunch dip), recap at the end. 8 h total.
  shift: [
    { kind: 'kickoff', min: 10 }, f(50), b(10), f(50), b(10), f(50), b(10), f(50),
    { kind: 'lunch', min: 60 }, { kind: 'replan', min: 10 }, f(50), b(10), f(50), b(10), f(40), { kind: 'recap', min: 10 },
  ],
  pomodoro: [...pomodoroCycle, ...pomodoroCycle],
  deep: [f(90), b(20), f(90), { kind: 'lunch', min: 60 }, f(90), b(20), f(90)],
} satisfies Record<string, Phase[]>;
export type Preset = keyof typeof PRESETS;

const MIN = 60_000;
const isPreset = (s: string): s is Preset => Object.hasOwn(PRESETS, s);
const startOf = (phases: Phase[], i: number) => phases.slice(0, i).reduce((t, p) => t + p.min * MIN, 0);

export const current = (timer: Timer, now: number) => {
  if (!timer) return null;
  const phases: Phase[] = PRESETS[timer.preset];
  const elapsed = (timer.pausedAt ?? now) - timer.startedAt;
  let end = 0;
  for (const [i, phase] of phases.entries()) {
    end += phase.min * MIN;
    if (elapsed < end) {
      const focusBlocks = phases.filter((p) => p.kind === 'focus').length;
      const n = phases.slice(0, i + 1).filter((p) => p.kind === 'focus').length;
      const focusMin = phases.slice(0, i).reduce((t, p) => t + (p.kind === 'focus' ? p.min : 0), 0);
      return {
        i, phase, leftMs: end - elapsed, next: phases[i + 1] ?? null,
        block: { n, of: focusBlocks }, focusMin, breakNo: phases.slice(0, i).filter((p) => p.kind === 'break').length,
        paused: timer.pausedAt !== null,
      };
    }
  }
  return null;
};
export type Current = NonNullable<ReturnType<typeof current>>;

// Break prompts rotate, strongest evidence first (movement, relaxation, distance view, water, social).
const BREAKS = [
  'stand up & walk around for a few 🚶', 'one minute of slow breathing or a stretch 🧘', 'look far away, out a window if you can 🌳',
  'grab some water 💧', 'say hi in chat 👋',
];
// What chat has done so far, for the break cheer. opened = the landmark that just opened, already spelled out.
export type Wins = { built: number; landmarks: number; finished: string[]; opened?: string };
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const cheer = (c: Current, w: Wins) => [
  `🎉 block ${c.block.n}/${c.block.of} done, ${c.focusMin} min of focus so far!`,
  ...(w.built || w.landmarks ? [`${count(w.built, 'building', 'buildings')} lit${w.landmarks ? ` + ${count(w.landmarks, 'landmark', 'landmarks')}` : ''} today`] : []),
  ...(w.opened ? [`${w.opened} just opened on the skyline 🏛️`] : []),
  ...(w.finished.length ? [`${w.finished.map((n) => `@${n}`).join(' ')} finished something this block 💪`] : []),
].join(' · ');

export const announce = (c: Current | null, wins: Wins = { built: 0, landmarks: 0, finished: [] }): string => {
  if (!c) return 'shift complete 🎉 great work everyone';
  const mins = Math.round(c.leftMs / MIN);
  switch (c.phase.kind) {
    case 'kickoff': return `kickoff ☕ post your goals with !task, first focus block in ${mins} min`;
    case 'focus': return `focus on ${E.lockin} block ${c.block.n}/${c.block.of} · ${mins} min. heads down, chat stays chill`;
    case 'break': return `${cheer(c, wins)} · ${E.cozy} ${mins} min break: ${BREAKS[c.breakNo % BREAKS.length]} skip the feeds & email`;
    case 'lunch': return `${cheer(c, wins)} · lunch 🍜 ${mins} min, do whatever recharges you (a walk outside is great) ${E.grass}`;
    case 'replan': return `afternoon re-plan 📝 check your list with !tasks, pick lighter work for after lunch`;
    case 'recap': return `recap 🏁 share one win in chat! unfinished buildings wait for next time`;
  }
};

// !timer (anyone) shows status; !timer start [preset] | pause | resume | skip | stop (mods/broadcaster).
export const handleTimer = (timer: Timer, { isMod }: { isMod: boolean }, text: string, now: number) => {
  const [, sub = '', arg = ''] = text.trim().match(/^!timer(?:\s+(\w+))?(?:\s+(\w+))?\s*$/i) ?? [];
  if (!/^!timer\b/i.test(text.trim())) return null;
  const keep = (reply: string) => ({ timer, reply });

  if (!sub) {
    const c = current(timer, now);
    if (!c) return keep('no timer running. mods: !timer start [shift|pomodoro|deep]');
    const next = c.next ? ` · then ${c.next.kind}` : '';
    return keep(`⏱️ ${c.phase.kind}${c.phase.kind === 'focus' ? ` ${c.block.n}/${c.block.of}` : ''} · ${Math.ceil(c.leftMs / MIN)} min left${next}${c.paused ? ' (paused)' : ''}`);
  }
  if (!isMod) return keep('only mods can control the timer. !timer shows where we are');

  switch (sub.toLowerCase()) {
    case 'start': {
      const preset = (arg || 'shift').toLowerCase();
      if (!isPreset(preset)) return keep(`presets: ${Object.keys(PRESETS).join(', ')}`);
      const next: Timer = { preset, startedAt: now, pausedAt: null };
      return { timer: next, reply: announce(current(next, now)) };
    }
    case 'pause':
      return timer && !timer.pausedAt ? { timer: { ...timer, pausedAt: now }, reply: '⏸️ timer paused' } : keep('nothing to pause');
    case 'resume':
      return timer?.pausedAt ? { timer: { ...timer, startedAt: timer.startedAt + now - timer.pausedAt, pausedAt: null }, reply: '▶️ timer resumed' } : keep('nothing to resume');
    case 'skip': {
      const c = current(timer, now);
      if (!timer || !c) return keep('nothing to skip');
      const at = timer.pausedAt ?? now;
      const next: Timer = { ...timer, startedAt: at - startOf(PRESETS[timer.preset], c.i + 1) };
      return { timer: next, reply: announce(current(next, now)) };
    }
    case 'stop':
      return { timer: null, reply: '⏹️ timer stopped' };
    default:
      return keep('try: !timer start [shift|pomodoro|deep] · pause · resume · skip · stop');
  }
};

// OBS scene per phase: one thing on screen at a time. Breaks hand the stage to the pixel city, the rest is the camera.
export const sceneFor = (kind: Kind | null) => (kind === 'break' || kind === 'lunch' ? 'Break' : 'Focus');
