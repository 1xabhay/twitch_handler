// Chat read aloud to the streamer (macOS `say`, not captured by OBS): what to say for one message, or null to stay quiet.
export const speakable = (name: string, text: string) => {
  const t = text.trim().replace(/https?:\/\/\S+/g, 'a link');
  if (!t || t.startsWith('!')) return null;
  return `${name} says: ${t.slice(0, 200)}`;
};
