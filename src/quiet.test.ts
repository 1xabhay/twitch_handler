import { describe, expect, it } from 'vitest';
import { roomMuted } from './quiet.ts';

describe('roomMuted', () => {
  it('keeps Spotify off the Mac speakers while the mic is off (Focus, Break)', () => {
    expect(roomMuted('Focus')).toBe(true);
    expect(roomMuted('Break')).toBe(true);
  });
  it('lets Spotify play in the room in Notfocussed, the talking scene', () => {
    expect(roomMuted('Notfocussed')).toBe(false);
  });
});
