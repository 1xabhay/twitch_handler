// Imperative shell: Twitch I/O + file persistence. Logic lives in pure modules.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { EventSubChannelChatMessageEvent } from '@twurple/eventsub-base';
import { greet, type Viewers } from './greet.ts';
import { handleCommand, type Town } from './town.ts';
import { startOverlay } from './overlay.ts';
import { activeBuilders, handleCrowd, type Crowd } from './scene/crowd.ts';
import { phaseFromSun } from './scene/ambient.ts';
import { announce, current, handleTimer, type Timer } from './focus.ts';
import SunCalc from 'suncalc';

const { TWITCH_CLIENT_ID: clientId, TWITCH_CLIENT_SECRET: clientSecret, TWITCH_CHANNEL, TWITCH_BOT } = process.env;
if (!clientId || !clientSecret || !TWITCH_CHANNEL || !TWITCH_BOT) throw new Error('Missing TWITCH_* vars in .env');

const VIEWERS_FILE = 'data/viewers.json';
const TOWN_FILE = 'data/town.json';
const TIMER_FILE = 'data/timer.json';
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
let crowd: Crowd = {}; // in memory only: presence doesn't need to survive restarts
const BOOT = Date.now(); // overlay reloads itself when this changes, so OBS never runs a stale page
// SUN_LAT/SUN_LON in .env (a city is precise enough) → sky follows the real sun; otherwise the overlay uses clock hours.
const [lat, lon] = [Number(process.env.SUN_LAT), Number(process.env.SUN_LON)];
const sunPhase = () => {
  if (!process.env.SUN_LAT || Number.isNaN(lat) || Number.isNaN(lon)) return undefined;
  const t = SunCalc.getTimes(new Date(), lat, lon);
  return phaseFromSun(Date.now(), { dawn: +t.dawn, sunrise: +t.sunrise, sunset: +t.sunset, dusk: +t.dusk });
};
const state = () => ({ type: 'state', boot: BOOT, phase: sunPhase(), timer, town, builders: activeBuilders(crowd, Date.now()) });
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
setInterval(() => { // announce each phase change; the overlay counts down on its own
  if (!timer) return;
  const c = current(timer, Date.now());
  if ((c?.i ?? null) === lastPhase) return;
  say(announce(c)).catch((err) => console.error('announce failed', err));
  void saveTimer(c ? timer : null);
}, 1000);
let streamId = (await api.streams.getStreamByUserId(channel))?.id ?? `offline-${new Date().toISOString().slice(0, 10)}`;

const listener = new EventSubWsListener({ apiClient: api });
listener.onSubscriptionCreateFailure((sub, err) => console.error(`subscribe failed: ${sub.id}`, err));
listener.onUserSocketDisconnect((_user, err) => console.error('eventsub disconnected', err ?? ''));
listener.onStreamOnline(channel, (e) => { streamId = e.id; console.log(`live! stream ${streamId}`); });
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

  const cmd = handleCommand(town, chatter, e.messageText);
  if (cmd && cmd.town !== town) {
    town = cmd.town;
    await writeFile(TOWN_FILE, JSON.stringify(town, null, 2));
  }
  push(state());
  if (cmd) await say(cmd.reply);

  const isMod = 'broadcaster' in e.badges || 'moderator' in e.badges;
  const t = handleTimer(timer, { isMod }, e.messageText, Date.now());
  if (t) {
    if (t.timer !== timer) await saveTimer(t.timer);
    await say(t.reply);
  }
};
listener.start();
console.log(`listening to #${channel.name} as ${bot.name} (stream: ${streamId})`);
console.log(`town overlay: http://localhost:${OVERLAY_PORT}/town`);
