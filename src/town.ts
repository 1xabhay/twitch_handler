import type { Chatter } from './greet.ts';
import { FOCUS_ID, landmarkFor, pickKind, type Kind } from './scene/city.ts';

export type Floor = { task: string; done: boolean; kind?: Kind; at?: number }; // kind/at: what it builds, when opened
export type Building = { name: string; floors: Floor[] };
export type Town = Readonly<Record<string, Building>>;

const MAX_TASK = 60, MAX_OPEN = 10; // per viewer: one person can't flood the street

// Each !task adds a floor (numbered from 1 at the bottom). Open floors are under construction;
// !done N finishes one, !remove N drops an open one, !tasks lists what's open.
// Fresh start for a new day: finished floors go, unfinished ones carry over (renumbered from 1).
export const newDay = (town: Town): Town =>
  Object.fromEntries(Object.entries(town).flatMap(([id, b]) => {
    const floors = b.floors.filter((f) => !f.done);
    return floors.length ? [[id, { ...b, floors }]] : [];
  }));

// rand/now come from the shell so this stays pure: rand rolls the building, now orders it on the street.
// The streamer's focus blocks build landmarks: one starts with each focus block and opens when the block ends
// on time; stopping or skipping mid-block lets it wither. min = length of the phase being entered.
type Step = { wasFocus: boolean; isFocus: boolean; natural: boolean; min: number };
export const stepLandmark = (town: Town, { wasFocus, isFocus, natural, min }: Step, rand: number, now: number): Town => {
  if (!wasFocus && !isFocus) return town;
  let floors = town[FOCUS_ID]?.floors ?? [];
  if (wasFocus) floors = natural ? floors.map((f) => (f.done ? f : { ...f, done: true })) : floors.filter((f) => f.done);
  if (isFocus) floors = [...floors, { task: 'focus', done: false, kind: landmarkFor(min, rand), at: now }];
  return { ...town, [FOCUS_ID]: { name: 'focus', floors } };
};

export const handleCommand = (town: Town, { userId, userName }: Chatter, text: string, rand = Math.random(), now = Date.now()) => {
  const [, cmd, rest = ''] = text.match(/^!(\w+)\s*(.*)$/s) ?? [];
  const floors = town[userId]?.floors ?? [];
  const at = (s: string) => `@${userName} ${s}`;
  const keep = (reply: string) => ({ town, reply: at(reply) });
  const save = (next: Floor[], reply: string) =>
    ({ town: { ...town, [userId]: { name: userName, floors: next } } as Town, reply: at(reply) });

  const openNums = floors.flatMap((f, i) => (f.done ? [] : [i + 1]));
  const n = /^\d+$/.test(rest.trim()) ? Number(rest.trim()) : null;
  const isOpen = (k: number | null): k is number => k !== null && openNums.includes(k);

  switch (cmd?.toLowerCase()) {
    case 'task': {
      const task = rest.trim().slice(0, MAX_TASK);
      if (!task) return keep(`try: !task <what you're working on> 🔨`);
      if (openNums.length >= MAX_OPEN) return keep(`${MAX_OPEN} things under construction already 😅 !done one first`);
      const kind = pickKind(rand);
      return save([...floors, { task, done: false, kind, at: now }], `floor ${floors.length + 1}: a ${kind} is going up for "${task}" 🏗️`);
    }
    case 'done': { // !done, !done 2, !done 1 3 5
      const words = rest.trim() ? rest.trim().split(/[\s,]+/) : [];
      if (!openNums.length) return keep(`nothing under construction. !task <thing> first 👀`);
      if (!words.length && openNums.length > 1) return keep(`which one? ${openNums.map((i) => `!done ${i}`).join(' / ')}`);
      const ks = words.length ? words.map((w) => (/^\d+$/.test(w) ? Number(w) : null)) : [openNums[0]!];
      const bad = words.filter((_, i) => !isOpen(ks[i] ?? null));
      if (bad.length) return keep(`no open floor ${bad.join(' ')}. try !tasks`);
      const next = floors.map((f, i) => (ks.includes(i + 1) ? { ...f, done: true } : f));
      return save(next, ks.length === 1
        ? `floor ${ks[0]} done: "${floors[ks[0]! - 1]!.task}"! lights on 💡`
        : `floors ${ks.join(', ')} done! lights on 💡`);
    }
    case 'help':
      return keep(`🏙️ !task <thing> puts up a building under scaffolding · !done N lights it up · !tasks lists yours · the streamer's focus blocks build landmarks`);
    case 'tasks':
      return openNums.length
        ? keep(`🏗️ ${openNums.map((i) => `${i}: ${floors[i - 1]!.task}`).join(' · ')}`)
        : keep(`no open floors. !task <thing> to start one`);
    case 'remove': {
      if (n !== null && floors[n - 1]?.done) return keep(`floor ${n} is finished, it stays forever 🏢`);
      if (!isOpen(n)) return keep(`try: !remove <floor number>. !tasks shows them`);
      return save(floors.filter((_, i) => i + 1 !== n), `floor ${n} removed. floors above slide down 🧱`);
    }
    default:
      return null;
  }
};
