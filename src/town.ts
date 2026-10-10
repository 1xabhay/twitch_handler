import type { Chatter } from './greet.ts';

export type Floor = { task: string; done: boolean };
export type Building = { name: string; floors: Floor[] };
export type Town = Readonly<Record<string, Building>>;

const MAX_TASK = 60;

// Each !task adds a floor (numbered from 1 at the bottom). Open floors are under construction;
// !done N finishes one, !remove N drops an open one, !tasks lists what's open.
// Fresh start for a new day: finished floors go, unfinished ones carry over (renumbered from 1).
export const newDay = (town: Town): Town =>
  Object.fromEntries(Object.entries(town).flatMap(([id, b]) => {
    const floors = b.floors.filter((f) => !f.done);
    return floors.length ? [[id, { ...b, floors }]] : [];
  }));

export const handleCommand = (town: Town, { userId, userName }: Chatter, text: string) => {
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
      return save([...floors, { task, done: false }], `floor ${floors.length + 1} under construction: "${task}" 🏗️`);
    }
    case 'done': {
      const k = rest.trim() ? n : openNums.length === 1 ? openNums[0]! : null;
      if (!openNums.length) return keep(`nothing under construction. !task <thing> first 👀`);
      if (!rest.trim() && openNums.length > 1) return keep(`which one? ${openNums.map((i) => `!done ${i}`).join(' / ')}`);
      if (!isOpen(k)) return keep(`no open floor ${rest.trim()}. try !tasks`);
      const next = floors.map((f, i) => (i + 1 === k ? { ...f, done: true } : f));
      const all = next.every((f) => f.done);
      return save(next, `floor ${k} done: "${floors[k - 1]!.task}"! lights on 💡${all ? ' building complete 🚩' : ''}`);
    }
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
