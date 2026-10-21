// Anime room backdrop: grabs the empty room from the camera and stylizes it (src/room.ts has the plan).
// Usage: npm run room -- <name> [photo]   → data/room-<name>.png, add it in OBS below the camera (docs/SETUP.md).
// Needs ffmpeg (brew install ffmpeg) and Docker; ROOM_CAMERA picks the camera (default HERO11 Black).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { IMAGE, roomPlan } from '../src/room.ts';

const data = resolve('data');
const argv = process.argv.slice(2).map((a, i) => (i === 1 ? resolve(a) : a));
const plan = (() => { try { return roomPlan(argv, { data, camera: process.env.ROOM_CAMERA ?? 'HERO11 Black' }); } catch (e) { console.error((e as Error).message); process.exit(1); } })();
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: 'inherit' });

mkdirSync(data, { recursive: true });
if (plan.capture) {
  for (let s = 5; s > 0; s--) { console.log(`step out of frame... ${s}`); await sleep(1000); }
  try { run('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...plan.capture]); } catch {
    // macOS lets one app configure a camera at a time: OBS holds it while open.
    console.error('camera busy (OBS open?). In OBS right-click the camera source → Screenshot (Source), then: make room NAME=<name> PHOTO=<that png>');
    process.exit(1);
  }
  console.log(`photo: ${plan.photo}`);
}
run('docker', ['build', '-q', '-t', IMAGE, 'docker/anime']); // cached after the first build (~1 GB, a few minutes)
writeFileSync(plan.out, execFileSync('docker', plan.stylize, { input: readFileSync(plan.photo), stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 28 }));
console.log(`anime room: ${plan.out}`);
