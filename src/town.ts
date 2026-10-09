import type { Chatter } from './greet.ts';

export type Building = { name: string; floors: number; task: string | null };
export type Town = Readonly<Record<string, Building>>;

const MAX_TASK = 60;

// !task <text> lights a window in your building; !done finishes it and adds a floor.
export const handleCommand = (town: Town, { userId, userName }: Chatter, text: string) => {
  const [, cmd, rest = ''] = text.match(/^!(\w+)\s*(.*)$/s) ?? [];
  const mine = town[userId] ?? { name: userName, floors: 0, task: null };
  const save = (b: Building): Town => ({ ...town, [userId]: { ...b, name: userName } });

  switch (cmd?.toLowerCase()) {
    case 'task': {
      const task = rest.trim().slice(0, MAX_TASK);
      if (!task) return { town, reply: `@${userName} try: !task <what you're working on> 🔨` };
      return { town: save({ ...mine, task }), reply: `@${userName} lights a window: "${task}" 💡` };
    }
    case 'done': {
      if (!mine.task) return { town, reply: `@${userName} nothing to finish yet. !task <thing> first 👀` };
      const floors = mine.floors + 1;
      return { town: save({ ...mine, floors, task: null }), reply: `@${userName} finished "${mine.task}"! building's now ${floors} floor${floors === 1 ? '' : 's'} tall 🏢` };
    }
    default:
      return null;
  }
};
