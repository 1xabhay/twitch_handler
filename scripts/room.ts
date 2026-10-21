// Anime room backdrop: grabs the room from the camera and stylizes it (src/room.ts has the plan).
// Usage: npm run room -- <name> [photo | --watch]   → data/room-<name>.png, add it in OBS below the camera (docs/SETUP.md).
// --watch keeps going: a tiny thumbnail every 10 s, repaints when the room stays changed (src/room.ts watchStep).
// Paints only while you are away: ROOM_CUTOUT (the OBS source with Background Removal, default Camera) tells, you count
// as there above ROOM_PRESENT of the frame (default 0.05). ROOM_SETTLE: seconds away first (60). ROOM_CHANGE: how much
// must be left once the light is fitted to repaint a clean picture, i.e. something moved (0-255, default 6).
// Light follows along: a Color Correction filter "Room light" on ROOM_SOURCE (default Anime room) dims/brightens it.
// OBS open: asks it for the camera frame over obs-websocket (Tools → WebSocket Server Settings → Enable; password read
// from OBS's own config). OBS closed: ffmpeg grabs the camera (ROOM_CAMERA, default HERO11 Black).
// ROOM_PAINTER: flux (default, scripts/paint-flux.sh, needs mflux) or anime (Docker AnimeGANv2).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { cameraFix, cameraInput, cameras } from '../src/obs.ts';
import { obs, type Req } from '../src/obsws.ts';
import { ease, fitGain, lightFilter, residual } from '../src/light.ts';
import { IMAGE, blankFrame, coverage, holdPaint, pgm, pngAlpha, roomPlan, stuckCutout, watchStep, type Watch } from '../src/room.ts';

const data = resolve('data');
const argv = process.argv.slice(2).map((a, i) => (i === 1 && !a.startsWith('--') ? resolve(a) : a));
const plan = (() => { try { return roomPlan(argv, { data, camera: process.env.ROOM_CAMERA ?? 'HERO11 Black', scripts: resolve('scripts'), painter: process.env.ROOM_PAINTER }); } catch (e) { console.error((e as Error).message); process.exit(1); } })();
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: 'inherit' });

const image = (r: { imageData: string }) => Buffer.from(r.imageData.split(',')[1], 'base64');
// The camera as OBS renders it, unfiltered: Background Removal sits on a nested scene, not the camera (docs/SETUP.md).
const camera = (a: any[]) => cameraInput(a[0].inputs) ?? (() => { throw new Error('no camera source in OBS'); })();
const obsScreenshot = async () => image((await obs([['GetInputList', {}], (a) => ['GetSourceScreenshot', { sourceName: camera(a), imageFormat: 'png' }]]))[1]);

