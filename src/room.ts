import { inflateSync } from 'node:zlib';
import { fitGain, residual } from './light.ts';

// Anime room backdrop: a camera frame of the room, painted anime (FLUX.2 klein via scripts/paint-flux.sh, ~80 s; or
// AnimeGANv2 in docker/anime, ~15 s, weaker), shown behind the streamer in OBS (a cutout on the camera, the image
// below it). One picture, not a per-frame filter: steady, no flicker. With --watch it repaints when the room changes for good (light, things moved), see watchStep.
export const IMAGE = 'twitch-handler-anime';

const USAGE = 'usage: npm run room -- <name> [photo | --watch]   (name: lowercase letters, digits, dashes)';

const PAINTERS = {
  flux: (scripts: string) => ({ cmd: 'sh', args: [`${scripts}/paint-flux.sh`] }),
  anime: () => ({ cmd: 'docker', args: ['run', '--rm', '-i', IMAGE] }),
};

export const roomPlan = (argv: string[], { data, camera, scripts, painter = 'flux' }: { data: string; camera: string; scripts: string; painter?: string }) => {
  if (!(painter in PAINTERS)) throw new Error(`unknown painter "${painter}": ${Object.keys(PAINTERS).join(', ')}`);
  const watch = argv.includes('--watch');
  const [name = '', from, ...rest] = argv.filter((a) => a !== '--watch');
  if (!/^[a-z0-9-]+$/.test(name) || (watch && from) || rest.length) throw new Error(USAGE);
  const photo = from ?? `${data}/room-${name}-photo.png`;
  return {
    photo,
    out: `${data}/room-${name}.png`,
    watch,
    // -ss 2 drops the first frames: the camera's exposure is still settling when ffmpeg opens it.
    capture: from ? null : ['-y', '-f', 'avfoundation', '-framerate', '30', '-video_size', '1920x1080', '-i', camera, '-ss', '2', '-frames:v', '1', photo],
    // Photo in on stdin, picture out on stdout, for every painter: no shared folders (Colima shares few).
    stylize: PAINTERS[painter as keyof typeof PAINTERS](scripts),
  };
};

// Binary PGM (P5): header "P5 w h max" with optional # comments, then one byte per pixel, or two (big-endian) when
// max > 255, which is what OBS 32 sends. Always returned as 0-255.
export const pgm = (buf: Buffer) => {
  let at = 0;
  const fields: string[] = [];
  while (fields.length < 4) {
    const end = buf.indexOf(0x0a, at);
    const line = buf.subarray(at, end).toString('latin1');
    at = end + 1;
    if (!line.startsWith('#')) fields.push(...line.trim().split(/\s+/).filter(Boolean));
  }
  const [w, h, max] = fields.slice(1, 4).map(Number);
  const wide = max > 255 ? 2 : 1;
  return Uint8Array.from({ length: w * h }, (_, i) => buf[at + i * wide]); // high byte of a 16-bit pixel = its 0-255 value
};

export const change = (a: Uint8Array, b: Uint8Array) => a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0) / a.length;

// Alpha channel of an 8-bit RGBA, non-interlaced PNG: the only screenshot format OBS keeps the Background Removal
// cutout in (pgm/ppm/bmp/ico all come back black). Chunk CRCs are not checked: the PNG comes from local OBS.
export const pngAlpha = (buf: Buffer) => {
  let at = 8, w = 0, h = 0;
  const idat: Buffer[] = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at), type = buf.toString('latin1', at + 4, at + 8), data = buf.subarray(at + 8, at + 8 + len);
    if (type === 'IHDR') {
      [w, h] = [data.readUInt32BE(0), data.readUInt32BE(4)];
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('pngAlpha reads 8-bit RGBA, non-interlaced only');
    }
    if (type === 'IDAT') idat.push(data);
    at += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), s = w * 4;
  let prev = new Uint8Array(s);
  const alpha = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (s + 1)], row = Uint8Array.from(raw.subarray(y * (s + 1) + 1, (y + 1) * (s + 1)));
    for (let x = 0; x < s; x++) {
      const a = x >= 4 ? row[x - 4] : 0, b = prev[x], c = x >= 4 ? prev[x - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      row[x] += [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
    }
    for (let x = 0; x < w; x++) alpha[y * w + x] = row[x * 4 + 3];
    prev = row;
  }
  return alpha;
};

export const coverage = (alpha: Uint8Array) => alpha.filter((v) => v > 128).length / alpha.length;

// base = the thumbnail of the empty room the picture was painted from; clean = painted with nobody in frame;
// since = when the reason to repaint began. Paints only while you are away (no ghost of you in the room), once
// you have been gone `settle` ms, and then only if the picture is dirty or something in the room moved. Light
// alone never repaints: residual() is what is left after the fitted gain, and the light follows along (light.ts).
export type Watch = { base: Uint8Array | null; since: number | null; clean: boolean };
export const watchStep = (s: Watch, { thumb, present, mask }: { thumb: Uint8Array; present: boolean; mask: Uint8Array }, now: number, { threshold, settle }: { threshold: number; settle: number }) => {
  const moved = (base: Uint8Array) => residual(base, thumb, mask, fitGain(base, thumb, mask)) >= threshold;
  const want = !present && (!s.base || !s.clean || moved(s.base));
  if (!want) return { s: { ...s, since: null }, restyle: false };
  const since = s.since ?? now;
  return now - since >= settle ? { s: { base: thumb, since: null, clean: true }, restyle: true } : { s: { ...s, since }, restyle: false };
};

// A cutout filling the frame has stopped cutting (obs-backgroundremoval after a camera dropout): the real room shows
// on stream. Nobody covers 95% of a desk camera.
export const stuckCutout = (coverage: number) => coverage > 0.95;

// FLUX shares the GPU with OBS: while live it waits (lighting still follows along); measured 30 → 22-29 fps per paint.
export const holdPaint = ({ painter, live }: { painter: string; live: boolean }) => painter === 'flux' && live;

// OBS sends all-black (transparent) frames for a camera it lost; a dark room still has sensor noise above 2.
export const blankFrame = (thumb: Uint8Array) => thumb.every((v) => v <= 2);
