// Anime room backdrop: a camera frame of the room, stylized by AnimeGANv2 (docker/anime), shown behind the streamer
// in OBS (Background Removal on the camera, the image below it). One picture, not a per-frame filter: steady, no
// flicker, no GPU. With --watch it repaints when the room changes for good (light, things moved), see watchStep.
export const IMAGE = 'twitch-handler-anime';

const USAGE = 'usage: npm run room -- <name> [photo | --watch]   (name: lowercase letters, digits, dashes)';

export const roomPlan = (argv: string[], { data, camera }: { data: string; camera: string }) => {
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
    // Photo in on stdin, picture out on stdout: works whatever folders Docker/Colima shares.
    stylize: ['run', '--rm', '-i', IMAGE],
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

// base = the thumbnail the current picture was painted from; since = when the room started looking different.
// A change must last `settle` ms to count: you moving or walking past is brief, a lamp or daylight stays.
// ponytail: whole-frame diff, so you leaving for a minute repaints the empty room; mask the person (Background
// Removal alpha) if that flip-flop shows.
export type Watch = { base: Uint8Array | null; since: number | null };
export const watchStep = (s: Watch, thumb: Uint8Array, now: number, { threshold, settle }: { threshold: number; settle: number }) => {
  if (!s.base) return { s: { base: thumb, since: null }, restyle: true };
  if (change(s.base, thumb) < threshold) return { s: { ...s, since: null }, restyle: false };
  const since = s.since ?? now;
  return now - since >= settle ? { s: { base: thumb, since: null }, restyle: true } : { s: { ...s, since }, restyle: false };
};
