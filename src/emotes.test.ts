import { describe, expect, it } from 'vitest';
import { E } from './emotes.ts';
import { greet } from './greet.ts';
import { announce, current } from './focus.ts';
import { handleCommand } from './town.ts';

const MIN = 60_000;
const sam = { userId: '1', userName: 'sam' };
// Twitch only renders an emote when it stands alone between spaces
const uses = (msg: string | null | undefined, emote: string) => expect(` ${msg} `).toContain(` ${emote} `);
const at = (preset: 'pomodoro' | 'deep', min: number) => current({ preset, startedAt: 0, pausedAt: null }, min * MIN)!;

describe('bot copy uses the channel follower emotes', () => {
  it('greets newcomers with the brick', () => uses(greet({}, sam, 's').message, E.brick));
  it('locks in when a focus block starts', () => uses(announce(at('pomodoro', 1)), E.lockin));
  it('gets cozy at breaks', () => uses(announce(at('pomodoro', 26)), E.cozy));
  it('sends people to touch grass at lunch', () => uses(announce(at('deep', 201)), E.grass));
  it('lights up a finished task', () => {
    const town = { '1': { name: 'sam', floors: [{ task: 'essay', done: false }] } };
    uses(handleCommand(town, sam, '!done', 0)?.reply, E.lit);
  });
});
