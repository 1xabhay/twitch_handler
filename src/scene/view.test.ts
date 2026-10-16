import { describe, expect, it } from 'vitest';
import { handleView } from './view.ts';

describe('handleView', () => {
  it('shows the current view to anyone, changes it for mods only', () => {
    expect(handleView('city', { isMod: false }, '!view')).toEqual({ view: 'city', reply: expect.stringContaining('city') });
    expect(handleView('city', { isMod: false }, '!view bottom')!.view).toBe('city');
    expect(handleView('city', { isMod: true }, '!view Bottom')!.view).toBe('bottom');
    expect(handleView('bottom', { isMod: true }, '!view city')!.view).toBe('city');
    expect(handleView('city', { isMod: true }, '!view sideways')).toEqual({ view: 'city', reply: expect.stringContaining('city, bottom') });
    expect(handleView('city', { isMod: true }, '!viewers')).toBeNull();
  });
});
