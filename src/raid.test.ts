import { describe, expect, it } from 'vitest';
import { raidPicks } from './raid.ts';

const now = Date.parse('2026-10-15T18:00:00Z');
const s = (userName: string, viewers: number, hoursIn = 1, userId = userName) => ({ userId, userName, viewers, startDate: new Date(now - hoursIn * 3_600_000) });

describe('raidPicks', () => {
  it('suggests the three smallest live streams, skipping ourselves and big channels', () => {
    const r = raidPicks([s('big', 400), s('me', 2), s('cozy', 6, 3), s('tiny', 2), s('empty', 0), s('mid', 12), s('also', 20)], 'me', now)!;
    expect(r).toBe('🚌 raid ideas: tiny (2 watching, 1h in) · cozy (6 watching, 3h in) · mid (12 watching, 1h in)');
  });

  it('says so when nobody small is live', () => {
    expect(raidPicks([s('big', 400)], 'me', now)).toContain('no small');
  });
});
