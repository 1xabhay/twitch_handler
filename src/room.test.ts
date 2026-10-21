import { describe, expect, it } from 'vitest';
import { roomPlan } from './room.ts';

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
});
