import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// `make` is the front door: every npm script has a target, and `make` alone lists them all.
describe('Makefile', () => {
  const make = (...args: string[]) => execFileSync('make', args, { encoding: 'utf8' });
  const help = make();
  const scripts = Object.keys(JSON.parse(readFileSync('package.json', 'utf8')).scripts);
  const targets = [...readFileSync('Makefile', 'utf8').matchAll(/^([a-z-]+):/gm)].map((m) => m[1]);

  it('has a target for every npm script (rewards:check → rewards-check, login → login-bot/login-channel)', () => {
    expect(scripts.map((s) => s.replace(':', '-')).filter((s) => !targets.some((t) => t === s || t.startsWith(`${s}-`)))).toEqual([]);
  });
  it('lists every target with a description when run bare', () => {
    expect(targets.filter((t) => !help.includes(`make ${t} `))).toEqual([]);
  });
  it('check runs the tests and the type check', () => {
    const plan = make('-n', 'check');
    expect(plan).toContain('npm test');
    expect(plan).toContain('npm run typecheck');
  });
  it('preview defaults to the plain city by day and passes THEME/PHASE through', () => {
    expect(make('-n', 'preview')).toContain('npm run preview -- plain day');
    expect(make('-n', 'preview', 'THEME=onepiece', 'PHASE=night')).toContain('npm run preview -- onepiece night');
  });
  it('docker-check never copies secrets into the image', () => {
    const ignored = readFileSync('.dockerignore', 'utf8').split('\n');
    expect(['.env', 'tokens/', 'data/'].filter((p) => !ignored.includes(p))).toEqual([]);
  });
});
