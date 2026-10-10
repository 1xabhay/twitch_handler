// Song requests: pure rules. Spotify I/O lives in spotify.ts. Why an allowlist: docs/MUSIC.md.
export const COOLDOWN_MS = 10 * 60_000;
const MAX_QUERY = 100;

export const parseMusic = (text: string) => {
  const [, cmd = '', rest = ''] = text.trim().match(/^!(\w+)\s*(.*)$/s) ?? [];
  switch (cmd.toLowerCase()) {
    case 'sr': return { cmd: 'sr' as const, query: rest.trim().slice(0, MAX_QUERY) };
    case 'song': return { cmd: 'song' as const };
    case 'skip': return { cmd: 'skip' as const };
    default: return null;
  }
};

type Who = { userId: string; isFollower: boolean; isMod: boolean };
export const canRequest = (last: Readonly<Record<string, number>>, { userId, isFollower, isMod }: Who, now: number) => {
  if (isMod) return { ok: true } as const;
  if (!isFollower) return { ok: false, reason: 'song requests are for followers 💜 hit follow and try again' } as const;
  const wait = (last[userId] ?? -Infinity) + COOLDOWN_MS - now;
  return wait > 0 ? { ok: false, reason: `one request per 10 min, try again in ${Math.ceil(wait / 60_000)} min ⏳` } as const : { ok: true } as const;
};

// Cleared = album label or any artist matches the allowlist (StreamBeats/NCS publish under many artist names).
export const isCleared = ({ label, artists }: { label: string; artists: string[] }, allow: string[], allowAll: boolean) =>
  allowAll || [label, ...artists].some((name) => allow.some((a) => name.toLowerCase().includes(a.toLowerCase())));

export const nowPlaying = (track: { name: string; artists: string[] } | null) =>
  track ? `🎵 ${track.name} by ${track.artists.join(', ')}` : 'nothing playing right now 🤫';
