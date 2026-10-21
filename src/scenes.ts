// The two OBS scenes of "real desk, pixel world": Focus = the real camera, full frame, with the pixel skyline as a strip
// along the desk line and the timer small in a corner; Break = the full pixel city, camera small in a corner. The
// streamer switches by hand; scripts/obs-scenes.ts builds them. Items are listed bottom to top. Canvas 1920x1080.
type Transform = { positionX: number; positionY: number; scaleX: number; scaleY: number; cropTop?: number };
type Item = { source: string; transform?: Transform };
export type SceneSpec = { name: string; inputs: { name: string; url: string; width: number; height: number }[]; items: Item[] };

const FULL = { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1 };
const CORNER = { positionX: 1920 - 480 - 32, positionY: 32, scaleX: 0.25, scaleY: 0.25 }; // 480x270, 32 px margin
// Only the bottom 280 px of the city: the sky haze and the sky clock would cover the camera (seen live 2026-10-21).
const STRIP = { positionX: 0, positionY: 800, scaleX: 1, scaleY: 1, cropTop: 800 };
const TIMER = { positionX: 1920 - 300 - 24, positionY: 24, scaleX: 0.5, scaleY: 0.5 }; // the 600x200 card at half size

export const sceneSpec = ({ camera, audio, town }: { camera: string; audio: string[]; town: string }): SceneSpec[] => [
  {
    name: 'Focus',
    inputs: [ // ?bg= pins the view, so !view cannot move it; sky=0 draws the buildings only
      { name: 'City band', url: `${town}?bg=0&sky=0`, width: 1920, height: 1080 },
      { name: 'Timer', url: town.replace(/\/town$/, '/timer'), width: 600, height: 200 },
    ],
    items: [{ source: camera, transform: FULL }, { source: 'City band', transform: STRIP }, { source: 'Timer', transform: TIMER }, ...audio.map((source) => ({ source }))],
  },
  {
    name: 'Break',
    inputs: [{ name: 'City full', url: `${town}?bg=city`, width: 1920, height: 1080 }],
    items: [{ source: 'City full', transform: FULL }, { source: camera, transform: CORNER }, ...audio.map((source) => ({ source }))],
  },
];
