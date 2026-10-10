import { describe, expect, it } from 'vitest';
import { handleCommand, type Town } from './town.ts';

const sam = { userId: '1', userName: 'sam' };
const open = (task: string) => ({ task, done: false });
const done = (task: string) => ({ task, done: true });
const samWith = (...floors: { task: string; done: boolean }[]): Town => ({ '1': { name: 'sam', floors } });

describe('handleCommand', () => {
  it('ignores messages that are not town commands', () => {
    expect(handleCommand({}, sam, 'hello there')).toBeNull();
    expect(handleCommand({}, sam, '!tasksss')).toBeNull();
  });

  describe('!task', () => {
    it('adds a numbered floor under construction', () => {
      const r = handleCommand({}, sam, '!task write chapter 3');
      expect(r?.town).toEqual(samWith(open('write chapter 3')));
      expect(r?.reply).toContain('1');
    });

    it('stacks new floors on top, with no limit', () => {
      const r = handleCommand(samWith(done('a'), open('b')), sam, '!task c');
      expect(r?.town['1']?.floors).toEqual([done('a'), open('b'), open('c')]);
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