mkdirSync(data, { recursive: true });
if (plan.capture && !plan.watch) {
  for (let s = 5; s > 0; s--) { console.log(`hold still (or step out of frame)... ${s}`); await sleep(1000); }
  const shot = await obsScreenshot().catch((e) => (console.log(`OBS: ${e.message}`), null));
  if (shot) writeFileSync(plan.photo, shot);
  else try { run('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...plan.capture]); } catch {
    // macOS lets one app configure a camera at a time: OBS holds it while open.
    console.error('camera busy: OBS holds it. Turn on OBS remote control (Tools → WebSocket Server Settings → Enable) and run again.');
    process.exit(1);
  }
  console.log(`photo: ${plan.photo}`);
}
// Written next to it, then renamed: OBS never loads a half-written picture (it reloads image files when they change).
const paint = (photo: Buffer) => {
  writeFileSync(`${plan.out}.tmp`, execFileSync(plan.stylize.cmd, plan.stylize.args, { input: photo, stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 28 }));
  renameSync(`${plan.out}.tmp`, plan.out);
  console.log(`${new Date().toLocaleTimeString()} anime room: ${plan.out}`);
};

if (plan.stylize.cmd === 'docker') run('docker', ['build', '-q', '-t', IMAGE, 'docker/anime']); // cached after the first build (~1 GB)
if (!plan.watch) paint(readFileSync(plan.photo));
else {
  const opts = { threshold: Number(process.env.ROOM_CHANGE ?? 6), settle: Number(process.env.ROOM_SETTLE ?? 60) * 1000 };
  const cutout = process.env.ROOM_CUTOUT ?? 'Camera', present = Number(process.env.ROOM_PRESENT ?? 0.05);
  const backdrop = process.env.ROOM_SOURCE ?? 'Anime room', LIGHT = 'Room light';
  // The thumbnail the picture was painted from, kept next to it: a restart (every stream) still knows the painted light.
  const baseFile = plan.out.replace(/\.png$/, '.json');
  const saved = (() => { try { return Uint8Array.from(Buffer.from(JSON.parse(readFileSync(baseFile, 'utf8')).base, 'base64')); } catch { return null; } })();
  let s: Watch = { base: saved, since: null, clean: !!saved }, down = false, was = false, held = false, blank = false, gain = 1, shown = NaN;
  const painter = process.env.ROOM_PAINTER ?? 'flux';
  await obs([['CreateSourceFilter', { sourceName: backdrop, filterName: LIGHT, filterKind: 'color_filter_v2', filterSettings: lightFilter(1) }]]).catch(() => {}); // exists already: fine
  console.log(`watching the room every 10 s: light follows along; repaints once you are away from "${cutout}" for ${opts.settle / 1000} s and something moved (≥ ${opts.threshold})${saved ? '' : ', no painted thumbnail yet'}, ctrl+c stops`);
  for (;;) {
    try {
      const [, shot, cut, stream] = await obs([
        ['GetInputList', {}],
        (a) => ['GetSourceScreenshot', { sourceName: camera(a), imageFormat: 'pgm', imageWidth: 64, imageHeight: 36 }],
        ['GetSourceScreenshot', { sourceName: cutout, imageFormat: 'png', imageWidth: 64, imageHeight: 36 }],
        ['GetStreamStatus', {}],
      ]);
      const thumb = pgm(image(shot)), mask = pngAlpha(image(cut));
      if (blankFrame(thumb)) { // camera lost: skip the tick (no black paint, no dimming), re-point OBS at it by name
        const [list] = await obs([['GetInputList', {}]]);
        const name = camera([list]), [{ inputSettings }] = await obs([['GetInputSettings', { inputName: name }]]);
        const fix = cameraFix(inputSettings, cameras(execFileSync('system_profiler', ['SPCameraDataType'], { encoding: 'utf8' })));
        if (fix) await obs([['SetInputSettings', { inputName: name, inputSettings: fix }]]), console.log(`camera ${fix.device_name} had a new ID, re-pointed OBS at ${fix.device}`);
        else if (!blank) console.log('camera is blank and macOS has no new ID for it (GoPro off or unplugged?)');
        blank = true;
        await sleep(10_000);
        continue;
      }
      blank = false;
      // You, as Background Removal sees you: the share of the frame its cutout fills (seated measured 0.24).
      const you = coverage(mask);
      if (stuckCutout(you)) { // switch its filters off and on, which revives them
        const { filters } = (await obs([['GetSourceFilterList', { sourceName: cutout }]]))[0];
        const on = filters.filter((f: any) => f.filterEnabled).map((f: any) => f.filterName);
        await obs([...on.map((f: string) => ['SetSourceFilterEnabled', { sourceName: cutout, filterName: f, filterEnabled: false }] as Req), ...on.map((f: string) => ['SetSourceFilterEnabled', { sourceName: cutout, filterName: f, filterEnabled: true }] as Req)]);
        console.log(`cutout was stuck (covering ${(you * 100).toFixed(0)}%), restarted its filters`);
      }
      const step = watchStep(s, { thumb, present: you > present, mask }, Date.now(), opts);
      const target = s.base ? fitGain(s.base, thumb, mask) : 1;
      gain = ease(gain, target, 0.3); // ~30 s to settle: calm, no visible stepping
      if (process.env.ROOM_DEBUG) console.log(`you ${you.toFixed(2)} gain ${target.toFixed(2)}→${gain.toFixed(2)} moved ${s.base ? residual(s.base, thumb, mask, target).toFixed(1) : '-'}`);
      else if (you > present !== was) console.log(you > present ? 'you are back' : 'you stepped away, repainting the room if you stay away');
      was = you > present;
      const hold = step.restyle && holdPaint({ painter, live: stream.outputActive });
      if (hold && !held) console.log('repaint waiting until you are offline (FLUX would stutter the stream); the light keeps following');
      held = hold;
      if (step.restyle && !hold) {
        paint(await obsScreenshot());
        writeFileSync(baseFile, JSON.stringify({ base: Buffer.from(thumb).toString('base64') }));
        gain = 1; // painted in today's light
      }
      if (!(Math.abs(gain - shown) < 0.01)) {
        await obs([['SetSourceFilterSettings', { sourceName: backdrop, filterName: LIGHT, filterSettings: lightFilter(gain) }]]);
        shown = gain;
      }
      if (!hold) s = step.s; // held: keep counting, so it paints on the first tick offline
      if (down) console.log('OBS back'), down = false;
    } catch (e) {
      if (!down) console.log(`room: ${(e as Error).message}, retrying every 10 s`), down = true; // e.g. OBS not open yet
    }
    await sleep(10_000);
  }
}
