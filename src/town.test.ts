import { describe, expect, it } from 'vitest';
import { handleCommand, newDay, stepLandmark, type Floor, type Town } from './town.ts';
import { FOCUS_ID, landmarkFor, POOL } from './scene/city.ts';

const sam = { userId: '1', userName: 'sam' };
const open = (task: string) => ({ task, done: false });
const done = (task: string) => ({ task, done: true });
const samWith = (...floors: Floor[]): Town => ({ '1': { name: 'sam', floors } });

describe('handleCommand', () => {
  it('ignores messages that are not town commands', () => {
    expect(handleCommand({}, sam, 'hello there')).toBeNull();
    expect(handleCommand({}, sam, '!tasksss')).toBeNull();
  });

  describe('!task', () => {
    it('adds a numbered floor under construction, rolling its building and stamping when it was opened', () => {
      const r = handleCommand({}, sam, '!task write chapter 3', 0, 42);
      expect(r?.town).toEqual(samWith({ ...open('write chapter 3'), kind: POOL[0], at: 42 }));
      expect(r?.reply).toContain('1');
    });

    it('stacks new floors on top, with no limit', () => {
      const r = handleCommand(samWith(done('a'), open('b')), sam, '!task c');
      expect(r?.town['1']?.floors.map((f) => f.task)).toEqual(['a', 'b', 'c']);
      expect(r?.reply).toContain('3');
    });

    it('with no text shows usage and changes nothing', () => {
      const r = handleCommand({}, sam, '!task   ');
      expect(r?.town).toEqual({});
      expect(r?.reply).toContain('!task');
    });

    it('trims and caps the text length', () => {
      const r = handleCommand({}, sam, `!task   ${'x'.repeat(200)}  `);
      expect(r?.town['1']?.floors[0]?.task).toHaveLength(60);
    });

    it('is case-insensitive and keeps the latest display name', () => {
      const town: Town = { '1': { name: 'Sam_old', floors: [] } };
      expect(handleCommand(town, sam, '!TASK read')?.town['1']?.name).toBe('sam');
    });
  });

  describe('!done', () => {
    it('!done N finishes only that floor', () => {
      const town = samWith(open('a'), open('b'), open('c'));
      const r = handleCommand(town, sam, '!done 2');
      expect(r?.town['1']?.floors).toEqual([open('a'), done('b'), open('c')]);
      expect(town['1']?.floors[1]).toEqual(open('b')); // previous state untouched
    });

    it('bare !done finishes the only open floor', () => {
      const r = handleCommand(samWith(done('a'), open('b')), sam, '!done');
      expect(r?.town['1']?.floors).toEqual([done('a'), done('b')]);
    });

    it('bare !done with several open floors asks which, listing the numbers', () => {
      const town = samWith(open('a'), done('b'), open('c'));
      const r = handleCommand(town, sam, '!done');
      expect(r?.town).toBe(town);
      expect(r?.reply).toContain('!done 1');
      expect(r?.reply).toContain('!done 3');
    });

    it('nudges when there is nothing open', () => {
      const r = handleCommand({}, sam, '!done');
      expect(r?.town).toEqual({});
      expect(r?.reply).toContain('!task');
    });

    it('rejects a number that is not an open floor', () => {
      const town = samWith(done('a'), open('b'));
      expect(handleCommand(town, sam, '!done 1')?.town).toBe(town);
      expect(handleCommand(town, sam, '!done 9')?.town).toBe(town);
      expect(handleCommand(town, sam, '!done x')?.town).toBe(town);
    });
  });

  describe('!tasks', () => {
    it('lists open floors with their numbers', () => {
      const r = handleCommand(samWith(open('a'), done('b'), open('c')), sam, '!tasks');
      expect(r?.reply).toMatch(/1.*a.*3.*c/);
      expect(r?.reply).not.toContain('b');
    });

    it('says when there is nothing open', () => {
      expect(handleCommand({}, sam, '!tasks')?.reply).toContain('!task');
    });
  });

  describe('!remove', () => {
    it('removes an open floor', () => {
      const r = handleCommand(samWith(done('a'), open('b'), open('c')), sam, '!remove 2');
      expect(r?.town['1']?.floors).toEqual([done('a'), open('c')]);
    });

    it('never removes a done floor', () => {
      const town = samWith(done('a'));
      const r = handleCommand(town, sam, '!remove 1');
      expect(r?.town).toBe(town);
      expect(r?.reply).toMatch(/forever/);
    });

    it('rejects a missing number', () => {
      const town = samWith(open('a'));
      expect(handleCommand(town, sam, '!remove')?.town).toBe(town);
    });
  });
});

describe('newDay', () => {
  it('clears finished floors and keeps unfinished ones, renumbered', () => {
    const town: Town = { '1': { name: 'sam', floors: [done('a'), open('b')] }, '2': { name: 'jo', floors: [done('c')] } };
    expect(newDay(town)).toEqual({ '1': { name: 'sam', floors: [open('b')] } });
  });
});

describe('stepLandmark', () => {
  const focus = (town: Town) => town[FOCUS_ID]?.floors ?? [];

  it('a focus block starting raises a landmark under construction', () => {
    const t = stepLandmark({}, { wasFocus: false, isFocus: true, natural: true, min: 90 }, 0, 7);
    expect(focus(t)).toEqual([{ task: 'focus', done: false, kind: landmarkFor(90, 0), at: 7 }]);
  });

  it('finishing the block on time opens it; the next block starts another', () => {
    const open = stepLandmark({}, { wasFocus: false, isFocus: true, natural: true, min: 25 }, 0, 1);
    const t = stepLandmark(open, { wasFocus: true, isFocus: false, natural: true, min: 5 }, 0, 2);
    expect(focus(t).map((f) => f.done)).toEqual([true]);
    expect(focus(stepLandmark(t, { wasFocus: false, isFocus: true, natural: true, min: 25 }, 0, 3))).toHaveLength(2);
  });

  it('stopping or skipping mid-focus lets the unfinished landmark wither', () => {
    const open = stepLandmark({}, { wasFocus: false, isFocus: true, natural: true, min: 25 }, 0, 1);
    expect(focus(stepLandmark(open, { wasFocus: true, isFocus: false, natural: false, min: 5 }, 0, 2))).toEqual([]);
  });

  it('leaves the town alone when focus is not involved', () => {
    const town: Town = {};
    expect(stepLandmark(town, { wasFocus: false, isFocus: false, natural: true, min: 10 }, 0, 1)).toBe(town);
  });
});
