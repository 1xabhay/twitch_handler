// Follows the OBS scene and mutes Spotify on the Mac speakers where roomMuted says so (src/quiet.ts), through a muted
// AudioTee process tap. OBS keeps capturing Spotify either way. Started by the launcher next to OBS.
// Needs AudioTee built (AUDIOTEE, default ~/.local/src/audiotee) and System Audio Recording permission for the app
// that runs this (the launcher, or your terminal).
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { obsAuth } from '../src/obs.ts';
import { roomMuted } from '../src/quiet.ts';

const AUDIOTEE = process.env.AUDIOTEE ?? `${homedir()}/.local/src/audiotee/.build/release/audiotee`;
const spotify = () => { try { return execFileSync('pgrep', ['-x', 'Spotify'], { encoding: 'utf8' }).trim().split('\n')[0]; } catch { return ''; } };

let scene = '', tap: ChildProcess | null = null, tapped = '';
const stop = () => { tap?.kill(); tap = null; };
const apply = () => {
  if (!scene) return; // OBS not reached yet
  const want = roomMuted(scene), pid = want ? spotify() : '';
  if (tap && (!want || pid !== tapped)) stop(), console.log(`${scene}: Spotify back on the Mac`); // talking, or Spotify restarted
  if (want && !tap && pid) {
    const child = tap = spawn(AUDIOTEE, ['--include-processes', pid, '--mute'], { stdio: 'ignore' });
    child.on('exit', () => { if (tap === child) tap = null; });
    tapped = pid;
    console.log(`${scene}: Spotify muted on the Mac (pid ${pid})`);
  }
};
setInterval(apply, 5_000);
process.on('SIGTERM', () => { stop(); process.exit(0); });

const connect = () => {
  const cfg = JSON.parse(readFileSync(`${homedir()}/Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json`, 'utf8'));
  const ws = new WebSocket(`ws://127.0.0.1:${cfg.server_port}`);
  ws.onmessage = ({ data }) => {
    const { op, d } = JSON.parse(String(data));
    if (op === 0) ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1, eventSubscriptions: 1 << 2, // Scenes events
      ...(d.authentication && { authentication: obsAuth(cfg.server_password, d.authentication.salt, d.authentication.challenge) }) } }));
    if (op === 2) ws.send(JSON.stringify({ op: 6, d: { requestType: 'GetCurrentProgramScene', requestId: 'now' } }));
    if (op === 7 && d.requestId === 'now') scene = d.responseData.currentProgramSceneName, apply();
    if (op === 5 && d.eventType === 'CurrentProgramSceneChanged') scene = d.eventData.sceneName, apply();
  };
  ws.onclose = () => setTimeout(connect, 5_000); // OBS still starting, or restarted
};
connect();
