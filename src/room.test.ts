import { describe, expect, it } from 'vitest';
import { deflateSync } from 'node:zlib';
import { change, coverage, pgm, pngAlpha, roomPlan, watchStep } from './room.ts';

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

describe('pngAlpha', () => {
  // Builds an RGBA PNG the way an encoder would: each row filtered (0 none, 1 sub, 2 up, 3 average, 4 paeth), then deflated.
  const paeth = (a: number, b: number, c: number) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  const png = (w: number, rows: number[][], filters: number[]) => {
    const s = w * 4;
    const body = rows.flatMap((row, y) => {
      const up = rows[y - 1] ?? new Array(s).fill(0);
      return [filters[y], ...row.map((v, x) => {
        const a = x >= 4 ? row[x - 4] : 0, b = up[x], c = x >= 4 ? up[x - 4] : 0;
        return (v - [0, a, b, (a + b) >> 1, paeth(a, b, c)][filters[y]] + 256) & 255;
      })];
    });
    const chunk = (type: string, data: Buffer) => {
      const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
      return Buffer.concat([len, Buffer.from(type), data, Buffer.alloc(4)]); // CRC unchecked by the reader
    };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(rows.length, 4); ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.from(body))), chunk('IEND', Buffer.alloc(0))]);
  };
  const rows = [[10, 20, 30, 0, 40, 50, 60, 255], [70, 80, 90, 200, 1, 2, 3, 128], [5, 6, 7, 9, 250, 251, 252, 77], [9, 9, 9, 30, 8, 8, 8, 31], [1, 2, 3, 4, 5, 6, 7, 8]];

  it('reads the alpha channel through every row filter', () => {
    expect([...pngAlpha(png(2, rows, [0, 1, 2, 3, 4]))]).toEqual([0, 255, 200, 128, 9, 77, 30, 31, 4, 8]);
  });
  it('refuses anything but 8-bit RGBA (what OBS sends)', () => {
    const p = png(2, rows, [0, 0, 0, 0, 0]); p[25] = 2; // colour type RGB
    expect(() => pngAlpha(p)).toThrow(/RGBA/);
  });
});

describe('coverage', () => {
  it('is the share of solid pixels: how much of the frame the cutout (you) fills', () => {
    expect(coverage(Uint8Array.from([0, 255, 200, 10]))).toBe(0.5);
  });
});

describe('watchStep', () => {
  const opts = { threshold: 12, settle: 60_000 };
  const room = Uint8Array.from([100, 100]), dusk = Uint8Array.from([50, 50]), moved = Uint8Array.from([100, 200]);
  const clear = new Uint8Array(2);
  const away = (thumb: Uint8Array) => ({ thumb, present: false, mask: clear }), here = (thumb: Uint8Array) => ({ thumb, present: true, mask: clear });
  const fresh = { base: null, since: null, clean: false };
  const clean = { base: room, since: null, clean: true };

  it('never paints while you are in frame, so no ghost of you ends up in the room', () => {
    expect(watchStep(fresh, here(room), 0, opts)).toEqual({ s: fresh, restyle: false });
    expect(watchStep({ ...clean, since: 0 }, here(moved), 90_000, opts)).toEqual({ s: clean, restyle: false });
  });
  it('paints the empty room once you have been away for the settle time', () => {
    const a = watchStep(fresh, away(room), 0, opts);
    expect(a).toEqual({ s: { ...fresh, since: 0 }, restyle: false });
    expect(watchStep(a.s, away(room), 30_000, opts).restyle).toBe(false);
    expect(watchStep(a.s, away(room), 60_000, opts)).toEqual({ s: clean, restyle: true });
  });
  it('a lighting change never repaints a clean picture: the light follows along instead', () => {
    const a = watchStep(clean, away(dusk), 0, opts);
    expect(a).toEqual({ s: clean, restyle: false });
    expect(watchStep(a.s, away(dusk), 120_000, opts).restyle).toBe(false);
  });
  it('something moved in the empty room repaints it once that has lasted the settle time', () => {
    const a = watchStep(clean, away(moved), 0, opts);
    expect(watchStep(a.s, away(moved), 60_000, opts)).toEqual({ s: { base: moved, since: null, clean: true }, restyle: true });
  });
  it('coming back before the settle time cancels the repaint', () => {
    const a = watchStep(fresh, away(room), 0, opts);
    const b = watchStep(a.s, here(room), 30_000, opts);
    expect(b).toEqual({ s: fresh, restyle: false });
    expect(watchStep(b.s, away(room), 60_000, opts).restyle).toBe(false); // the clock starts over
  });
});
