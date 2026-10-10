// Thin Spotify Web API client: refreshes + persists its token, nothing else clever.
import { readFile, writeFile } from 'node:fs/promises';
import { isCleared } from './music.ts';

const TOKEN_FILE = 'data/spotify.token.json';
type Token = { accessToken: string; refreshToken: string; expiresAt: number };
export type Track = { uri: string; name: string; artists: string[]; label: string; art?: string };

export const spotifyClient = async (clientId: string) => {
  let tok: Token | null = await readFile(TOKEN_FILE, 'utf8').then(JSON.parse, () => null);
  if (!tok) return null;

  const refresh = async (t: Token) => {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refreshToken, client_id: clientId }),
    });
    const j = await r.json();
    if (!j.access_token) throw new Error(`spotify refresh failed: ${j.error}`);
    const next = { accessToken: j.access_token, refreshToken: j.refresh_token ?? t.refreshToken, expiresAt: Date.now() + j.expires_in * 1000 };
    await writeFile(TOKEN_FILE, JSON.stringify(next, null, 2));
    return next;
  };

  const call = async (method: string, path: string, body?: unknown) => {
    if (Date.now() > tok!.expiresAt - 60_000) tok = await refresh(tok!);
    const r = await fetch(`https://api.spotify.com/v1${path}`, {
      method,
      headers: { Authorization: `Bearer ${tok!.accessToken}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`spotify ${method} ${path.split('?')[0]} → ${r.status} ${text}`);
    return (r.headers.get('content-type') ?? '').includes('json') && text ? JSON.parse(text) : null; // some endpoints reply with plain text or nothing
  };

  const labels = new Map<string, string>(); // album id → label
  const label = async (albumId: string) =>
    labels.get(albumId) ?? (await call('GET', `/albums/${albumId}`).then((a) => (labels.set(albumId, a.label ?? ''), a.label ?? '')));

  return {
    // First search hit that passes the allowlist (checks album labels lazily, cached).
    findCleared: async (q: string, allow: string[], allowAll: boolean): Promise<Track | null> => {
      const res = await call('GET', `/search?type=track&limit=10&q=${encodeURIComponent(q)}`);
      for (const t of res?.tracks?.items ?? []) {
        const track = { uri: t.uri, name: t.name, artists: t.artists.map((a: { name: string }) => a.name), label: allowAll ? '' : await label(t.album.id) };
        if (isCleared(track, allow, allowAll)) return track;
      }
      return null;
    },
    queue: (uri: string) => call('POST', `/me/player/queue?uri=${encodeURIComponent(uri)}`),
    next: () => call('POST', '/me/player/next'),
    current: async () => {
      const c = await call('GET', '/me/player/currently-playing');
      return c?.item && c.is_playing
        ? { name: c.item.name as string, artists: c.item.artists.map((a: { name: string }) => a.name) as string[], art: c.item.album?.images?.[0]?.url as string | undefined }
        : null;
    },
    playlistId: async (name: string) =>
      ((await call('GET', '/me/playlists?limit=50'))?.items ?? []).find((p: { name: string }) => p.name === name)?.id as string | undefined,
    addToPlaylist: (id: string, uri: string) => call('POST', `/playlists/${id}/items`, { uris: [uri] }),
  };
};
