import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The FLUX.2 klein painter keeps the Docker painter's contract: photo on stdin, same-size anime PNG on stdout.
// A fake mflux stands in for the model, so this runs in a second.
describe('scripts/paint-flux.sh', () => {
  const script = join(process.cwd(), 'scripts/paint-flux.sh');
  const body = readFileSync(script, 'utf8');

  it('is valid shell', () => {
    execFileSync('sh', ['-n', script]);
  });
  it('uses the real edit (--image-paths), not the img2img flag that barely changes the picture', () => {
    expect(body).toContain('--image-paths');
    expect(body).not.toMatch(/--image-path\b(?!s)/);
  });

  // sips is macOS only; the model runs natively on the Mac anyway.
  describe.skipIf(process.platform !== 'darwin')('with a fake mflux', () => {
    const dir = mkdtempSync(join(tmpdir(), 'paint-flux-'));
    const fake = join(dir, 'mflux');
    // Logs to stdout like the real one, records its args, writes the "painting" at the size it was asked for.
    writeFileSync(fake, `#!/bin/sh
echo "loading model..."
printf '%s\\n' "$@" > "${dir}/args"
while [ $# -gt 0 ]; do case "$1" in
  --image-paths) in=$2;; --width) w=$2;; --height) h=$2;; --output) out=$2;; esac; shift; done
sips -z "$h" "$w" "$in" --out "$out" >/dev/null
`);
    chmodSync(fake, 0o755);
    const photo = join(dir, 'photo.png');
    execFileSync('sips', ['-z', '1080', '1920', 'assets/emotes/Aura_112.png', '--out', photo]);
    const paint = (env: Record<string, string> = {}) => {
      const png = execFileSync('sh', [script], { input: readFileSync(photo), cwd: tmpdir(), env: { ...process.env, MFLUX_BIN: fake, ...env } });
      return { png, args: readFileSync(join(dir, 'args'), 'utf8').split('\n') };
    };
    const arg = (args: string[], flag: string) => args[args.indexOf(flag) + 1];

    it('writes only a PNG of the input size to stdout, from any cwd', () => {
      const { png } = paint();
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1920, 1080]);
    });
    it('paints at 1024 on the long side, keeping the aspect (multiples of 16)', () => {
      const { args } = paint();
      expect([arg(args, '--width'), arg(args, '--height')]).toEqual(['1024', '576']);
    });
    it('has a fixed default seed, so repaints do not drift', () => {
      expect(arg(paint().args, '--seed')).toBe(arg(paint().args, '--seed'));
      expect(arg(paint().args, '--seed')).toMatch(/^\d+$/);
    });
    it('honours ROOM_FLUX_STEPS, ROOM_FLUX_SEED and ROOM_FLUX_PROMPT', () => {
      const { args } = paint({ ROOM_FLUX_STEPS: '7', ROOM_FLUX_SEED: '123', ROOM_FLUX_PROMPT: 'watercolour room' });
      expect([arg(args, '--steps'), arg(args, '--seed'), arg(args, '--prompt')]).toEqual(['7', '123', 'watercolour room']);
    });
  });
});
