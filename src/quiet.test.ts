import { describe, expect, it } from 'vitest';
import { captureWatch, defaultOutput, fullVolume, roomMuted, talkVolume } from './quiet.ts';

describe('roomMuted', () => {
  it('keeps Spotify off the Mac speakers while the mic is off (Focus, Break)', () => {
    expect(roomMuted('Focus')).toBe(true);
    expect(roomMuted('Break')).toBe(true);
  });
  it('lets Spotify play in the room in Notfocussed, the talking scene', () => {
    expect(roomMuted('Notfocussed')).toBe(false);
  });
  it('lets Spotify play in the room in any scene while its "Room music" eye is on in OBS', () => {
    expect(roomMuted('Focus', true)).toBe(false);
    expect(roomMuted('Break', true)).toBe(false);
    expect(roomMuted('Focus', false)).toBe(true);
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

describe('talkVolume', () => {
  it('drops Spotify to a quarter while talking (room and stream together: OBS captures after the app volume)', () => {
    expect(talkVolume(100)).toBe(25);
    expect(talkVolume(66)).toBe(17);
  });
  it('never mutes a quiet song completely', () => {
    expect(talkVolume(2)).toBe(1);
    expect(talkVolume(0)).toBe(0);
  });
});

describe('fullVolume', () => {
  // Spotify reads back one step under what was set (66 → 65 → 64 …): restoring the read value drifts down.
  it('keeps the volume it restored last when Spotify reads back a step or two under it', () => {
    expect(fullVolume(65, 66)).toBe(66);
    expect(fullVolume(64, 66)).toBe(66);
  });
  it('takes a real change by the streamer', () => {
    expect(fullVolume(100, 66)).toBe(100);
    expect(fullVolume(40, 66)).toBe(40);
    expect(fullVolume(65, null)).toBe(65);
  });
});

describe('captureWatch', () => {
  // OBS's Spotify capture sometimes goes silent and stays silent while Spotify plays on (seen 3 times live; the trigger is
  // unknown, re-pointing the source always brings it back). Watch the input peak and re-point after 10 s of silence.
  const playing = { playing: true, volume: 100 }, quiet = 0.0001, loud = 0.2;
  const run = (steps: { at: number; peak: number; playing?: boolean; volume?: number }[]) => {
    let state = captureWatch.start, fixes: number[] = [];
    for (const { at, peak, ...rest } of steps) {
      const r = captureWatch.step(state, { ...playing, ...rest, peak, now: at });
      state = r.state; if (r.repoint) fixes.push(at);
    }
    return fixes;
  };
  it('re-points once after 10 s of silence while Spotify plays', () => {
    expect(run([{ at: 0, peak: quiet }, { at: 5_000, peak: quiet }, { at: 10_000, peak: quiet }, { at: 11_000, peak: quiet }])).toEqual([10_000]);
  });
  it('leaves it alone while sound comes through, even with quiet gaps under 10 s', () => {
    expect(run([{ at: 0, peak: quiet }, { at: 6_000, peak: loud }, { at: 12_000, peak: quiet }, { at: 20_000, peak: quiet }])).toEqual([]);
  });
  it('never re-points while Spotify is paused or at volume 0 (silence is expected then)', () => {
    expect(run([{ at: 0, peak: quiet, playing: false }, { at: 20_000, peak: quiet, playing: false }])).toEqual([]);
    expect(run([{ at: 0, peak: quiet, volume: 0 }, { at: 20_000, peak: quiet, volume: 0 }])).toEqual([]);
  });
  it('waits 30 s before trying again if the silence goes on', () => {
    const steps = Array.from({ length: 13 }, (_, i) => ({ at: i * 5_000, peak: quiet }));
    expect(run(steps)).toEqual([10_000, 40_000]);
  });
});
