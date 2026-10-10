// One-time Spotify login (Authorization Code + PKCE, no client secret). Saves data/spotify.token.json (gitignored).
// Usage: npm run login:spotify   — needs SPOTIFY_CLIENT_ID in .env and redirect URI http://127.0.0.1:3002/callback on the app.
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';

const clientId = process.env.SPOTIFY_CLIENT_ID;
if (!clientId) throw new Error('Add SPOTIFY_CLIENT_ID to .env first');
const redirect = 'http://127.0.0.1:3002/callback';
const scope = 'user-modify-playback-state user-read-playback-state user-read-currently-playing playlist-read-private playlist-modify-private playlist-modify-public';
const verifier = randomBytes(48).toString('base64url');
const state = randomBytes(16).toString('hex');
const url = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  client_id: clientId, response_type: 'code', redirect_uri: redirect, scope, state,
  code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url'),
})}`;

const server = createServer(async (req, res) => {
  const u = new URL(req.url ?? '/', redirect);
  if (u.pathname !== '/callback') return res.writeHead(404).end();
  const code = u.searchParams.get('code');
  if (u.searchParams.get('state') !== state || !code) {
    res.end(`Spotify login failed: ${u.searchParams.get('error') ?? 'bad state'}`);
    return server.close();
  }
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: clientId, code_verifier: verifier }),
  });
  const t = await r.json();
  if (!t.refresh_token) {
    res.end('Spotify login failed, check the terminal');
    console.error('token exchange failed:', t.error, t.error_description);
    return server.close();
  }
  await mkdir('data', { recursive: true });
  await writeFile('data/spotify.token.json', JSON.stringify({ accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: Date.now() + t.expires_in * 1000 }, null, 2));
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end('Spotify connected ✓ you can close this tab');
  console.log('Spotify connected → data/spotify.token.json');
  server.close();
}).listen(3002, '127.0.0.1', () => {
  console.log('Opening Spotify login in your browser…');
  exec(`open "${url}"`);
});
