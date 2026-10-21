import { describe, expect, it } from 'vitest';
import { obsAuth, cameraInput } from './obs.ts';

describe('obs-websocket', () => {
  it('answers the auth challenge: base64(sha256(base64(sha256(password + salt)) + challenge))', () => {
    expect(obsAuth('supersecret', 'salt123', 'challenge456')).toBe('V8pVriFPEtnaK7wzQPlqOgkXegTAwSevsIeJLiFx/Nw=');
  });
  it('finds the camera among the inputs (macOS video capture device)', () => {
    const inputs = [
      { inputName: 'town', inputKind: 'browser_source' },
      { inputName: 'Mic/Aux', inputKind: 'coreaudio_input_capture' },
      { inputName: 'GoPro', inputKind: 'macos-avcapture' },
    ];
    expect(cameraInput(inputs)).toBe('GoPro');
    expect(cameraInput([{ inputName: 'old', inputKind: 'av_capture_input' }])).toBe('old');
    expect(cameraInput(inputs.slice(0, 2))).toBeNull();
  });
});
