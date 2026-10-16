import { describe, expect, it } from 'vitest';
import { builtToday, finishedSince, handleCommand, newDay, stepLandmark, type Floor, type Town } from './town.ts';
import { FOCUS_ID, landmarkFor, POOL } from './scene/city.ts';

const sam = { userId: '1', userName: 'sam' };
const open = (task: string) => ({ task, done: false });
const done = (task: string) => ({ task, done: true });
const plain = (fs?: Floor[]) => fs?.map(({ task, done }) => ({ task, done })); // ignore timestamps
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

    it('says the building by its theme name when a theme is on', () => {
      expect(handleCommand({}, sam, '!task x', 0, 42, { [POOL[0]!]: 'canal house' })?.reply).toContain('a canal house is going up');
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
      expect(plain(r?.town['1']?.floors)).toEqual([open('a'), done('b'), open('c')]);
      expect(town['1']?.floors[1]).toEqual(open('b')); // previous state untouched
    });

    it('bare !done finishes the only open floor', () => {
      const r = handleCommand(samWith(done('a'), open('b')), sam, '!done');
      expect(plain(r?.town['1']?.floors)).toEqual([done('a'), done('b')]);
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

    it('!done 1 3 finishes several floors at once', () => {
      const r = handleCommand(samWith(open('a'), open('b'), open('c')), sam, '!done 1 3');
      expect(plain(r?.town['1']?.floors)).toEqual([done('a'), open('b'), done('c')]);
      expect(r?.reply).toMatch(/1.*3/);
    });

    it('!done with any number that is not open changes nothing and says which', () => {
      const town = samWith(open('a'), done('b'));
      const r = handleCommand(town, sam, '!done 1 2');
      expect(r?.town).toBe(town);
      expect(r?.reply).toContain('2');
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

describe('onboarding and limits', () => {
  it('!help explains the city loop', () => {
    const r = handleCommand({}, sam, '!help');
    expect(r?.reply).toContain('!task');
    expect(r?.reply).toContain('!done');
    expect(r?.town).toEqual({});
  });

  it('!task says what is going up, so viewers can spot theirs without names on screen', () => {
    expect(handleCommand({}, sam, '!task read', 0, 1)?.reply).toContain(POOL[0]);
  });

  it('caps open tasks per viewer so a flood cannot fill the street', () => {
    const town = samWith(...Array.from({ length: 10 }, (_, i) => open(`t${i}`)));
    const r = handleCommand(town, sam, '!task one more');
    expect(r?.town).toBe(town);
    expect(r?.reply).toContain('!done');
  });
});

describe('replies name the building', () => {
  it('!task uses the right article', () => {
    const apt = POOL.indexOf('apartment') / POOL.length;
    expect(handleCommand({}, sam, '!task read', apt)?.reply).toContain('an apartment is going up');
  });

  it('!done names what was built', () => {
    const r = handleCommand(samWith({ ...open('essay'), kind: 'school' }), sam, '!done 1');
    expect(r?.reply).toContain('school');
    expect(r?.reply).toContain('essay');
  });

  it('!done of several names each building', () => {
    const r = handleCommand(samWith({ ...open('a'), kind: 'shop' }, { ...open('b'), kind: 'pool' }), sam, '!done 1 2');
    expect(r?.reply).toContain('shop');
    expect(r?.reply).toContain('pool');
  });

  it('!remove and !cancel name what was abandoned', () => {
    const town = samWith({ ...open('essay'), kind: 'arena' });
    for (const cmd of ['!remove 1', '!cancel 1']) {
      const r = handleCommand(town, sam, cmd);
      expect(r?.town['1']?.floors).toEqual([]);
      expect(r?.reply).toContain('arena');
      expect(r?.reply).toContain('abandoned');
    }
  });
});

describe('!where and the break roll call', () => {
  it('!done stamps when it was finished', () => {
    const r = handleCommand(samWith(open('a')), sam, '!done', 0, 99);
    expect(r?.town['1']?.floors[0]).toEqual({ ...done('a'), doneAt: 99 });
  });

  it('!where tells you what to look for and changes nothing', () => {
    const town = samWith({ ...open('a'), kind: 'shop' }, { ...done('b'), kind: 'arena' });
    const r = handleCommand(town, sam, '!where');
    expect(r?.town).toBe(town);
    expect(r?.reply).toContain('shop');
    expect(r?.reply).toContain('arena');
  });

  it('finishedSince names everyone who finished something in the window, once each, never the landmarks', () => {
    const town: Town = {
      '1': { name: 'sam', floors: [{ ...done('a'), doneAt: 50 }, { ...done('b'), doneAt: 60 }] },
      '2': { name: 'jo', floors: [{ ...done('c'), doneAt: 10 }] },
      [FOCUS_ID]: { name: 'focus', floors: [{ ...done('l'), doneAt: 70 }] },
    };
    expect(finishedSince(town, 40)).toEqual(['sam']);
  });
});

describe('reply wording (skyline city)', () => {
  const all = (town: Town) => ['!task x', '!done 1', '!done 9', '!done', '!tasks', '!where', '!help', '!cancel 1', '!cancel 9', '!cancel']
    .map((c) => handleCommand(town, sam, c, POOL.indexOf('watertower') / POOL.length)!.reply);

  it('never talks about floors or streets, and has no em dashes', () => {
    for (const town of [{}, samWith({ ...open('a'), kind: 'watertower' }), samWith({ ...done('a'), kind: 'ferris' }, open('b'))])
      for (const r of all(town)) expect(r).not.toMatch(/floor|street|—/i);
  });

  it('numbers tasks as #N and spells building names out', () => {
    const r = handleCommand(samWith(done('a')), sam, '!task tea', POOL.indexOf('watertower') / POOL.length);
    expect(r?.reply).toContain('#2');
    expect(r?.reply).toContain('a water tower');
    expect(handleCommand(samWith(open('a'), open('b')), sam, '!tasks')?.reply).toContain('#1 a · #2 b');
    expect(handleCommand(samWith({ ...open('a'), kind: 'clocktower' }), sam, '!done 1')?.reply).toContain('#1 done');
  });
});

describe('builtToday', () => {
  it('counts finished buildings and landmarks', () => {
    const town: Town = { ...samWith(done('a'), open('b'), done('c')), [FOCUS_ID]: { name: 'focus', floors: [done('l'), open('m')] } };
    expect(builtToday(town)).toEqual({ built: 2, landmarks: 1 });
  });
});
