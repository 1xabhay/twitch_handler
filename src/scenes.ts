// The two OBS scenes of "real desk, pixel world": Focus = the real camera, full frame, with the pixel skyline as a strip
// along the desk line and the timer as a tall panel top left; Break = the full pixel city, no camera. The
// streamer switches by hand; scripts/obs-scenes.ts builds them. Items are listed bottom to top. Canvas 1920x1080.
type Transform = { positionX: number; positionY: number; scaleX: number; scaleY: number; cropTop?: number };
type Item = { source: string; transform?: Transform };
export type SceneSpec = { name: string; inputs: { name: string; url: string; width: number; height: number }[]; items: Item[] };

const FULL = { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1 };
// Only the bottom 280 px of the city: the sky haze and the sky clock would cover the camera (seen live 2026-10-21).
const STRIP = { positionX: 0, positionY: 800, scaleX: 1, scaleY: 1, cropTop: 800 };
// The tall timer panel covers the microwave and cartons behind the right shoulder, stops before the face (2026-10-22).
const TIMER = { positionX: 0, positionY: 40, scaleX: 1, scaleY: 1 };

export const sceneSpec = ({ camera, audio, town }: { camera: string; audio: string[]; town: string }): SceneSpec[] => [
  {
    name: 'Focus',
    inputs: [ // ?bg= pins the view, so !view cannot move it; sky=0 draws the buildings only
      { name: 'City band', url: `${town}?bg=0&sky=0`, width: 1920, height: 1080 },
      { name: 'Timer', url: town.replace(/\/town$/, '/timer?tall'), width: 380, height: 480 },
    ],
    items: [{ source: camera, transform: FULL }, { source: 'City band', transform: STRIP }, { source: 'Timer', transform: TIMER }, ...audio.map((source) => ({ source }))],
  },
  {
    name: 'Break',
    inputs: [{ name: 'City full', url: `${town}?bg=city`, width: 1920, height: 1080 }],
    items: [{ source: 'City full', transform: FULL }, ...audio.map((source) => ({ source }))],
  },
];
