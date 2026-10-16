import { describe, expect, it } from 'vitest';
import { speakable } from './tts.ts';

describe('speakable', () => {
  it('reads the name, then the message', () => {
    expect(speakable('Bob', 'hi there')).toBe('Bob says: hi there');
  });

  it('skips commands and empty messages', () => {
    expect(speakable('Bob', '!task write essay')).toBeNull();
    expect(speakable('Bob', '   ')).toBeNull();
  });

  it('says "a link" instead of spelling out URLs', () => {
    expect(speakable('Bob', 'look https://example.com/a?b=c nice')).toBe('Bob says: look a link nice');
  });

  it('skips channel emotes, and stays quiet for an emote-only message', () => {
    expect(speakable('Bob', 'done! heyisamLit heyisamLit')).toBe('Bob says: done!');
    expect(speakable('Bob', 'heyisamBrick')).toBeNull();
  });

  it('cuts long messages short', () => {
    expect(speakable('Bob', 'a'.repeat(500))!.length).toBeLessThanOrEqual(220);
  });
});
