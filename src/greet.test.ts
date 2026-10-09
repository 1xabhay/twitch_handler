import { describe, expect, it } from 'vitest';
import { greet, type Viewers } from './greet.ts';

const sam = { userId: '1', userName: 'sam' };

describe('greet', () => {
  it('welcomes a first-time chatter and remembers them', () => {
    const { viewers, message } = greet({}, sam, 'stream-a');
    expect(message).toContain('@sam');
    expect(message).toMatch(/first/i);
    expect(viewers['1']).toEqual({ streams: 1, lastStream: 'stream-a' });
  });

  it('stays quiet when the viewer chats again in the same stream', () => {
    const first = greet({}, sam, 'stream-a');
    const again = greet(first.viewers, sam, 'stream-a');
    expect(again.message).toBeNull();
    expect(again.viewers).toBe(first.viewers);
  });

  it('welcomes a regular back with their stream count', () => {
    const seen: Viewers = { '1': { streams: 4, lastStream: 'stream-a' } };
    const { viewers, message } = greet(seen, sam, 'stream-b');
    expect(message).toContain('@sam');
    expect(message).toContain('5');
    expect(viewers['1']).toEqual({ streams: 5, lastStream: 'stream-b' });
  });

  it('does not mutate the previous state', () => {
    const seen: Viewers = { '1': { streams: 1, lastStream: 'stream-a' } };
    greet(seen, sam, 'stream-b');
    expect(seen['1']).toEqual({ streams: 1, lastStream: 'stream-a' });
  });
});
