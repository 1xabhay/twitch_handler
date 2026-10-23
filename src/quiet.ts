// Stream-only Spotify (docs/SPOTIFY-STREAM-ONLY.md): a muted process tap keeps Spotify off the Mac speakers while
// OBS still captures it. The talking scene keeps the room music (turn the Mac volume down, not Spotify's: Spotify's
// own slider lowers the stream too).
export const roomMuted = (scene: string) => scene !== 'Notfocussed';

// The default output device in `system_profiler SPAudioDataType`. A tap and OBS's app capture both bind to the output
// at start and go stale when it changes (headphones, a removed virtual device), so the switch resets both.
export const defaultOutput = (report: string) =>
  report.match(/^ {8}([^\n]+):\n\n(?: {10}[^\n]*\n)*? {10}Default Output Device: Yes/m)?.[1] ?? '';
