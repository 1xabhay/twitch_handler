// !raid (mods): small live streams in our category, the ones most likely to notice a raid and raid back.
export type LiveStream = { userId: string; userName: string; viewers: number; startDate: Date };

const SMALL = 30, ALIVE = 2; // 0-1 watching is usually a stream that just started or nobody's chatting in

export const raidPicks = (streams: LiveStream[], selfId: string, now: number) => {
  const picks = streams.filter((x) => x.userId !== selfId && x.viewers >= ALIVE && x.viewers <= SMALL).sort((a, b) => a.viewers - b.viewers).slice(0, 3);
  if (!picks.length) return '🚌 no small co-working streams live right now, try again in a bit';
  const h = (d: Date) => Math.max(0, Math.floor((now - d.getTime()) / 3_600_000));
  return `🚌 raid ideas: ${picks.map((x) => `${x.userName} (${x.viewers} watching, ${h(x.startDate)}h in)`).join(' · ')}`;
};
