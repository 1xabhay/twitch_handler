// Imperative shell: Twitch I/O + file persistence. Logic lives in pure modules.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { greet, type Viewers } from './greet.ts';

const { TWITCH_CLIENT_ID: clientId, TWITCH_CLIENT_SECRET: clientSecret, TWITCH_CHANNEL, TWITCH_BOT } = process.env;
if (!clientId || !clientSecret || !TWITCH_CHANNEL || !TWITCH_BOT) throw new Error('Missing TWITCH_* vars in .env');

const TOKEN_FILE = 'user.token.json';
const VIEWERS_FILE = 'data/viewers.json';
const readJson = async <T>(path: string, fallback: T): Promise<T> =>
  readFile(path, 'utf8').then(JSON.parse, () => fallback);

const auth = new RefreshingAuthProvider({ clientId, clientSecret });
auth.onRefresh((_userId, token) => writeFile(TOKEN_FILE, JSON.stringify(token, null, 2)));
await auth.addUserForToken(await readJson(TOKEN_FILE, null as never), ['chat']);

const api = new ApiClient({ authProvider: auth });
const [channel, bot] = await Promise.all([TWITCH_CHANNEL, TWITCH_BOT].map((n) => api.users.getUserByName(n)));
if (!channel || !bot) throw new Error('TWITCH_CHANNEL or TWITCH_BOT not found on Twitch');

await mkdir('data', { recursive: true });
let viewers = await readJson<Viewers>(VIEWERS_FILE, {});
let streamId = (await api.streams.getStreamByUserId(channel))?.id ?? `offline-${new Date().toISOString().slice(0, 10)}`;

const listener = new EventSubWsListener({ apiClient: api });
listener.onStreamOnline(channel, (e) => { streamId = e.id; });
listener.onChannelChatMessage(channel, bot, async (e) => {
  // No self-skip needed: greet() fires once per user per stream, so the bot's own replies can't loop.
  const result = greet(viewers, { userId: e.chatterId, userName: e.chatterDisplayName }, streamId);
  if (!result.message) return;
  viewers = result.viewers;
  await writeFile(VIEWERS_FILE, JSON.stringify(viewers, null, 2));
  await api.asUser(bot, (ctx) => ctx.chat.sendChatMessage(channel, result.message));
});
listener.start();
console.log(`listening to #${channel.name} as ${bot.name} (stream: ${streamId})`);
