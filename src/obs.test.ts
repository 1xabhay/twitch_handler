import { describe, expect, it } from 'vitest';
import { cameraFix, cameraInput, cameras, obsAuth } from './obs.ts';

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

describe('cameras / cameraFix', () => {
  // system_profiler SPCameraDataType, trimmed from this Mac
  const profile = `Camera:

    HERO11 Black:

      Model ID: HERO11 Black
      Unique ID: 5C86A230-C0BE-414B-97A3-E7A8B735D259

    FaceTime HD Camera:

      Model ID: FaceTime HD Camera
      Unique ID: 3F45E80A-0176-46F7-B185-BB9E2C0E82E3
`;
  it('reads the name and current unique ID of each camera macOS sees', () => {
    expect(cameras(profile)).toEqual([
      { name: 'HERO11 Black', id: '5C86A230-C0BE-414B-97A3-E7A8B735D259' },
      { name: 'FaceTime HD Camera', id: '3F45E80A-0176-46F7-B185-BB9E2C0E82E3' },
    ]);
  });
  it('re-points OBS at the same camera by name when its saved ID is gone (the GoPro gets a new ID on every reconnect)', () => {
    expect(cameraFix({ device: 'C89D6CAC-9436-4ECA-AA4A-E14705CC60DC', device_name: 'HERO11 Black' }, cameras(profile)))
      .toEqual({ device: '5C86A230-C0BE-414B-97A3-E7A8B735D259', device_name: 'HERO11 Black' });
  });
  it('leaves a working or unknown camera alone', () => {
    expect(cameraFix({ device: '5C86A230-C0BE-414B-97A3-E7A8B735D259', device_name: 'HERO11 Black' }, cameras(profile))).toBeNull();
    expect(cameraFix({ device: 'X', device_name: 'Unplugged Cam' }, cameras(profile))).toBeNull();
  });
});
