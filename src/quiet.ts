// Stream-only Spotify (docs/SPOTIFY-STREAM-ONLY.md): a muted process tap keeps Spotify off the Mac speakers while
// OBS still captures it. The talking scene keeps the room music, at 7/16 (Spotify's own volume lowers both).
// `roomMusic` = the scene's "Room music" item is visible in OBS (an eye to click: Spotify on the speakers in Focus too).
export const roomMuted = (scene: string, roomMusic = false) => scene !== 'Notfocussed' && !roomMusic;

// The default output device in `system_profiler SPAudioDataType`. A tap and OBS's app capture both bind to the output
// at start and go stale when it changes (headphones, a removed virtual device), so the switch resets both.
export const defaultOutput = (report: string) =>
  report.match(/^ {8}([^\n]+):\n\n(?: {10}[^\n]*\n)*? {10}Default Output Device: Yes/m)?.[1] ?? '';

// Spotify's volume while talking (Notfocussed): 7/16 of the volume it had (1/4 and 3/8 were too quiet on stream), never fully silent.
export const talkVolume = (full: number) => (full > 0 ? Math.max(1, Math.round((full * 7) / 16)) : 0);

// The volume to restore after talking. Spotify reads back a step under what was set, so a reading within 2 of the
// last restored volume is that volume, not a change.
export const fullVolume = (read: number, last: number | null) => (last !== null && Math.abs(read - last) <= 2 ? last : read);

// Watchdog for OBS's Spotify capture: it sometimes goes silent and stays silent while Spotify plays on (trigger unknown;
// re-pointing the source always revives it). Re-point after 10 s of silence (input peak under -60 dB) while Spotify
// plays above volume 0, then wait 30 s before trying again.
type Watch = { silentSince: number | null; lastFix: number };
type Reading = { playing: boolean; volume: number; peak: number; now: number };
const SILENT = 0.001, AFTER = 10_000, COOLDOWN = 30_000;
export const captureWatch = {
  start: { silentSince: null, lastFix: -Infinity } as Watch,
  step: (w: Watch, { playing, volume, peak, now }: Reading): { state: Watch; repoint: boolean } => {
    if (!playing || volume <= 0 || peak >= SILENT) return { state: { ...w, silentSince: null }, repoint: false };
    const since = w.silentSince ?? now;
    return now - since >= AFTER && now - w.lastFix >= COOLDOWN
      ? { state: { silentSince: now, lastFix: now }, repoint: true }
      : { state: { ...w, silentSince: since }, repoint: false };
  },
};
