// Themes: a skin over the same city. Buildings keep their kind and lot; a theme swaps blocks, names and copy.
// Which theme is on: the calendar (THEMES in .env), unless a mod overrode it for today.
import type { KitPatch } from './blocks.ts';
import type { Kind } from './city.ts';
import { onepiece } from './themes/onepiece.ts';

export type Theme = { name: string; hello: string; bye: string; names: Partial<Record<Kind, string>>; kit: KitPatch };
export const THEMES: Record<string, Theme> = { onepiece };
export type ThemeId = string | null; // null = the plain city

// "onepiece:fri,07-22;other:12-25" → one rule per theme; days are weekdays (sun..sat) or MM-DD dates.
export type Calendar = { theme: string; days: string[] }[];
export const parseCalendar = (spec: string | undefined): Calendar =>
  (spec ?? '').split(';').map((rule) => {
    const [id = '', days = ''] = rule.split(':');
    return { theme: id.trim().toLowerCase(), days: days.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean) };
  }).filter((r) => r.theme in THEMES && r.days.length);

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const dayOf = (d: Date) => d.toLocaleDateString('en-CA'); // local YYYY-MM-DD, like the town archive
export const scheduled = (cal: Calendar, d: Date): ThemeId =>
  cal.find((r) => r.days.includes(WEEKDAYS[d.getDay()]!) || r.days.includes(dayOf(d).slice(5)))?.theme ?? null;

// A mod's pick holds for the rest of the day, then the calendar takes over again.
export type Override = { date: string; theme: ThemeId } | null;
export const themeOn = (cal: Calendar, o: Override, d: Date): ThemeId =>
  o && o.date === dayOf(d) ? o.theme : scheduled(cal, d);

const nameOf = (id: ThemeId) => (id ? THEMES[id]!.name : 'the plain city');
// !theme (anyone): what's on and the calendar. Mods: !theme <id> | off (today), !theme auto (back to the calendar).
export const handleTheme = (o: Override, cal: Calendar, { isMod }: { isMod: boolean }, text: string, now: number) => {
  const arg = text.trim().toLowerCase().match(/^!theme(?:\s+(\S+))?$/);
  if (!arg) return null;
  const d = new Date(now), pick = arg[1];
  if (!pick) {
    const plan = cal.map((r) => `${THEMES[r.theme]!.name} on ${r.days.join(', ')}`).join(' · ') || 'no theme days set';
    return { override: o, reply: `🎨 today: ${nameOf(themeOn(cal, o, d))} · ${plan}` };
  }
  if (!isMod) return { override: o, reply: '🎨 only mods can change the theme' };
  if (pick === 'auto') return { override: null, reply: `🎨 back to the calendar: ${nameOf(scheduled(cal, d))} today` };
  if (pick !== 'off' && !(pick in THEMES)) return { override: o, reply: `🎨 themes: ${Object.keys(THEMES).join(', ')}, off, auto` };
  const theme = pick === 'off' ? null : pick, was = themeOn(cal, o, d);
  return { override: { date: dayOf(d), theme }, reply: theme ? THEMES[theme]!.hello : was ? THEMES[was]!.bye : '🎨 plain city it is' };
};

// The tide: on screen, a new theme washes in across the street over TIDE ms. Two states: settled (from = to), turning.
export const TIDE = 6000;
export type Tide = { from: ThemeId; to: ThemeId; since: number };
export const settled = (id: ThemeId): Tide => ({ from: id, to: id, since: 0 });
export const tide = (s: Tide, now: number) => (s.from === s.to ? 1 : Math.min(1, Math.max(0, (now - s.since) / TIDE)));
export const steer = (s: Tide, wanted: ThemeId, now: number): Tide =>
  wanted === s.to ? s : { from: tide(s, now) < 0.5 ? s.from : s.to, to: wanted, since: now };
