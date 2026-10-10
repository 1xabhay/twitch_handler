import { describe, expect, it } from 'vitest';
import { ACTIVE_MS, activeBuilders, handleCrowd, stepWalker, type Walker } from './crowd.ts';

const sam = { userId: '1', userName: 'sam' };

describe('handleCrowd', () => {
  it('any chat message makes you an active builder', () => {
    const crowd = handleCrowd({}, sam, 'hello', 1000);
    expect(activeBuilders(crowd, 2000)).toEqual([{ id: '1', name: 'sam' }]);
  });

  it('builders go home after 30 quiet minutes', () => {
    const crowd = handleCrowd({}, sam, 'hello', 0);
    expect(activeBuilders(crowd, ACTIVE_MS - 1)).toHaveLength(1);
    expect(activeBuilders(crowd, ACTIVE_MS)).toHaveLength(0);
  });

  it('!leave hides you even while chatting; !join brings you back', () => {
    let crowd = handleCrowd({}, sam, '!leave', 0);
    crowd = handleCrowd(crowd, sam, 'still chatting', 10);
    expect(activeBuilders(crowd, 20)).toHaveLength(0);
    crowd = handleCrowd(crowd, sam, '!join', 30);
    expect(activeBuilders(crowd, 40)).toHaveLength(1);
  });

  it('does not mutate the previous crowd', () => {
    const before = handleCrowd({}, sam, 'hi', 0);
    handleCrowd(before, sam, '!leave', 5);
    expect(activeBuilders(before, 10)).toHaveLength(1);
  });
});

describe('stepWalker', () => {
  const base: Walker = { x: 100, target: 100, mode: 'idle', until: 0 };
  const opts = { dt: 1000, now: 0, home: null, rand: () => 0.5, width: 480 };

  it('walks toward its own scaffolding at a steady pace', () => {
    const w = stepWalker(base, { ...opts, home: 200 });
    expect(w.x).toBeGreaterThan(100);
    expect(w.x).toBeLessThan(200);
    expect(w.mode).toBe('walk');
  });

  it('hammers once it reaches its scaffolding', () => {
    expect(stepWalker({ ...base, x: 199.5 }, { ...opts, home: 200 }).mode).toBe('hammer');
  });

  it('never overshoots the target', () => {
    expect(stepWalker({ ...base, x: 195 }, { ...opts, home: 200 }).x).toBe(200);
  });

  it('with nothing to build: rests, then wanders to a random spot', () => {
    const arrived = stepWalker({ ...base, mode: 'walk' }, opts);
    expect(arrived.mode).toBe('idle');
    expect(arrived.until).toBeGreaterThan(0);
    const still = stepWalker(arrived, { ...opts, now: arrived.until - 1 });
    expect(still.mode).toBe('idle');
    const off = stepWalker(arrived, { ...opts, now: arrived.until, rand: () => 0.9 });
    expect(off.mode).toBe('walk');
    expect(off.target).toBeCloseTo(0.9 * 480);
  });
});
