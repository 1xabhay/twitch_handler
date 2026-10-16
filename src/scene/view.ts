// What the town overlay covers: the whole screen with the old city behind (default), or just a strip at the bottom over the camera.
export type View = 'city' | 'bottom';
const HELLO: Record<View, string> = {
  city: '🏙️ full city view, the whole screen is skyline',
  bottom: '📷 bottom view, the city tucks under the camera',
};

export const handleView = (view: View, { isMod }: { isMod: boolean }, text: string) => {
  const arg = text.trim().toLowerCase().match(/^!view(?:\s+(\S+))?$/);
  if (!arg) return null;
  const pick = arg[1];
  if (!pick) return { view, reply: `🖼️ view: ${view} (mods: !view city or !view bottom)` };
  if (!isMod) return { view, reply: '🖼️ only mods can change the view' };
  if (pick !== 'city' && pick !== 'bottom') return { view, reply: '🖼️ views: city, bottom' };
  return { view: pick as View, reply: HELLO[pick as View] };
};
