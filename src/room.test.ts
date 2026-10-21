import { describe, expect, it } from 'vitest';
import { change, pgm, roomPlan, watchStep } from './room.ts';

describe('roomPlan', () => {
  const data = '/repo/data';

  it('captures one frame from the camera, after the auto exposure settles', () => {
    const p = roomPlan(['desk'], { data, camera: 'HERO11 Black' });
    expect(p.photo).toBe('/repo/data/room-desk-photo.png');
    expect(p.capture).toEqual(['-y', '-f', 'avfoundation', '-framerate', '30', '-video_size', '1920x1080', '-i', 'HERO11 Black', '-ss', '2', '-frames:v', '1', '/repo/data/room-desk-photo.png']);
  });
  it('stylizes the photo in the anime container into data/room-<name>.png, piped through stdin/stdout (no shared folders)', () => {
    const p = roomPlan(['desk'], { data, camera: 'cam' });
    expect(p.out).toBe('/repo/data/room-desk.png');
    expect(p.stylize).toEqual(['run', '--rm', '-i', 'twitch-handler-anime']);
  });
  it('skips the camera when given a photo', () => {
    const p = roomPlan(['kitchen', '/Users/me/Pictures/kitchen.jpg'], { data, camera: 'cam' });
    expect(p.capture).toBeNull();
    expect(p.photo).toBe('/Users/me/Pictures/kitchen.jpg');
  });
  it('only takes simple room names, so the file always lands in data/', () => {
    for (const bad of [[], [''], ['../x'], ['a b'], ['Desk']]) expect(() => roomPlan(bad, { data, camera: 'cam' })).toThrow(/usage/);
  });
  it('--watch keeps it running, never with a fixed photo', () => {
    expect(roomPlan(['desk', '--watch'], { data, camera: 'cam' }).watch).toBe(true);
    expect(roomPlan(['desk'], { data, camera: 'cam' }).watch).toBe(false);
    expect(() => roomPlan(['desk', '/a.png', '--watch'], { data, camera: 'cam' })).toThrow(/usage/);
  });
});

describe('pgm', () => {
  it('reads the gray pixels of a binary PGM (what OBS sends for tiny thumbnails)', () => {
    const img = Buffer.concat([Buffer.from('P5\n3 2\n255\n'), Buffer.from([0, 10, 20, 30, 40, 255])]);
    expect([...pgm(img)]).toEqual([0, 10, 20, 30, 40, 255]);
  });
  it('reads 16-bit PGM too (what OBS 32 actually sends), scaled to 0-255', () => {
    const img = Buffer.concat([Buffer.from('P5\n2 1\n65535\n'), Buffer.from([0xff, 0xff, 0x80, 0x00])]);
    expect([...pgm(img)]).toEqual([255, 128]);
  });
  it('skips comment lines in the header', () => {
    expect([...pgm(Buffer.concat([Buffer.from('P5\n# by Qt\n2 1\n255\n'), Buffer.from([7, 8])]))]).toEqual([7, 8]);
  });
});

describe('change', () => {
  it('is the mean absolute difference, 0 to 255', () => {
    expect(change(Uint8Array.from([0, 0]), Uint8Array.from([0, 0]))).toBe(0);
    expect(change(Uint8Array.from([0, 100]), Uint8Array.from([50, 50]))).toBe(50);
  });
});

describe('watchStep', () => {
  const opts = { threshold: 12, settle: 60_000 };
  const same = Uint8Array.from([100, 100]), lamp = Uint8Array.from([160, 160]);
  const styled = { base: same, since: null };

  it('paints the first time', () => {
    expect(watchStep({ base: null, since: null }, same, 0, opts)).toEqual({ s: { base: same, since: null }, restyle: true });
  });
  it('ignores small changes (you shifting in your seat)', () => {
    expect(watchStep(styled, Uint8Array.from([105, 108]), 0, opts)).toEqual({ s: styled, restyle: false });
  });
  it('repaints once a big change has lasted the settle time, and the new look becomes the base', () => {
    const a = watchStep(styled, lamp, 0, opts);
    expect(a).toEqual({ s: { base: same, since: 0 }, restyle: false });
    expect(watchStep(a.s, lamp, 30_000, opts).restyle).toBe(false);
    expect(watchStep(a.s, lamp, 60_000, opts)).toEqual({ s: { base: lamp, since: null }, restyle: true });
  });
  it('forgets a big change that went away (walked past the camera)', () => {
    const a = watchStep(styled, lamp, 0, opts);
    expect(watchStep(a.s, same, 10_000, opts)).toEqual({ s: styled, restyle: false });
  });
});
