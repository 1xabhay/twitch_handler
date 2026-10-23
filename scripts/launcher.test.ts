import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Builds the launcher into a throwaway HOME and checks what it will do when the streamer opens it.
describe('npm run launcher', () => {
  const home = mkdtempSync(join(tmpdir(), 'launcher-'));
  execFileSync('sh', ['scripts/make-launcher.sh'], { env: { ...process.env, HOME: home } });
  const launch = join(home, 'Applications/Isamy Stream.app/Contents/MacOS/launch');
  const body = readFileSync(launch, 'utf8');

  it('rebuilds into a new file, so a launcher running right now keeps reading its own copy', () => {
    const before = statSync(launch).ino;
    execFileSync('sh', ['scripts/make-launcher.sh'], { env: { ...process.env, HOME: home } });
    expect(statSync(launch).ino).not.toBe(before);
  });
  it('is an executable, valid shell script', () => {
    expect(statSync(launch).mode & 0o111).toBeTruthy();
    execFileSync('sh', ['-n', launch]);
  });
  it('restarts the bot every time OBS starts: kills any running bot first, then starts the current code', () => {
    const kill = body.indexOf('pkill -f "src/main.ts"'), start = body.indexOf('src/main.ts >>'), obs = body.indexOf('open -W -a OBS');
    expect([kill, start, obs].every((i) => i >= 0)).toBe(true);
    expect(kill < start && start < obs).toBe(true);
    expect(body).toContain(`cd "${process.cwd()}"`);
  });
  it('installs the Spotify scene switch as a LaunchAgent: kept alive by macOS, not tied to a terminal or the app', () => {
    const plist = readFileSync(join(home, 'Library/LaunchAgents/tv.heyisamy.spotify-quiet.plist'), 'utf8');
    expect(plist).toContain('scripts/spotify-quiet.ts');
    expect(plist).toMatch(/<key>KeepAlive<\/key>\s*<true\/>/);
    expect(plist).toMatch(/<key>RunAtLoad<\/key>\s*<true\/>/);
    expect(plist).toContain(`<string>${process.cwd()}</string>`);
  });
  it('loads the switch agent when the app starts instead of running a copy of its own', () => {
    expect(body).toContain('launchctl bootstrap');
    expect(body).not.toMatch(/node"? scripts\/spotify-quiet\.ts/);
  });
  it('stops the bot when OBS quits', () => {
    expect(body.indexOf('kill $BOT')).toBeGreaterThan(body.indexOf('open -W -a OBS'));
  });
});
