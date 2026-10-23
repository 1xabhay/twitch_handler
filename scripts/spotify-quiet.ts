// Follows the OBS scene and mutes Spotify on the Mac speakers where roomMuted says so (src/quiet.ts), through a muted
// AudioTee process tap. OBS keeps capturing Spotify either way. Started by the launcher next to OBS.
// Needs AudioTee built (AUDIOTEE, default ~/.local/src/audiotee) and System Audio Recording permission for the app
// that runs this (the launcher, or your terminal).
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { obsAuth } from '../src/obs.ts';
import { obs } from '../src/obsws.ts';
import { defaultOutput, fullVolume, roomMuted, talkVolume } from '../src/quiet.ts';

const AUDIOTEE = process.env.AUDIOTEE ?? `${homedir()}/.local/src/audiotee/.build/release/audiotee`;
const spotify = () => { try { return execFileSync('pgrep', ['-x', 'Spotify'], { encoding: 'utf8' }).trim().split('\n')[0]; } catch { return ''; } };

const output = () => { try { return defaultOutput(execFileSync('system_profiler', ['SPAudioDataType'], { encoding: 'utf8' })); } catch { return ''; } };
// OBS's app capture goes silent after an output change too: point it away and back to restart it.
const repoint = async () => {
  const [{ inputSettings }] = await obs([['GetInputSettings', { inputName: 'Spotify' }]]);
  await obs([['SetInputSettings', { inputName: 'Spotify', inputSettings: { application: '' } }]]);
  await new Promise((r) => setTimeout(r, 1_000));
  await obs([['SetInputSettings', { inputName: 'Spotify', inputSettings }]]);
};

let roomMusic = false; // the live scene's "Room music" item is visible
let scene = '', tap: ChildProcess | null = null, tapped = '', device = output();
const stop = () => { tap?.kill(); tap = null; };

// Talking: Spotify to a quarter for the room and the stream, back to where it was on leaving. Only while Spotify runs
// (AppleScript would launch it). ponytail: a restart while in Notfocussed takes the lowered volume as full.
const volume = (set?: number) => execFileSync('osascript', ['-e', `tell application "Spotify" to ${set === undefined ? 'return sound volume' : `set sound volume to ${set}`}`], { encoding: 'utf8' }).trim();
let full: number | null = null, last: number | null = null;
const duck = () => {
  if (!spotify()) return;
  const talk = scene === 'Notfocussed'; // Room music in Focus/Break plays at full volume
  if (talk && full === null) full = last = fullVolume(Number(volume()), last), volume(talkVolume(full)), console.log(`${scene}: Spotify ${full} → ${talkVolume(full)}`);
  if (!talk && full !== null) volume(full), console.log(`${scene}: Spotify back to ${full}`), full = null;
};
const apply = () => {
  if (!scene) return; // OBS not reached yet
  const now = output();
  if (now && now !== device) {
    console.log(`output ${device} → ${now}: restarting the tap and OBS's Spotify capture`);
    device = now, stop();
    repoint().catch((e) => console.log('repoint failed:', e.message));
  }
  const want = roomMuted(scene, roomMusic), pid = want ? spotify() : '';
  if (tap && (!want || pid !== tapped)) stop(), console.log(`${scene}: Spotify back on the Mac`); // talking, or Spotify restarted
  if (want && !tap && pid) {
    const child = tap = spawn(AUDIOTEE, ['--include-processes', pid, '--mute'], { stdio: 'ignore' });
    child.on('exit', () => { if (tap === child) tap = null; });
    tapped = pid;
    console.log(`${scene}: Spotify muted on the Mac (pid ${pid})`);
  }
};
setInterval(apply, 5_000);
process.on('SIGTERM', () => { stop(); if (full !== null) volume(full); process.exit(0); });

const connect = () => {
  const cfg = JSON.parse(readFileSync(`${homedir()}/Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json`, 'utf8'));
  const ws = new WebSocket(`ws://127.0.0.1:${cfg.server_port}`);
  ws.onmessage = ({ data }) => {
    const { op, d } = JSON.parse(String(data));
    if (op === 0) ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1, eventSubscriptions: (1 << 2) | (1 << 7), // Scenes + SceneItems events
      ...(d.authentication && { authentication: obsAuth(cfg.server_password, d.authentication.salt, d.authentication.challenge) }) } }));
    const items = () => ws.send(JSON.stringify({ op: 6, d: { requestType: 'GetSceneItemList', requestId: 'items', requestData: { sceneName: scene } } }));
    if (op === 2) ws.send(JSON.stringify({ op: 6, d: { requestType: 'GetCurrentProgramScene', requestId: 'now' } }));
    if (op === 7 && d.requestId === 'now') scene = d.responseData.currentProgramSceneName, items();
    if (op === 5 && d.eventType === 'CurrentProgramSceneChanged') scene = d.eventData.sceneName, items();
    if (op === 5 && d.eventType === 'SceneItemEnableStateChanged' && d.eventData.sceneName === scene) items();
    if (op === 7 && d.requestId === 'items') {
      roomMusic = d.responseData.sceneItems?.some((i: any) => i.sourceName === 'Room music' && i.sceneItemEnabled) ?? false;
      apply(), duck();
    }
  };
  ws.onclose = () => setTimeout(connect, 5_000); // OBS still starting, or restarted
};
connect();
