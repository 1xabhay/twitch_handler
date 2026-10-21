import { createHash } from 'node:crypto';

// obs-websocket v5 (built into OBS 28+): lets scripts drive OBS while the streamer stays at the desk.
const b64sha = (s: string) => createHash('sha256').update(s).digest('base64');
export const obsAuth = (password: string, salt: string, challenge: string) => b64sha(b64sha(password + salt) + challenge);

// macOS camera inputs: 'macos-avcapture' (OBS 30+), 'av_capture_input' (older).
export const cameraInput = (inputs: { inputName: string; inputKind: string }[]) =>
  inputs.find((i) => /avcapture|av_capture/.test(i.inputKind))?.inputName ?? null;

// Cameras macOS sees right now, from `system_profiler SPCameraDataType`: name + current unique ID.
export const cameras = (profile: string) =>
  [...profile.matchAll(/^ {4}(\S.*):\n(?:.*\n)*? +Unique ID: (\S+)/gm)].map(([, name, id]) => ({ name, id }));

// OBS keeps the camera's unique ID, and the GoPro Webcam app hands out a new one on every reconnect, so OBS shows
// a blank camera until someone re-picks it by name. Same name, other ID: re-point OBS at the current one.
export const cameraFix = (saved: { device: string; device_name: string }, cams: { name: string; id: string }[]) => {
  const now = cams.find((c) => c.name === saved.device_name);
  return now && now.id !== saved.device ? { device: now.id, device_name: now.name } : null;
};
