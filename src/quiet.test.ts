import { describe, expect, it } from 'vitest';
import { defaultOutput, roomMuted } from './quiet.ts';

describe('roomMuted', () => {
  it('keeps Spotify off the Mac speakers while the mic is off (Focus, Break)', () => {
    expect(roomMuted('Focus')).toBe(true);
    expect(roomMuted('Break')).toBe(true);
  });
  it('lets Spotify play in the room in Notfocussed, the talking scene', () => {
    expect(roomMuted('Notfocussed')).toBe(false);
  });
});

describe('defaultOutput', () => {
  const report = (out: string) => `Audio:\n\n    Devices:\n\n        MacBook Pro Microphone:\n\n          Default Input Device: Yes\n          Input Channels: 1\n\n` +
    `        Background Music:\n\n${out === 'Background Music' ? '          Default Output Device: Yes\n' : ''}          Output Channels: 2\n\n` +
    `        MacBook Pro Speakers:\n\n${out === 'MacBook Pro Speakers' ? '          Default Output Device: Yes\n' : ''}          Output Channels: 2\n`;
  // Uninstalling Background Music moved the output to the speakers: the tap and OBS's capture both went stale.
  it('names the default output device from system_profiler SPAudioDataType, not the default input', () => {
    expect(defaultOutput(report('MacBook Pro Speakers'))).toBe('MacBook Pro Speakers');
    expect(defaultOutput(report('Background Music'))).toBe('Background Music');
  });
  it('is empty when no device is the default output', () => {
    expect(defaultOutput(report(''))).toBe('');
  });
});
