import { mkdtempSync, mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codeRev } from './overlay.ts';

describe('codeRev', () => {
  it('changes when any overlay file (even a nested theme) is edited, so open overlays reload', () => {
    const root = mkdtempSync(join(tmpdir(), 'rev-'));
    mkdirSync(join(root, 'src/scene/themes'), { recursive: true });
    mkdirSync(join(root, 'public'));
    const theme = join(root, 'src/scene/themes/x.ts');
    writeFileSync(theme, ''); writeFileSync(join(root, 'public/town.html'), '');
    const dirs = [join(root, 'src'), join(root, 'public')];
    const before = codeRev(dirs);
    expect(codeRev(dirs)).toBe(before);
    utimesSync(theme, new Date(), new Date(Date.now() + 5000));
    expect(codeRev(dirs)).not.toBe(before);
  });
});
