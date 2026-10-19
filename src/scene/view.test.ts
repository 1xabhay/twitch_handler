import { describe, expect, it } from 'vitest';
import { handleView } from './view.ts';

describe('handleView', () => {
  it('shows the current view to anyone, changes it for mods only', () => {
    expect(handleView('city', { isMod: false }, '!view')).toEqual({ view: 'city', reply: expect.stringContaining('city') });
    expect(handleView('city', { isMod: false }, '!view cam')!.view).toBe('city');
    expect(handleView('city', { isMod: true }, '!view Cam')!.view).toBe('cam');
    expect(handleView('cam', { isMod: true }, '!view city')!.view).toBe('city');
    expect(handleView('city', { isMod: true }, '!view sideways')).toEqual({ view: 'city', reply: expect.stringContaining('city, cam') });
    expect(handleView('city', { isMod: true }, '!viewers')).toBeNull();
  });
});
