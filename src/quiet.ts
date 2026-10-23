// Stream-only Spotify (docs/SPOTIFY-STREAM-ONLY.md): a muted process tap keeps Spotify off the Mac speakers while
// OBS still captures it. The talking scene keeps the room music, at a quarter (Spotify's own volume lowers both).
export const roomMuted = (scene: string) => scene !== 'Notfocussed';

// The default output device in `system_profiler SPAudioDataType`. A tap and OBS's app capture both bind to the output
// at start and go stale when it changes (headphones, a removed virtual device), so the switch resets both.
export const defaultOutput = (report: string) =>
  report.match(/^ {8}([^\n]+):\n\n(?: {10}[^\n]*\n)*? {10}Default Output Device: Yes/m)?.[1] ?? '';

// Spotify's volume while talking (Notfocussed): a quarter of the volume it had, never fully silent.
export const talkVolume = (full: number) => (full > 0 ? Math.max(1, Math.round(full / 4)) : 0);

// The volume to restore after talking. Spotify reads back a step under what was set, so a reading within 2 of the
// last restored volume is that volume, not a change.
export const fullVolume = (read: number, last: number | null) => (last !== null && Math.abs(read - last) <= 2 ? last : read);
