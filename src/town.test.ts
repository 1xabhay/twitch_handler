import { describe, expect, it } from 'vitest';
import { handleCommand, type Town } from './town.ts';

const sam = { userId: '1', userName: 'sam' };

describe('handleCommand', () => {
  it('ignores messages that are not town commands', () => {
    expect(handleCommand({}, sam, 'hello there')).toBeNull();
    expect(handleCommand({}, sam, '!tasks')).toBeNull();
  });

  it('!task gives a new viewer a building with a lit window', () => {
    const r = handleCommand({}, sam, '!task write chapter 3');
    expect(r?.town['1']).toEqual({ name: 'sam', floors: 0, task: 'write chapter 3' });
    expect(r?.reply).toContain('write chapter 3');
  });

  it('!task replaces the current task and keeps floors', () => {
    const town: Town = { '1': { name: 'sam', floors: 2, task: 'old' } };
    expect(handleCommand(town, sam, '!task new thing')?.town['1']).toEqual({ name: 'sam', floors: 2, task: 'new thing' });
  });

  it('!task with no text shows usage and changes nothing', () => {
    const r = handleCommand({}, sam, '!task   ');
    expect(r?.town).toEqual({});
    expect(r?.reply).toContain('!task');
  });

  it('!task trims and caps the text length', () => {
    const r = handleCommand({}, sam, `!task   ${'x'.repeat(200)}  `);
    expect(r?.town['1']?.task).toHaveLength(60);
  });

  it('!done adds a floor and turns the window off', () => {
    const town: Town = { '1': { name: 'sam', floors: 2, task: 'write' } };
    const r = handleCommand(town, sam, '!done');
    expect(r?.town['1']).toEqual({ name: 'sam', floors: 3, task: null });
    expect(r?.reply).toContain('3');
    expect(town['1']?.floors).toBe(2); // previous state untouched
  });

  it('!done without a task nudges and changes nothing', () => {
    const r = handleCommand({}, sam, '!done');
    expect(r?.town).toEqual({});
    expect(r?.reply).toContain('!task');
  });

  it('commands are case-insensitive and keep the latest display name', () => {
    const town: Town = { '1': { name: 'Sam_old', floors: 1, task: null } };
    expect(handleCommand(town, sam, '!TASK read')?.town['1']?.name).toBe('sam');
  });
});
