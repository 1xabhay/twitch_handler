// Builds the Focus and Break scenes (src/scenes.ts) in the running OBS from your existing camera and audio sources.
// Usage: make obs-scenes   (OBS open, obs-websocket on). Only creates what is missing; your other scenes stay as they
// are, so going back is just picking the old scene. The bot then switches Focus/Break by timer phase.
import { cameraInput } from '../src/obs.ts';
import { obs } from '../src/obsws.ts';
import { sceneSpec } from '../src/scenes.ts';

const [{ inputs }, { scenes }] = await obs([['GetInputList', {}], ['GetSceneList', {}]]);
const camera = cameraInput(inputs) ?? (() => { throw new Error('no camera source in OBS'); })();
const audio = inputs.filter((i: any) => /audio|coreaudio|sck_audio/.test(i.inputKind)).map((i: any) => i.inputName);
const have = new Set([...inputs.map((i: any) => i.inputName), ...scenes.map((s: any) => s.sceneName)]);

for (const scene of sceneSpec({ camera, audio, town: 'http://localhost:3001/town' })) {
  if (have.has(scene.name)) { console.log(`${scene.name}: already there, left as is`); continue; }
  await obs([['CreateScene', { sceneName: scene.name }]]);
  for (const item of scene.items) { // bottom to top: each new item lands on top
    const web = scene.inputs.find((i) => i.name === item.source);
    const [{ sceneItemId }] = await obs([web
      ? ['CreateInput', { sceneName: scene.name, inputName: web.name, inputKind: 'browser_source', inputSettings: { url: web.url, width: 1920, height: 1080 } }]
      : ['CreateSceneItem', { sceneName: scene.name, sourceName: item.source }]]);
    if (item.transform) await obs([['SetSceneItemTransform', { sceneName: scene.name, sceneItemId, sceneItemTransform: item.transform }]]);
  }
  console.log(`${scene.name}: built (${scene.items.map((i) => i.source).join(', ')})`);
}
