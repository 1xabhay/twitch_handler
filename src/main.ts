// Imperative shell: Twitch I/O + file persistence. Logic lives in pure modules.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { EventSubChannelChatMessageEvent } from '@twurple/eventsub-base';
import { greet, type Viewers } from './greet.ts';
import { handleCommand, newDay, type Town } from './town.ts';
import { startOverlay } from './overlay.ts';
import { activeBuilders, handleCrowd, type Crowd } from './scene/crowd.ts';
import { phaseFromSun } from './scene/ambient.ts';
import { announce, current, handleTimer, type Timer } from './focus.ts';
import { canRequest, nowPlaying, parseMusic } from './music.ts';
import { spotifyClient } from './spotify.ts';
import { handleLink } from './links.ts';
import { earnChat, earnDone, earnPresence, handleWorkout, nextWorkout, type Gym } from './workout.ts';
import SunCalc from 'suncalc';

const { TWITCH_CLIENT_ID: clientId, TWITCH_CLIENT_SECRET: clientSecret, TWITCH_CHANNEL, TWITCH_BOT } = process.env;
if (!clientId || !clientSecret || !TWITCH_CHANNEL || !TWITCH_BOT) throw new Error('Missing TWITCH_* vars in .env');

const VIEWERS_FILE = 'data/viewers.json';
const TOWN_FILE = 'data/town.json';
const TIMER_FILE = 'data/timer.json';
const GYM_FILE = 'data/gym.json';
const OVERLAY_PORT = 3001;
const readJson = async <T>(path: string, fallback: T): Promise<T> =>
  readFile(path, 'utf8').then(JSON.parse, () => fallback);

// One token file per logged-in account (bot + broadcaster), created by `npm run login -- bot|channel`.
const auth = new RefreshingAuthProvider({ clientId, clientSecret });
auth.onRefresh((userId, token) => writeFile(`tokens/${userId}.json`, JSON.stringify(token, null, 2)));
for (const file of await readdir('tokens').catch(() => [])) {
  await auth.addUserForToken(await readJson(`tokens/${file}`, null as never));
}

const api = new ApiClient({ authProvider: auth });
const [channel, bot] = await Promise.all([TWITCH_CHANNEL, TWITCH_BOT].map((n) => api.users.getUserByName(n)));
if (!channel || !bot) throw new Error('TWITCH_CHANNEL or TWITCH_BOT not found on Twitch');

