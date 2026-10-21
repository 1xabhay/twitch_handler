// Imperative shell: Twitch I/O + file persistence. Logic lives in pure modules.
import { readFile, readdir, writeFile, mkdir, rename } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { EventSubChannelChatMessageEvent } from '@twurple/eventsub-base';
import { greet, type Viewers } from './greet.ts';
import { builtToday, finishedSince, handleCommand, newDay, stepLandmark, type Town } from './town.ts';
import { codeRev, startOverlay } from './overlay.ts';
import { activeBuilders, handleCrowd, type Crowd } from './scene/crowd.ts';
import { phaseFromSun, weatherOfCode, type Weather } from './scene/ambient.ts';
import { skyAt } from './scene/sky.ts';
import { FOCUS_ID, nameOf } from './scene/city.ts';
import { announce, current, handleTimer, PRESETS, type Current, type Timer } from './focus.ts';
import { canRequest, nowPlaying, parseMusic } from './music.ts';
import { spotifyClient } from './spotify.ts';
import { handleLink } from './links.ts';
import { speakable } from './tts.ts';
import { raidPicks } from './raid.ts';
import { handleView, type View } from './scene/view.ts';
import { handleTheme, parseCalendar, themeOn, THEMES, type Override } from './scene/theme.ts';
import { LADDER, handleWorkout, nextWorkout, redeem, type Gym } from './workout.ts';
import { onceADay } from './once.ts';
import SunCalc from 'suncalc';

const { TWITCH_CLIENT_ID: clientId, TWITCH_CLIENT_SECRET: clientSecret, TWITCH_CHANNEL, TWITCH_BOT } = process.env;
if (!clientId || !clientSecret || !TWITCH_CHANNEL || !TWITCH_BOT) throw new Error('Missing TWITCH_* vars in .env');

const VIEWERS_FILE = 'data/viewers.json';
const TOWN_FILE = 'data/town.json';
const TIMER_FILE = 'data/timer.json';
const GYM_FILE = 'data/gym.json';
const THEME_FILE = 'data/theme.json';
const VIEW_FILE = 'data/view.json';
const OVERLAY_PORT = 3001;
// A missing file means "start fresh"; a corrupt one stops the bot instead of silently starting empty and overwriting it.
const readJson = async <T>(path: string, fallback: T): Promise<T> =>
  readFile(path, 'utf8').then(JSON.parse, (err) => { if (err.code === 'ENOENT') return fallback; throw err; });
// Atomic (temp file + rename) and in order per file: a crash or two quick saves can't leave a half-written file.
const queues = new Map<string, Promise<unknown>>();
const writeJson = (path: string, data: unknown) => {
  const body = JSON.stringify(data, null, 2);
  const next = (queues.get(path) ?? Promise.resolve()).then(() => writeFile(`${path}.tmp`, body)).then(() => rename(`${path}.tmp`, path));
  queues.set(path, next.catch((err) => console.error(`save ${path} failed`, err)));
  return next;
};

// One token file per logged-in account (bot + broadcaster), created by `npm run login -- bot|channel`.
const auth = new RefreshingAuthProvider({ clientId, clientSecret });
auth.onRefresh((userId, token) => writeJson(`tokens/${userId}.json`, token));
for (const file of (await readdir('tokens').catch(() => [])).filter((f) => f.endsWith('.json'))) {
  await auth.addUserForToken(await readJson(`tokens/${file}`, null as never));
}

const api = new ApiClient({ authProvider: auth });
const [channel, bot] = await Promise.all([TWITCH_CHANNEL, TWITCH_BOT].map((n) => api.users.getUserByName(n)));
if (!channel || !bot) throw new Error('TWITCH_CHANNEL or TWITCH_BOT not found on Twitch');

