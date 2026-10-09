export type Viewer = { streams: number; lastStream: string };
export type Viewers = Readonly<Record<string, Viewer>>;
export type Chatter = { userId: string; userName: string };

// Greets each chatter once per stream: first-timers vs returning regulars.
export const greet = (viewers: Viewers, { userId, userName }: Chatter, streamId: string) => {
  const seen = viewers[userId];
  if (seen?.lastStream === streamId) return { viewers, message: null };

  const streams = (seen?.streams ?? 0) + 1;
  const message = seen
    ? `@${userName} returns for round ${streams}. legend. 🕹️`
    : `a wild @${userName} appears! 👀 first time? we don't bite (much)`;
  return { viewers: { ...viewers, [userId]: { streams, lastStream: streamId } }, message };
};
