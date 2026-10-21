// Anime room backdrop: grabs the room from the camera and stylizes it (src/room.ts has the plan).
// Usage: npm run room -- <name> [photo | --watch]   → data/room-<name>.png, add it in OBS below the camera (docs/SETUP.md).
// --watch keeps going: a tiny thumbnail every 10 s, repaints when the room stays changed (src/room.ts watchStep).
// Knobs: ROOM_CHANGE (how different counts, 0-255, default 20; you moving measured 4-12), ROOM_SETTLE (seconds it must last, default 60).
// OBS open: asks it for the camera frame over obs-websocket (Tools → WebSocket Server Settings → Enable; password read
// from OBS's own config). OBS closed: ffmpeg grabs the camera (ROOM_CAMERA, default HERO11 Black). Needs Docker.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { cameraInput, obsAuth } from '../src/obs.ts';
import { IMAGE, change, pgm, roomPlan, watchStep, type Watch } from '../src/room.ts';

const data = resolve('data');
const argv = process.argv.slice(2).map((a, i) => (i === 1 && !a.startsWith('--') ? resolve(a) : a));
const plan = (() => { try { return roomPlan(argv, { data, camera: process.env.ROOM_CAMERA ?? 'HERO11 Black' }); } catch (e) { console.error((e as Error).message); process.exit(1); } })();
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: 'inherit' });

// The camera source's current frame, as OBS renders it: filters included, so Background Removal goes on a nested
// scene holding the camera, not on the camera itself (docs/SETUP.md). One connection per call: OBS may restart.
const obsScreenshot = (shot: { imageFormat: string; imageWidth?: number; imageHeight?: number } = { imageFormat: 'png' }) => new Promise<Buffer>((ok, fail) => {
  const cfg = JSON.parse(readFileSync(`${homedir()}/Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json`, 'utf8'));
  const ws = new WebSocket(`ws://127.0.0.1:${cfg.server_port}`);
  const send = (op: number, d: object) => ws.send(JSON.stringify({ op, d }));
  const call = (requestType: string, requestData = {}) => send(6, { requestType, requestId: requestType, requestData });
  const timer = setTimeout(() => done(() => fail(new Error('no answer in 10 s'))), 10_000);
  const done = (f: () => void) => { clearTimeout(timer); ws.onclose = null; ws.close(); f(); };
  ws.onerror = () => done(() => fail(new Error('remote control is off (Tools → WebSocket Server Settings → Enable)')));
  ws.onclose = (e) => done(() => fail(new Error(`closed the connection (${e.code} ${e.reason})`)));
  ws.onmessage = ({ data }) => {
    const { op, d } = JSON.parse(String(data));
    if (op === 0) send(1, { rpcVersion: 1, ...(d.authentication && { authentication: obsAuth(cfg.server_password, d.authentication.salt, d.authentication.challenge) }) });
    else if (op === 2) call('GetInputList');
    else if (op !== 7) return;
    else if (!d.requestStatus.result) done(() => fail(new Error(d.requestStatus.comment)));
    else if (d.requestId === 'GetInputList') {
      const cam = cameraInput(d.responseData.inputs);
      cam ? call('GetSourceScreenshot', { sourceName: cam, ...shot }) : done(() => fail(new Error('no camera source in OBS')));
    } else done(() => ok(Buffer.from(d.responseData.imageData.split(',')[1], 'base64')));
  };
});

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
  writeFileSync(`${plan.out}.tmp`, execFileSync('docker', plan.stylize, { input: photo, stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 28 }));
  renameSync(`${plan.out}.tmp`, plan.out);
  console.log(`${new Date().toLocaleTimeString()} anime room: ${plan.out}`);
};

run('docker', ['build', '-q', '-t', IMAGE, 'docker/anime']); // cached after the first build (~1 GB, a few minutes)
if (!plan.watch) paint(readFileSync(plan.photo));
else {
  const opts = { threshold: Number(process.env.ROOM_CHANGE ?? 20), settle: Number(process.env.ROOM_SETTLE ?? 60) * 1000 };
  let s: Watch = { base: null, since: null }, down = false;
  console.log(`watching the room every 10 s (change ≥ ${opts.threshold} for ${opts.settle / 1000} s repaints), ctrl+c stops`);
  for (;;) {
    try {
      const thumb = pgm(await obsScreenshot({ imageFormat: 'pgm', imageWidth: 64, imageHeight: 36 }));
      const step = watchStep(s, thumb, Date.now(), opts);
      const diff = s.base ? change(s.base, thumb).toFixed(1) : '-';
      if (process.env.ROOM_DEBUG) console.log(`change ${diff}`); // tuning ROOM_CHANGE: watch this while you move vs the light changes
      else if (s.since === null && step.s.since !== null) console.log(`room looks different (${diff}), repainting if it lasts`);
      if (step.restyle) paint(await obsScreenshot());
      s = step.s;
      if (down) console.log('OBS back'), down = false;
    } catch (e) {
      if (!down) console.log(`room: ${(e as Error).message}, retrying every 10 s`), down = true; // e.g. OBS not open yet
    }
    await sleep(10_000);
  }
}
