// The two OBS scenes of "real desk, pixel world": Focus = the real camera, full frame, with the slim pixel-city band;
// Break = the full pixel city, camera small in a corner. The streamer switches by hand; scripts/obs-scenes.ts builds
// them. Items are listed bottom to top. Canvas 1920x1080.
type Item = { source: string; transform?: { positionX: number; positionY: number; scaleX: number; scaleY: number } };
export type SceneSpec = { name: string; inputs: { name: string; url: string }[]; items: Item[] };

const FULL = { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1 };
const CORNER = { positionX: 1920 - 480 - 32, positionY: 32, scaleX: 0.25, scaleY: 0.25 }; // 480x270, 32 px margin

export const sceneSpec = ({ camera, audio, town }: { camera: string; audio: string[]; town: string }): SceneSpec[] => [
  {
    name: 'Focus',
    inputs: [{ name: 'City band', url: `${town}?bg=0` }], // ?bg= pins the view, so !view cannot move it
    items: [{ source: camera, transform: FULL }, { source: 'City band', transform: FULL }, ...audio.map((source) => ({ source }))],
  },
  {
    name: 'Break',
    inputs: [{ name: 'City full', url: `${town}?bg=city` }],
    items: [{ source: 'City full', transform: FULL }, { source: camera, transform: CORNER }, ...audio.map((source) => ({ source }))],
  },
];
