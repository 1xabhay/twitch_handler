// Stream-only Spotify (docs/SPOTIFY-STREAM-ONLY.md): a muted process tap keeps Spotify off the Mac speakers while
// OBS still captures it. The talking scene keeps the room music (turn the Mac volume down, not Spotify's: Spotify's
// own slider lowers the stream too).
export const roomMuted = (scene: string) => scene !== 'Notfocussed';
