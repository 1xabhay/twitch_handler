import { describe, expect, it } from 'vitest';
import { handleTheme, parseCalendar, scheduled, settled, steer, themeOn, tide, TIDE, THEMES } from './theme.ts';

const fri = new Date(2026, 9, 16, 12), sat = new Date(2026, 9, 17, 12), oneDay = new Date(2026, 6, 22, 12); // local dates

describe('calendar', () => {
  it('reads weekdays and MM-DD dates per theme, dropping unknown themes', () => {
    expect(parseCalendar('onepiece: Fri, 07-22 ; nope:mon')).toEqual([{ theme: 'onepiece', days: ['fri', '07-22'] }]);
    expect(parseCalendar(undefined)).toEqual([]);
  });
  it('a weekday or a date turns the theme on', () => {
    const cal = parseCalendar('onepiece:fri,07-22');
    expect(scheduled(cal, fri)).toBe('onepiece');
    expect(scheduled(cal, oneDay)).toBe('onepiece'); // a Wednesday in 2026
    expect(scheduled(cal, sat)).toBe(null);
  });
});

describe('themeOn', () => {
  const cal = parseCalendar('onepiece:fri');
  it('follows the calendar unless a mod overrode today', () => {
    expect(themeOn(cal, null, fri)).toBe('onepiece');
    expect(themeOn(cal, { date: '2026-10-16', theme: null }, fri)).toBe(null);
    expect(themeOn(cal, { date: '2026-10-17', theme: 'onepiece' }, sat)).toBe('onepiece');
  });
  it('an override expires at midnight', () => {
    expect(themeOn(cal, { date: '2026-10-16', theme: null }, sat)).toBe(null); // saturday: calendar says plain anyway
    expect(themeOn([], { date: '2026-10-16', theme: 'onepiece' }, sat)).toBe(null);
  });
});

describe('handleTheme', () => {
  const cal = parseCalendar('onepiece:fri'), mod = { isMod: true }, viewer = { isMod: false };
  it('anyone can ask what is on', () => {
    expect(handleTheme(null, cal, viewer, '!theme', +fri)?.reply).toMatch(/Grand Line/);
    expect(handleTheme(null, cal, viewer, '!theme', +fri)?.override).toBe(null);
  });
  it('mods switch today, off, or back to the calendar', () => {
    expect(handleTheme(null, cal, mod, '!theme onepiece', +sat)?.override).toEqual({ date: '2026-10-17', theme: 'onepiece' });
    expect(handleTheme(null, cal, mod, '!theme off', +fri)?.override).toEqual({ date: '2026-10-16', theme: null });
    expect(handleTheme({ date: '2026-10-16', theme: null }, cal, mod, '!theme auto', +fri)?.override).toBe(null);
  });
  it('viewers cannot switch, unknown names list the choices', () => {
    const o = { date: '2026-10-16', theme: null };
    expect(handleTheme(o, cal, viewer, '!theme onepiece', +fri)?.override).toBe(o);
    expect(handleTheme(null, cal, mod, '!theme disco', +fri)?.reply).toMatch(/onepiece/);
  });
  it('ignores other commands', () => {
    expect(handleTheme(null, cal, mod, '!themes', +fri)).toBe(null);
  });
  it('no em dashes in chat copy', () => {
    for (const text of ['!theme', '!theme onepiece', '!theme off', '!theme auto', '!theme x'])
      expect(handleTheme(null, cal, mod, text, +fri)!.reply).not.toMatch(/—/);
    for (const t of Object.values(THEMES)) expect(t.hello + t.bye).not.toMatch(/—/);
  });
});

describe('the tide (theme switch on screen)', () => {
  it('starts settled: a reload never replays the switch', () => {
    expect(tide(settled('onepiece'), 0)).toBe(1);
  });
  it('washes the new theme in over TIDE ms', () => {
    const s = steer(settled(null), 'onepiece', 1000);
    expect(s).toEqual({ from: null, to: 'onepiece', since: 1000 });
    expect(tide(s, 1000 + TIDE / 2)).toBe(0.5);
    expect(tide(s, 1000 + TIDE * 2)).toBe(1);
    expect(steer(s, 'onepiece', 5000)).toBe(s); // same wish, no restart
  });
  it('reversing mid-tide starts from whichever theme covers most of the street', () => {
    const s = steer(settled(null), 'onepiece', 0);
    expect(steer(s, null, TIDE * 0.2).from).toBe(null);
    expect(steer(s, null, TIDE * 0.8).from).toBe('onepiece');
  });
});