await mkdir('data', { recursive: true });
let viewers = await readJson<Viewers>(VIEWERS_FILE, {});
let town = await readJson<Town>(TOWN_FILE, {});
let timer = await readJson<Timer>(TIMER_FILE, null);
if (timer && !current(timer, Date.now())) timer = null; // it ran out while the bot was off
// a landmark whose focus block ended while the bot was off withers (no credit without the bot watching)
if (current(timer, Date.now())?.phase.kind !== 'focus') town = stepLandmark(town, { wasFocus: true, isFocus: false, natural: false, min: 0 }, 0, Date.now());
let lastPhase = current(timer, Date.now())?.i ?? null; // survives restarts without re-announcing
// Spotify song requests (optional): SPOTIFY_CLIENT_ID + `npm run login:spotify`. Allowlist rationale: docs/MUSIC.md.
const spotify = process.env.SPOTIFY_CLIENT_ID ? await spotifyClient(process.env.SPOTIFY_CLIENT_ID) : null;
const MUSIC_ALLOW = (process.env.MUSIC_ALLOW ?? 'StreamBeats,NCS').split(',').map((s) => s.trim()).filter(Boolean);
const MUSIC_ALLOW_ALL = process.env.MUSIC_ALLOW_ALL === 'true'; // at your own DMCA risk
const playlist = spotify && process.env.SPOTIFY_PLAYLIST ? await spotify.playlistId(process.env.SPOTIFY_PLAYLIST) : undefined;
let song: Awaited<ReturnType<NonNullable<typeof spotify>['current']>> = null;
const requests: Record<string, number> = {}; // userId → last request time
const { pending = [], doneAt = [], enabled = true } = await readJson<Partial<Gym>>(GYM_FILE, {}); // drops retired brick fields
let gym: Gym = { pending, doneAt, enabled };
const saveGym = (next: Gym) => { if (next === gym) return; gym = next; push(state()); void writeJson(GYM_FILE, gym); };
// Theme days: THEMES in .env (e.g. onepiece:fri,07-22), a mod's !theme overrides today (src/scene/theme.ts).
const calendar = parseCalendar(process.env.THEMES);
let themeOverride = await readJson<Override>(THEME_FILE, null);
const theme = () => themeOn(calendar, themeOverride, new Date());
let view = await readJson<View>(VIEW_FILE, 'city'); // !view city|cam (src/scene/view.ts)
const names = () => { const id = theme(); return id ? THEMES[id]!.names : {}; };
let crowd: Crowd = {}; // in memory only: presence doesn't need to survive restarts
const BOOT = Date.now(); // overlays reload themselves when boot changes (restart, or an edit to their code), so OBS never runs a stale page
const boot = () => `${BOOT}.${codeRev(['src', 'public'])}`;
// SUN_LAT/SUN_LON in .env (a city is precise enough) → sky follows the real sun; otherwise the overlay uses clock hours.
const [lat, lon] = [Number(process.env.SUN_LAT), Number(process.env.SUN_LON)];
const sunTimes = () => {
  if (!process.env.SUN_LAT || Number.isNaN(lat) || Number.isNaN(lon)) return undefined;
  const t = SunCalc.getTimes(new Date(), lat, lon);
  return { dawn: +t.dawn, sunrise: +t.sunrise, sunset: +t.sunset, dusk: +t.dusk };
};
const sunPhase = () => { const t = sunTimes(); return t && phaseFromSun(Date.now(), t); };
const realSky = () => (sunTimes() ? skyAt(new Date(), { lat, lon }) : undefined); // sun, moon and stars where they really are
let weather: Weather | undefined; // real weather at SUN_LAT/SUN_LON (Open-Meteo, no key); unset → the overlay's daily dice
const checkWeather = async () => {
  if (!sunTimes()) return;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code`);
    weather = weatherOfCode((await r.json()).current.weather_code);
  } catch (e) { console.error('weather check failed', e); }
};
checkWeather(); setInterval(checkWeather, 15 * 60_000);
const state = () => ({ type: 'state', boot: boot(), theme: theme(), view, phase: sunPhase(), sun: sunTimes(), sky: realSky(), weather, timer, song, gym: { pending: gym.pending.map(({ name, by }) => ({ name, by })), enabled: gym.enabled }, town, builders: activeBuilders(crowd, Date.now()) });
const push = startOverlay(OVERLAY_PORT, state);
let lastTheme = theme(); // the calendar flips at midnight: say so once (a restart on a theme day stays quiet)
setInterval(() => { // let quiet builders clock out
  push(state());
  const now = theme();
  if (now === lastTheme) return;
  const line = now ? THEMES[now]!.hello : lastTheme ? THEMES[lastTheme]!.bye : null;
  lastTheme = now;
  if (line) say(line).catch((err) => console.error('theme announce failed', err));
}, 60_000);
// Sent with the app token → the Chat Bot badge. Needs user:bot from the bot, which must be a mod (or channel:bot).
const say = (text: string) => api.chat.sendChatMessageAsApp(bot, channel, text);
// Workout rewards: one Channel Points reward per rung, created by this app so it can fulfil or refund them.
// Needs channel:manage:redemptions (npm run login -- channel). Costs are set once; edit them in the dashboard after.
const rewardIds: string[] = [];
const pauseRewards = (isPaused: boolean) =>
  Promise.all(rewardIds.map((id) => api.channelPoints.updateCustomReward(channel, id, { isPaused }))).catch((err) => console.error('pausing rewards failed', err));
const setRedemption = (r: { rewardId: string; id: string }, status: 'FULFILLED' | 'CANCELED') =>
  api.channelPoints.updateRedemptionStatusByIds(channel, r.rewardId, [r.id], status).catch((err) => console.error(`redemption ${status} failed`, err));
try {
  const ours = await api.channelPoints.getCustomRewards(channel, true);
  for (const t of LADDER) {
    const r = ours.find((x) => x.title === t.name)
      ?? await api.channelPoints.createCustomReward(channel, { title: t.name, cost: t.cost, prompt: 'isamy does it at the next break (max 2 an hour) 💪' });
    rewardIds.push(r.id);
  }
  await pauseRewards(!gym.enabled);
} catch (err) { console.error('workout rewards unavailable', err); }
const saveTown = async (next: Town) => {
  if (next === town) return;
  town = next;
  push(state());
  await writeJson(TOWN_FILE, town);
};
// Focus blocks build the streamer's landmark (src/town.ts stepLandmark). Returns what opened, if anything.
const landmarkStep = async (was: Current['phase'] | null, next: Current | null, natural: boolean) => {
  const before = town[FOCUS_ID]?.floors.find((f) => !f.done)?.kind;
  const wasFocus = was?.kind === 'focus', isFocus = next?.phase.kind === 'focus';
  await saveTown(stepLandmark(town, { wasFocus, isFocus, natural, min: next?.phase.min ?? 0 }, Math.random(), Date.now()));
  return wasFocus && natural ? before : undefined;
};
const saveTimer = (next: Timer) => {
  timer = next;
  lastPhase = current(timer, Date.now())?.i ?? null;
  push(state());
  return writeJson(TIMER_FILE, timer);
};
setInterval(() => { // workouts fire at breaks (or anytime without a focus timer), capped per hour
  const c = current(timer, Date.now());
  const r = nextWorkout(gym, Date.now(), !timer || c?.phase.kind === 'break');
  if (!r.workout) return;
  saveGym(r.gym);
  push({ type: 'workout', ...r.workout });
  if (r.workout.redemption) void setRedemption(r.workout.redemption, 'FULFILLED');
  const by = r.workout.by.length ? `, courtesy of ${r.workout.by.map((n) => `@${n}`).join(' ')}` : '';
  say(`💪 workout time! isamy does ${r.workout.name}${by}`).catch((err) => console.error('workout announce failed', err));
}, 1000);
setInterval(() => { // announce each phase change; the overlay counts down on its own
  if (!timer) return;
  const c = current(timer, Date.now());
  if ((c?.i ?? null) === lastPhase) return;
  const was = lastPhase === null ? null : PRESETS[timer.preset][lastPhase]!;
  lastPhase = c?.i ?? null; // claim the change now: the landmark write below is async
  // break roll call: who finished something during the focus block that just ended (a check-in, not a leaderboard)
  const finished = was?.kind === 'focus' ? finishedSince(town, Date.now() - was.min * 60_000) : [];
  void landmarkStep(was, c, true).then((opened) => {
    say(announce(c, { ...builtToday(town), finished, opened: opened && nameOf(opened, true, names()) })).catch((err) => console.error('announce failed', err));
  });
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
// Archive the town, then keep only unfinished floors. auto (go-live) runs once per day, so a mid-day restart keeps the city.
const startNewDay = async (auto: boolean) => {
  const day = `data/town-${new Date().toLocaleDateString('en-CA')}`, body = JSON.stringify(town, null, 2);
  const first = await writeFile(`${day}.json`, body, { flag: 'wx' }).then(() => true, () => false);
  if (!first && auto) return;
  if (!first) await writeFile(`${day}-${Date.now()}.json`, body); // second manual reset today: never overwrite an archive
  await saveTown(newDay(town));
};
listener.onStreamOnline(channel, async (e) => {
  streamId = e.id;
  console.log(`live! stream ${streamId}`);
  await startNewDay(true).catch((err) => console.error('new day failed', err));
  // Optional: DISCORD_WEBHOOK (Server Settings → Integrations → Webhooks) gets a "we're live" post.
  // One @here a day: a reconnect or restart mid-stream fires stream.online again (double ping 2026-10-20).
  if (!process.env.DISCORD_WEBHOOK || !(await onceADay('data', 'discord-golive', new Date().toLocaleDateString('en-CA')))) return;
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
listener.onChannelRedemptionAdd(channel, (e) => {
  const r = redeem(gym, { id: e.id, rewardId: e.rewardId, rewardTitle: e.rewardTitle, userName: e.userDisplayName });
  if (!r) return;
  saveGym(r.gym);
  if (!r.accepted) void setRedemption(e, 'CANCELED'); // refunds the points
  say(r.reply).catch((err) => console.error('redemption reply failed', err));
});
listener.onChannelChatMessage(channel, bot, (e) => handleChat(e).catch((err) => console.error('chat handler failed', err)));

// Chat read aloud on the Mac, one line at a time. OBS captures only Spotify, so only the streamer hears it.
let tts = true, speaking = Promise.resolve();
const speak = (text: string) => { console.log(`tts: ${text}`); speaking = speaking.then(() => promisify(execFile)('say', [text])).then(() => {}, (err) => console.error('say failed', err)); };

const handleChat = async (e: EventSubChannelChatMessageEvent) => {
  console.log(`chat <${e.chatterName}> ${e.messageText}`);
  if (e.chatterId === bot.id && bot.id !== channel.id) return; // separate bot account: ignore our own messages
  const chatter = { userId: e.chatterId, userName: e.chatterDisplayName };

  const hello = greet(viewers, chatter, streamId);
  if (hello.message) {
    viewers = hello.viewers;
    await writeJson(VIEWERS_FILE, viewers);
    await say(hello.message);
  }

  crowd = handleCrowd(crowd, chatter, e.messageText, Date.now());
  const word = e.messageText.trim().toLowerCase();
  if (word === '!join') await say(`@${chatter.userName} grabs a hard hat 👷`);
  if (word === '!where') push({ type: 'where', id: chatter.userId }); // overlay points at their buildings
  if (word === '!leave') await say(`@${chatter.userName} clocks out 👋 (!join to come back)`);

  const isMod = 'broadcaster' in e.badges || 'moderator' in e.badges;
  const ttsCmd = word.match(/^!tts (on|off)$/)?.[1];
  if (ttsCmd && isMod) { tts = ttsCmd === 'on'; await say(`🔊 reading chat aloud: ${ttsCmd}`); }
  const line = speakable(chatter.userName, e.messageText);
  if (tts && line) speak(line);
  if (word === '!raid' && isMod) { // pages through the whole category: Helix sorts biggest first
    const game = (await api.channels.getChannelInfoById(channel))?.gameId;
    const live = game ? await api.streams.getStreamsPaginated({ game, language: 'en', type: 'live' }).getAll() : [];
    await say(raidPicks(live.map((x) => ({ userId: x.userId, userName: x.userDisplayName, viewers: x.viewers, startDate: x.startDate })), channel.id, Date.now()));
  }
  if (word === '!newday' && isMod) {
    await startNewDay(false);
    await say('🌅 new day, clear skyline! yesterday\'s city is archived, unfinished buildings carried over. !task to start building');
  }
  const cmd = handleCommand(town, chatter, e.messageText, Math.random(), Date.now(), names());
  if (cmd) await saveTown(cmd.town);
  push(state());
  if (cmd) await say(cmd.reply);

  const th = handleTheme(themeOverride, calendar, { isMod }, e.messageText, Date.now());
  if (th) {
    if (th.override !== themeOverride) {
      themeOverride = th.override;
      lastTheme = theme(); // announced right here, not again by the minute check
      push(state());
      await writeJson(THEME_FILE, themeOverride);
    }
    await say(th.reply);
  }

  const v = handleView(view, { isMod }, e.messageText);
  if (v) {
    if (v.view !== view) { view = v.view; push(state()); await writeJson(VIEW_FILE, view); }
    await say(v.reply);
  }

  const w = handleWorkout(gym, chatter, isMod, e.messageText);
  if (w) {
    if (w.gym.enabled !== gym.enabled) void pauseRewards(!w.gym.enabled);
    saveGym(w.gym);
    await say(w.reply);
  }

  const link = handleLink(e.messageText, { discord: process.env.LINK_DISCORD, insta: process.env.LINK_INSTA, playlist: process.env.LINK_PLAYLIST });
  if (link) await say(link);

  const music = parseMusic(e.messageText);
  if (music && spotify) await handleMusic(music, chatter, isMod).then(say, (err) => {
    console.error('music failed', err);
    return say(`@${chatter.userName} spotify hiccup 😵 is music playing on the stream PC?`);
  });
  const t = handleTimer(timer, { isMod }, e.messageText, Date.now());
  if (t) {
    if (t.timer !== timer) {
      const now = Date.now(), was = current(timer, now)?.phase ?? null;
      const saved = saveTimer(t.timer); // updates `timer` right away, so a second quick !timer sees the new state
      if (/^!timer\s+(start|skip|stop)\b/i.test(e.messageText.trim())) await landmarkStep(was, current(t.timer, now), false);
      await saved;
    }
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