await mkdir('data', { recursive: true });
let viewers = await readJson<Viewers>(VIEWERS_FILE, {});
let town = await readJson<Town>(TOWN_FILE, {});
let timer = await readJson<Timer>(TIMER_FILE, null);
let lastPhase = current(timer, Date.now())?.i ?? null; // survives restarts without re-announcing
// Spotify song requests (optional): SPOTIFY_CLIENT_ID + `npm run login:spotify`. Allowlist rationale: docs/MUSIC.md.
const spotify = process.env.SPOTIFY_CLIENT_ID ? await spotifyClient(process.env.SPOTIFY_CLIENT_ID) : null;
const MUSIC_ALLOW = (process.env.MUSIC_ALLOW ?? 'StreamBeats,NCS').split(',').map((s) => s.trim()).filter(Boolean);
const MUSIC_ALLOW_ALL = process.env.MUSIC_ALLOW_ALL === 'true'; // at your own DMCA risk
const playlist = spotify && process.env.SPOTIFY_PLAYLIST ? await spotify.playlistId(process.env.SPOTIFY_PLAYLIST) : undefined;
let song: Awaited<ReturnType<NonNullable<typeof spotify>['current']>> = null;
const requests: Record<string, number> = {}; // userId → last request time
let gym = await readJson<Gym>(GYM_FILE, { wallet: {}, lastChat: {}, meter: 0, tier: 0, contributors: {}, pending: [], doneAt: [], enabled: true });
const saveGym = (next: Gym) => { if (next === gym) return; gym = next; push(state()); void writeFile(GYM_FILE, JSON.stringify(gym)); };
let crowd: Crowd = {}; // in memory only: presence doesn't need to survive restarts
const BOOT = Date.now(); // overlay reloads itself when this changes, so OBS never runs a stale page
// SUN_LAT/SUN_LON in .env (a city is precise enough) → sky follows the real sun; otherwise the overlay uses clock hours.
const [lat, lon] = [Number(process.env.SUN_LAT), Number(process.env.SUN_LON)];
const sunPhase = () => {
  if (!process.env.SUN_LAT || Number.isNaN(lat) || Number.isNaN(lon)) return undefined;
  const t = SunCalc.getTimes(new Date(), lat, lon);
  return phaseFromSun(Date.now(), { dawn: +t.dawn, sunrise: +t.sunrise, sunset: +t.sunset, dusk: +t.dusk });
};
const state = () => ({ type: 'state', boot: BOOT, phase: sunPhase(), timer, song, gym: { meter: gym.meter, tier: gym.tier, pending: gym.pending.length, enabled: gym.enabled }, town, builders: activeBuilders(crowd, Date.now()) });
const push = startOverlay(OVERLAY_PORT, state);
setInterval(() => push(state()), 60_000); // let quiet builders clock out
// Sent with the app token → the Chat Bot badge. Needs user:bot from the bot, which must be a mod (or channel:bot).
const say = (text: string) => api.chat.sendChatMessageAsApp(bot, channel, text);
const saveTimer = (next: Timer) => {
  timer = next;
  lastPhase = current(timer, Date.now())?.i ?? null;
  push(state());
  return writeFile(TIMER_FILE, JSON.stringify(timer));
};
setInterval(() => { // workouts fire at breaks (or anytime without a focus timer), capped per hour
  const c = current(timer, Date.now());
  const r = nextWorkout(gym, Date.now(), !timer || c?.phase.kind === 'break');
  if (!r.workout) return;
  saveGym(r.gym);
  push({ type: 'workout', ...r.workout });
  const by = r.workout.by.length ? `, courtesy of ${r.workout.by.map((n) => `@${n}`).join(' ')}` : '';
  say(`💪 workout time! isamy does ${r.workout.name}${by}`).catch((err) => console.error('workout announce failed', err));
}, 1000);
setInterval(() => saveGym(earnPresence(gym, activeBuilders(crowd, Date.now()).map((b) => b.id))), 10 * 60_000);
setInterval(() => { // announce each phase change; the overlay counts down on its own
  if (!timer) return;
  const c = current(timer, Date.now());
  if ((c?.i ?? null) === lastPhase) return;
  say(announce(c)).catch((err) => console.error('announce failed', err));
  void saveTimer(c ? timer : null);
}, 1000);
if (spotify) {
  console.log(`spotify connected${playlist ? ` · playlist "${process.env.SPOTIFY_PLAYLIST}"` : ''} · allow: ${MUSIC_ALLOW_ALL ? 'ANY' : MUSIC_ALLOW.join(', ')}`);
  setInterval(async () => { // now-playing card
    const next = await spotify.current().catch(() => song);
    if (next?.name !== song?.name) { song = next; push(state()); }
  }, 10_000);
}
const isFollower = async (userId: string) =>
  (await api.asUser(bot, (ctx) => ctx.channels.getChannelFollowers(channel, userId))).data.length > 0;
let streamId = (await api.streams.getStreamByUserId(channel))?.id ?? `offline-${new Date().toISOString().slice(0, 10)}`;

const listener = new EventSubWsListener({ apiClient: api });
listener.onSubscriptionCreateFailure((sub, err) => console.error(`subscribe failed: ${sub.id}`, err));
listener.onUserSocketDisconnect((_user, err) => console.error('eventsub disconnected', err ?? ''));
listener.onStreamOnline(channel, async (e) => {
  streamId = e.id;
  console.log(`live! stream ${streamId}`);
  // Optional: DISCORD_WEBHOOK (Server Settings → Integrations → Webhooks) gets a "we're live" post.
  if (!process.env.DISCORD_WEBHOOK) return;
  const title = (await api.channels.getChannelInfoById(channel))?.title ?? '';
  await fetch(process.env.DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: `@here the town lights are on 🏙️💡\n**isamy is live:** ${title}\ngrab a hard hat → https://twitch.tv/${channel.name}`,
      allowed_mentions: { parse: ['everyone'] }, // lets @here ping
    }),
  }).catch((err) => console.error('discord post failed', err));
});
listener.onChannelFollow(channel, bot, (e) => push({ type: 'follow', name: e.userDisplayName }));
listener.onChannelRaidTo(channel, (e) => push({ type: 'raid', from: e.raidingBroadcasterDisplayName, viewers: e.viewers }));
listener.onChannelChatMessage(channel, bot, (e) => handleChat(e).catch((err) => console.error('chat handler failed', err)));

