import { createHash } from 'node:crypto';

// obs-websocket v5 (built into OBS 28+): lets scripts drive OBS while the streamer stays at the desk.
const b64sha = (s: string) => createHash('sha256').update(s).digest('base64');
export const obsAuth = (password: string, salt: string, challenge: string) => b64sha(b64sha(password + salt) + challenge);

// macOS camera inputs: 'macos-avcapture' (OBS 30+), 'av_capture_input' (older).
export const cameraInput = (inputs: { inputName: string; inputKind: string }[]) =>
  inputs.find((i) => /avcapture|av_capture/.test(i.inputKind))?.inputName ?? null;
