import { describe, expect, it } from 'vitest';
import { handleLink } from './links.ts';

const links = { discord: 'https://discord.gg/abc', insta: 'https://instagram.com/me', playlist: 'https://open.spotify.com/playlist/x' };

describe('handleLink', () => {
  it('answers each link command', () => {
    expect(handleLink('!discord', links)).toContain('https://discord.gg/abc');
    expect(handleLink('!insta', links)).toContain('https://instagram.com/me');
    expect(handleLink('!instagram', links)).toContain('https://instagram.com/me');
    expect(handleLink('!PLAYLIST', links)).toContain('spotify');
  });

  it('!socials lists every link that is set', () => {
    const r = handleLink('!socials', links)!;
    for (const url of Object.values(links)) expect(r).toContain(url);
  });

  it('skips links that are not set', () => {
    expect(handleLink('!discord', { insta: 'i' })).toBeNull();
    expect(handleLink('!socials', { insta: 'https://instagram.com/me' })).not.toContain('discord');
  });

  it('ignores other messages', () => {
    expect(handleLink('hi', links)).toBeNull();
    expect(handleLink('!discordx', links)).toBeNull();
  });
});