const handleChat = async (e: EventSubChannelChatMessageEvent) => {
  console.log(`chat <${e.chatterName}> ${e.messageText}`);
  if (e.chatterId === bot.id && bot.id !== channel.id) return; // separate bot account: ignore our own messages
  const chatter = { userId: e.chatterId, userName: e.chatterDisplayName };

  const hello = greet(viewers, chatter, streamId);
  if (hello.message) {
    viewers = hello.viewers;
    await writeFile(VIEWERS_FILE, JSON.stringify(viewers, null, 2));
    await say(hello.message);
  }

  crowd = handleCrowd(crowd, chatter, e.messageText, Date.now());
  const word = e.messageText.trim().toLowerCase();
  if (word === '!join') await say(`@${chatter.userName} grabs a hard hat 👷`);
  if (word === '!leave') await say(`@${chatter.userName} clocks out 👋 (!join to come back)`);

  saveGym(earnChat(gym, chatter.userId, Date.now()));
  const isMod = 'broadcaster' in e.badges || 'moderator' in e.badges;
  if (word === '!newday' && isMod) {
    await writeFile(`data/town-${new Date().toLocaleDateString('en-CA')}.json`, JSON.stringify(town, null, 2)); // archive, never lose a day
    town = newDay(town);
    await writeFile(TOWN_FILE, JSON.stringify(town, null, 2));
    push(state());
    await say('🌅 new day, fresh lots! finished floors are archived, unfinished ones carried over. !task to start building');
  }
  const doneBefore = town[chatter.userId]?.floors.filter((f) => f.done).length ?? 0;
  const cmd = handleCommand(town, chatter, e.messageText);
  if (cmd && (cmd.town[chatter.userId]?.floors.filter((f) => f.done).length ?? 0) > doneBefore) saveGym(earnDone(gym, chatter.userId));
  if (cmd && cmd.town !== town) {
    town = cmd.town;
    await writeFile(TOWN_FILE, JSON.stringify(town, null, 2));
  }
  push(state());
  if (cmd) await say(cmd.reply);

  const w = handleWorkout(gym, chatter, isMod, e.messageText);
  if (w) { saveGym(w.gym); await say(w.reply); }

  const link = handleLink(e.messageText, { discord: process.env.LINK_DISCORD, insta: process.env.LINK_INSTA, playlist: process.env.LINK_PLAYLIST });
  if (link) await say(link);

  const music = parseMusic(e.messageText);
  if (music && spotify) await handleMusic(music, chatter, isMod).then(say, (err) => {
    console.error('music failed', err);
    return say(`@${chatter.userName} spotify hiccup 😵 is music playing on the stream PC?`);
  });
  const t = handleTimer(timer, { isMod }, e.messageText, Date.now());
  if (t) {
    if (t.timer !== timer) await saveTimer(t.timer);
    await say(t.reply);
  }
};
async function handleMusic(m: NonNullable<ReturnType<typeof parseMusic>>, { userId, userName }: { userId: string; userName: string }, isMod: boolean) {
  if (m.cmd === 'song') return nowPlaying(song);
  if (m.cmd === 'skip') return isMod ? (await spotify!.next(), '⏭️ skipped') : `@${userName} only mods can skip`;
  if (!m.query) return `@${userName} try: !sr <song or artist>`;
  const ok = canRequest(requests, { userId, isMod, isFollower: isMod || (await isFollower(userId)) }, Date.now());
  if (!ok.ok) return `@${userName} ${ok.reason}`;
  const track = await spotify!.findCleared(m.query, MUSIC_ALLOW, MUSIC_ALLOW_ALL);
  if (!track) return `@${userName} couldn't find a stream-safe match 🎧 try StreamBeats or NCS songs`;
  await spotify!.queue(track.uri);
  if (playlist) await spotify!.addToPlaylist(playlist, track.uri).catch((err) => console.error('playlist add failed', err));
  requests[userId] = Date.now();
  return `@${userName} queued 🎶 ${track.name} by ${track.artists.join(', ')}`;
}
listener.start();
console.log(`listening to #${channel.name} as ${bot.name} (stream: ${streamId})`);
console.log(`town overlay: http://localhost:${OVERLAY_PORT}/town`);
