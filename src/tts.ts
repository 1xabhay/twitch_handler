// Chat read aloud to the streamer (macOS `say`, not captured by OBS): what to say for one message, or null to stay quiet.
import { PREFIX } from './emotes.ts';

const EMOTE = new RegExp(`(^|\\s)${PREFIX}\\w+`, 'g');

export const speakable = (name: string, text: string) => {
  const t = text.replace(EMOTE, ' ').replace(/\s+/g, ' ').trim().replace(/https?:\/\/\S+/g, 'a link');
  if (!t || t.startsWith('!')) return null;
  return `${name} says: ${t.slice(0, 200)}`;
};
