import { describe, expect, it } from 'vitest';
import { LADDER, handleWorkout, nextWorkout, redeem, type Gym } from './workout.ts';

const MIN = 60_000;
const empty: Gym = { pending: [], doneAt: [], enabled: true };
const sam = { userId: '1', userName: 'sam' };
const redemption = (rewardTitle: string) => ({ id: 'r1', rewardId: 'w1', rewardTitle, userName: 'sam' });

describe('ladder', () => {
  it('gets pricier each tier and ends with shadow boxing', () => {
    const costs = LADDER.map((t) => t.cost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
    expect(LADDER.at(-1)!.name).toMatch(/shadow box/i);
    expect(LADDER).toHaveLength(5);
  });
});

describe('redeem (a Channel Points reward was bought)', () => {
  it('ignores rewards that are not workouts', () => {
    expect(redeem(empty, redemption('Hydrate!'))).toBeNull();
  });

  it('queues the exercise for the next break, credited to the viewer', () => {
    const r = redeem(empty, redemption(LADDER[1]!.name))!;
    expect(r.accepted).toBe(true);
    expect(r.gym.pending).toEqual([{ name: LADDER[1]!.name, by: ['sam'], redemption: { rewardId: 'w1', id: 'r1' } }]);
    expect(r.reply).toContain('@sam');
    expect(r.reply).toMatch(/next break/);
  });

  it('refunds while the meter is paused', () => {
    const off = { ...empty, enabled: false };
    const r = redeem(off, redemption(LADDER[0]!.name))!;
    expect(r.accepted).toBe(false);
    expect(r.gym).toBe(off);
    expect(r.reply).toMatch(/refund/);
  });
});

describe('handleWorkout', () => {
  it('ignores other messages', () => {
    expect(handleWorkout(empty, sam, false, 'hi')).toBeNull();
    expect(handleWorkout(empty, sam, false, '!workouts')).toBeNull();
  });

  it('!workout shows the queue and points to Channel Points', () => {
    const queued = redeem(empty, redemption(LADDER[0]!.name))!.gym;
    const r = handleWorkout(queued, sam, false, '!workout')!;
    expect(r.gym).toBe(queued);
    expect(r.reply).toContain(LADDER[0]!.name);
    expect(r.reply).toMatch(/channel points/i);
  });

  it('mods can pause and resume it', () => {
    const off = handleWorkout(empty, sam, true, '!workout off')!.gym;
    expect(off.enabled).toBe(false);
    expect(handleWorkout(off, sam, true, '!workout on')!.gym.enabled).toBe(true);
  });

  it('viewers cannot pause it', () => {
    expect(handleWorkout(empty, sam, false, '!workout off')!.gym.enabled).toBe(true);
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
