import { describe, expect, it } from 'vitest';
import { LADDER, WELCOME, earnChat, earnDone, earnPresence, handleWorkout, nextWorkout, type Gym } from './workout.ts';

const MIN = 60_000;
const empty: Gym = { wallet: {}, lastChat: {}, meter: 0, tier: 0, contributors: {}, pending: [], doneAt: [], enabled: true };
const sam = { userId: '1', userName: 'sam' };
const rich = (n: number, g: Gym = empty): Gym => ({ ...g, wallet: { '1': n } });

describe('earning bricks', () => {
  it('first chat gives the welcome bonus, then +1 at most once a minute', () => {
    let g = earnChat(empty, '1', 0);
    expect(g.wallet['1']).toBe(WELCOME);
    g = earnChat(g, '1', 30_000);
    expect(g.wallet['1']).toBe(WELCOME);
    g = earnChat(g, '1', MIN);
    expect(g.wallet['1']).toBe(WELCOME + 1);
  });

  it('presence and finished floors add bricks', () => {
    expect(earnPresence(rich(3), ['1', '2']).wallet).toEqual({ '1': 8, '2': 5 });
    expect(earnDone(rich(3), '1').wallet['1']).toBe(13);
  });

  it('does not mutate the previous state', () => {
    const g = rich(3);
    earnDone(g, '1');
    expect(g.wallet['1']).toBe(3);
  });
});

describe('ladder', () => {
  it('gets harder each tier and ends with shadow boxing', () => {
    const costs = LADDER.map((t) => t.cost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
    expect(LADDER.at(-1)!.name).toMatch(/shadow box/i);
    expect(LADDER).toHaveLength(5);
  });
});

describe('handleWorkout', () => {
  it('ignores other messages', () => {
    expect(handleWorkout(empty, sam, false, 'hi')).toBeNull();
    expect(handleWorkout(empty, sam, false, '!workouts')).toBeNull();
  });

  it('!workout shows the meter and your balance', () => {
    const r = handleWorkout(rich(42), sam, false, '!workout')!;
    expect(r.gym).toEqual(rich(42));
    expect(r.reply).toMatch(/42/);
    expect(r.reply).toMatch(new RegExp(LADDER[0]!.name));
  });

  it('!bricks shows your balance', () => {
    expect(handleWorkout(rich(7), sam, false, '!bricks')!.reply).toMatch(/7/);
  });

  it('spending moves bricks from your wallet into the meter', () => {
    const r = handleWorkout(rich(40), sam, false, '!workout 30')!;
    expect(r.gym.wallet['1']).toBe(10);
    expect(r.gym.meter).toBe(30);
    expect(r.gym.contributors).toEqual({ sam: 30 });
  });

  it('you can only spend what you have', () => {
    const r = handleWorkout(rich(20), sam, false, '!workout 999')!;
    expect(r.gym.wallet['1']).toBe(0);
    expect(r.gym.meter).toBe(20);
  });

  it('filling a tier queues that exercise, credits contributors, and moves up the ladder', () => {
    const r = handleWorkout(rich(60), sam, false, `!workout ${LADDER[0]!.cost + 5}`)!;
    expect(r.gym.pending).toEqual([{ name: LADDER[0]!.name, by: ['sam'] }]);
    expect(r.gym.tier).toBe(1);
    expect(r.gym.meter).toBe(5); // leftover rolls into the next tier
    expect(r.gym.contributors).toEqual({ sam: 5 });
  });

  it('after the ultimate the ladder starts over', () => {
    const top: Gym = { ...rich(1000), tier: LADDER.length - 1 };
    const r = handleWorkout(top, sam, false, `!workout ${LADDER.at(-1)!.cost}`)!;
    expect(r.gym.pending.at(-1)!.name).toMatch(/shadow box/i);
    expect(r.gym.tier).toBe(0);
  });

  it('mods can switch it off; then nobody can spend', () => {
    const off = handleWorkout(rich(50), sam, true, '!workout off')!.gym;
    expect(off.enabled).toBe(false);
    expect(handleWorkout(off, sam, false, '!workout 10')!.gym).toBe(off);
    expect(handleWorkout(off, sam, true, '!workout on')!.gym.enabled).toBe(true);
  });

  it('viewers cannot switch it off', () => {
    expect(handleWorkout(rich(5), sam, false, '!workout off')!.gym.enabled).toBe(true);
  });
});

describe('nextWorkout', () => {
  const queued: Gym = { ...empty, pending: [{ name: 'a', by: [] }, { name: 'b', by: [] }] };

  it('waits for a break', () => {
    expect(nextWorkout(queued, 0, false).workout).toBeNull();
  });

  it('pops the oldest queued workout at a break and records it', () => {
    const r = nextWorkout(queued, 5, true);
    expect(r.workout?.name).toBe('a');
    expect(r.gym.pending).toHaveLength(1);
    expect(r.gym.doneAt).toEqual([5]);
  });

  it('leaves at least 10 minutes between workouts (one per break)', () => {
    const r = nextWorkout(queued, 0, true);
    expect(nextWorkout(r.gym, 9 * MIN, true).workout).toBeNull();
    expect(nextWorkout(r.gym, 10 * MIN, true).workout?.name).toBe('b');
  });

  it('respects the cap of 2 per hour', () => {
    const tired: Gym = { ...queued, doneAt: [0, 10 * MIN] };
    expect(nextWorkout(tired, 30 * MIN, true).workout).toBeNull();
    expect(nextWorkout(tired, 60 * MIN + 1, true).workout?.name).toBe('a');
  });
});
