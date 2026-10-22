import { describe, expect, it } from 'vitest';
import { sceneSpec } from './scenes.ts';

describe('sceneSpec', () => {
  const spec = sceneSpec({ camera: 'Video Capture Device', audio: ['Mic/Aux', 'Spotify'], town: 'http://localhost:3001/town' });
  const scene = (name: string) => spec.find((s) => s.name === name)!;
  const visible = (name: string) => scene(name).items.filter((i) => i.transform);

  it('Focus: the real camera full frame, the skyline as a strip along the desk line, the timer as a tall panel over the kitchen clutter behind the right shoulder', () => {
    const f = visible('Focus');
    expect(f.map((i) => i.source)).toEqual(['Video Capture Device', 'City band', 'Timer']);
    expect(f[0].transform).toEqual({ positionX: 0, positionY: 0, scaleX: 1, scaleY: 1 });
    // cropped to the bottom 280 px: no sky haze over the camera, no clock floating mid-frame (seen live 2026-10-21)
    expect(f[1].transform).toEqual({ positionX: 0, positionY: 800, scaleX: 1, scaleY: 1, cropTop: 800 });
    // covers the microwave and cartons top left, stops before the face (seen live 2026-10-22)
    expect(f[2].transform).toEqual({ positionX: 0, positionY: 40, scaleX: 1, scaleY: 1 });
  });
  it('Break: the full pixel city alone, no camera (streamer pick: the break belongs to the city)', () => {
    expect(visible('Break').map((i) => i.source)).toEqual(['City full']);
  });
  it('the mic and music play in both scenes', () => {
    for (const s of spec) expect(s.items.map((i) => i.source)).toEqual(expect.arrayContaining(['Mic/Aux', 'Spotify']));
  });
  it('the city views are pinned browser sources (so !view cannot move them), plus the timer card', () => {
    expect(sceneInputs()).toEqual([
      { name: 'City band', url: 'http://localhost:3001/town?bg=0&sky=0', width: 1920, height: 1080 },
      { name: 'Timer', url: 'http://localhost:3001/timer?tall', width: 380, height: 480 },
      { name: 'City full', url: 'http://localhost:3001/town?bg=city', width: 1920, height: 1080 },
    ]);
    function sceneInputs() { return spec.flatMap((s) => s.inputs); }
  });
});
