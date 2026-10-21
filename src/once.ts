import { writeFile } from 'node:fs/promises';

// True the first time `key` comes up on `day`: an empty marker file created with 'wx' (fails if it exists), the same
// once-per-day idiom as the town archive. Survives bot restarts.
export const onceADay = (dir: string, key: string, day: string) =>
  writeFile(`${dir}/${key}-${day}`, '', { flag: 'wx' }).then(() => true, () => false);
