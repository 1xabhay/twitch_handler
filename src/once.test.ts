import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { onceADay } from './once.ts';

describe('onceADay', () => {
  const dir = mkdtempSync(join(tmpdir(), 'once-'));

  it('is true the first time a key comes up on a day, false after (a reconnect fires stream.online again)', async () => {
    expect(await onceADay(dir, 'golive', '2026-10-21')).toBe(true);
    expect(await onceADay(dir, 'golive', '2026-10-21')).toBe(false);
  });
  it('a new day or another key starts fresh', async () => {
    expect(await onceADay(dir, 'golive', '2026-10-22')).toBe(true);
    expect(await onceADay(dir, 'other', '2026-10-21')).toBe(true);
  });
});
