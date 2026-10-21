import { describe, expect, it } from 'vitest';
import { PRESETS, announce, current, handleTimer, type Timer } from './focus.ts';

const MIN = 60_000;
const mod = { isMod: true };
const viewer = { isMod: false };

describe('PRESETS', () => {
  it('shift is an 8-hour day: kickoff, 7 focus blocks, lunch, recap', () => {
    const total = PRESETS.shift.reduce((t, p) => t + p.min, 0);
    expect(total).toBe(8 * 60);
    expect(PRESETS.shift[0]!.kind).toBe('kickoff');
    expect(PRESETS.shift.at(-1)!.kind).toBe('recap');
    expect(PRESETS.shift.filter((p) => p.kind === 'focus')).toHaveLength(7);
    expect(PRESETS.shift.filter((p) => p.kind === 'lunch')).toHaveLength(1);
  });

  it('pomodoro is 25/5 with a long break after every 4th focus', () => {
    const p = PRESETS.pomodoro;
    expect(p.slice(0, 2).map((x) => [x.kind, x.min])).toEqual([['focus', 25], ['break', 5]]);
    expect(p[7]).toEqual({ kind: 'break', min: 15 });
  });

  it('deep is 90/20 blocks', () => {
    expect(PRESETS.deep.slice(0, 2).map((x) => [x.kind, x.min])).toEqual([['focus', 90], ['break', 20]]);
  });
});

describe('current', () => {
  const t0: Timer = { preset: 'shift', startedAt: 0, pausedAt: null };

  it('knows the phase, time left, next phase and focus block number', () => {
    const c = current(t0, 15 * MIN)!;
    expect(c.phase.kind).toBe('focus');
    expect(c.leftMs).toBe(45 * MIN);
    expect(c.next?.kind).toBe('break');
    expect(c.block).toEqual({ n: 1, of: 7 });
  });

  it('is null when the schedule is over or no timer runs', () => {
    expect(current(t0, 8 * 60 * MIN)).toBeNull();
    expect(current(null, 0)).toBeNull();
  });

  it('freezes while paused', () => {
    const paused: Timer = { ...t0, pausedAt: 15 * MIN };
    expect(current(paused, 40 * MIN)!.leftMs).toBe(45 * MIN);
  });
});

describe('handleTimer', () => {
  it('ignores other messages', () => {
    expect(handleTimer(null, mod, 'hello', 0)).toBeNull();
  });

  it('only mods/broadcaster can control it', () => {
    const r = handleTimer(null, viewer, '!timer start', 0);
    expect(r?.timer).toBeNull();
  });

  it('starts the shift preset by default, or a named one', () => {
    expect(handleTimer(null, mod, '!timer start', 5)?.timer).toEqual({ preset: 'shift', startedAt: 5, pausedAt: null });
    expect(handleTimer(null, mod, '!timer start pomodoro', 5)?.timer?.preset).toBe('pomodoro');
  });

  it('rejects unknown presets', () => {
    const r = handleTimer(null, mod, '!timer start nope', 5);
    expect(r?.timer).toBeNull();
    expect(r?.reply).toMatch(/shift.*pomodoro.*deep/);
  });

  it('pause then resume shifts the start so no time is lost', () => {
    const started = handleTimer(null, mod, '!timer start', 0)!.timer;
    const paused = handleTimer(started, mod, '!timer pause', 10 * MIN)!.timer;
    const resumed = handleTimer(paused, mod, '!timer resume', 30 * MIN)!.timer!;
    expect(resumed).toEqual({ preset: 'shift', startedAt: 20 * MIN, pausedAt: null });
    expect(current(resumed, 30 * MIN)!.leftMs).toBe(current(started, 10 * MIN)!.leftMs);
  });

  it('skip jumps to the start of the next phase', () => {
    const started = handleTimer(null, mod, '!timer start', 0)!.timer;
    const skipped = handleTimer(started, mod, '!timer skip', 3 * MIN)!.timer!;
    const c = current(skipped, 3 * MIN)!;
    expect(c.phase.kind).toBe('focus');
    expect(c.leftMs).toBe(50 * MIN);
  });

  it('stop clears it', () => {
    const started = handleTimer(null, mod, '!timer start', 0)!.timer;
    expect(handleTimer(started, mod, '!timer stop', 1)?.timer).toBeNull();
  });

  it('anyone can ask what phase it is', () => {
    const started = handleTimer(null, mod, '!timer start', 0)!.timer;
    const r = handleTimer(started, viewer, '!timer', 15 * MIN)!;
    expect(r.timer).toBe(started);
    expect(r.reply).toMatch(/focus.*45/i);
  });
});

describe('break messages celebrate the work so far', () => {
  const at = (min: number) => current({ preset: 'pomodoro', startedAt: 0, pausedAt: null }, min * MIN)!;

  it('leads with blocks and focus minutes done, then the break', () => {
    const r = announce(at(25 * 3 + 10), { built: 0, landmarks: 0, finished: [] }); // 3rd break, just started
    expect(r).toMatch(/^🎉 block 3\/8 done, 75 min of focus so far/);
    expect(r).toContain('5 min break');
  });

  it('counts what got built today, cheers who finished this block, names a new landmark', () => {
    const r = announce(at(26), { built: 5, landmarks: 1, finished: ['sam', 'jo'], opened: 'a fountain' });
    expect(r).toContain('5 buildings lit + 1 landmark today');
    expect(r).toContain('a fountain just opened on the skyline');
    expect(r).toContain('@sam @jo finished something');
    expect(announce(at(26), { built: 1, landmarks: 0, finished: [] })).toContain('1 building lit today');
  });

  it('lunch after focus celebrates too', () => {
    const lunch = current({ preset: 'deep', startedAt: 0, pausedAt: null }, (90 + 20 + 90 + 1) * MIN)!;
    expect(announce(lunch, { built: 2, landmarks: 0, finished: [] })).toMatch(/^🎉 block 2\/4 done, 180 min.*lunch/);
  });
});
