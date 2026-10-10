import { describe, expect, it } from 'vitest';
import { canRequest, isCleared, nowPlaying, parseMusic, COOLDOWN_MS } from './music.ts';

describe('parseMusic', () => {
  it('reads song commands', () => {
    expect(parseMusic('!sr  lofi rain ')).toEqual({ cmd: 'sr', query: 'lofi rain' });
    expect(parseMusic('!SR lofi')).toEqual({ cmd: 'sr', query: 'lofi' });
    expect(parseMusic('!sr')).toEqual({ cmd: 'sr', query: '' });
    expect(parseMusic('!song')).toEqual({ cmd: 'song' });
    expect(parseMusic('!skip')).toEqual({ cmd: 'skip' });
  });

  it('ignores everything else', () => {
    expect(parseMusic('hello')).toBeNull();
    expect(parseMusic('!songs')).toBeNull();
    expect(parseMusic('!srx a')).toBeNull();
  });

  it('caps the query length', () => {
    expect(parseMusic(`!sr ${'a'.repeat(300)}`)).toEqual({ cmd: 'sr', query: 'a'.repeat(100) });
  });
});

describe('canRequest', () => {
  const who = { userId: '1', isFollower: true, isMod: false };

  it('followers can request', () => expect(canRequest({}, who, 0)).toEqual({ ok: true }));

  it('non-followers are told to follow', () => {
    const r = canRequest({}, { ...who, isFollower: false }, 0);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/follow/);
  });

  it('one request per cooldown, then allowed again', () => {
    const last = { '1': 1000 };
    expect(canRequest(last, who, 1000 + COOLDOWN_MS - 1).ok).toBe(false);
    expect(canRequest(last, who, 1000 + COOLDOWN_MS).ok).toBe(true);
  });

  it('mods skip the follow check and the cooldown', () => {
    expect(canRequest({ '1': 1000 }, { ...who, isFollower: false, isMod: true }, 1001).ok).toBe(true);
  });
});

describe('isCleared', () => {
  const allow = ['StreamBeats', 'NCS'];
  const track = (label: string, ...artists: string[]) => ({ label, artists });

  it('accepts a cleared label or artist, case-insensitively', () => {
    expect(isCleared(track('streambeats records', 'Some Artist'), allow, false)).toBe(true);
    expect(isCleared(track('Other', 'NCS'), allow, false)).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isCleared(track('Big Label Music', 'Pop Star'), allow, false)).toBe(false);
  });

  it('accepts anything when the allowlist is switched off', () => {
    expect(isCleared(track('Big Label Music', 'Pop Star'), allow, true)).toBe(true);
  });
});

describe('nowPlaying', () => {
  it('formats the current song', () => {
    expect(nowPlaying({ name: 'Rain', artists: ['A', 'B'] })).toBe('🎵 Rain by A, B');
  });
  it('says when nothing is playing', () => {
    expect(nowPlaying(null)).toMatch(/nothing/);
  });
});
