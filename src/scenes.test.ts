import { describe, expect, it } from 'vitest';
import { sceneSpec } from './scenes.ts';

describe('sceneSpec', () => {
  const spec = sceneSpec({ camera: 'Video Capture Device', audio: ['Mic/Aux', 'Spotify'], town: 'http://localhost:3001/town' });
  const scene = (name: string) => spec.find((s) => s.name === name)!;
  const visible = (name: string) => scene(name).items.filter((i) => i.transform);

  it('Focus: the real camera full frame with the slim city band (bottom view, pinned), nothing else', () => {
    const f = visible('Focus');
    expect(f.map((i) => i.source)).toEqual(['Video Capture Device', 'City band']);
    expect(f[0].transform).toEqual({ positionX: 0, positionY: 0, scaleX: 1, scaleY: 1 });
  });
  it('Break: the full pixel city, the camera small in the top right so the skyline stays clear', () => {
    const b = visible('Break');
    expect(b.map((i) => i.source)).toEqual(['City full', 'Video Capture Device']);
    expect(b[1].transform).toEqual({ positionX: 1920 - 480 - 32, positionY: 32, scaleX: 0.25, scaleY: 0.25 });
  });
  it('the mic and music play in both scenes', () => {
    for (const s of spec) expect(s.items.map((i) => i.source)).toEqual(expect.arrayContaining(['Mic/Aux', 'Spotify']));
  });
  it('the two city views are pinned browser sources, so !view cannot move them', () => {
    expect(sceneInputs()).toEqual([
      { name: 'City band', url: 'http://localhost:3001/town?bg=0' },
      { name: 'City full', url: 'http://localhost:3001/town?bg=city' },
    ]);
    function sceneInputs() { return spec.flatMap((s) => s.inputs); }
  });
});
