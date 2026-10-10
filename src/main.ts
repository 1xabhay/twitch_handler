// Imperative shell: Twitch I/O + file persistence. Logic lives in pure modules.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { EventSubChannelChatMessageEvent } from '@twurple/eventsub-base';
import { greet, type Viewers } from './greet.ts';
import { handleCommand, type Town } from './town.ts';
import { startOverlay } from './overlay.ts';

const { TWITCH_CLIENT_ID: clientId, TWITCH_CLIENT_SECRET: clientSecret, TWITCH_CHANNEL, TWITCH_BOT } = process.env;
if (!clientId || !clientSecret || !TWITCH_CHANNEL || !TWITCH_BOT) throw new Error('Missing TWITCH_* vars in .env');

const TOKEN_FILE = 'user.token.json';
const VIEWERS_FILE = 'data/viewers.json';
const TOWN_FILE = 'data/town.json';
const OVERLAY_PORT = 3001;
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
let town = await readJson<Town>(TOWN_FILE, {});
const pushTown = startOverlay(OVERLAY_PORT, () => town);
let streamId = (await api.streams.getStreamByUserId(channel))?.id ?? `offline-${new Date().toISOString().slice(0, 10)}`;

const listener = new EventSubWsListener({ apiClient: api });
listener.onSubscriptionCreateFailure((sub, err) => console.error(`subscribe failed: ${sub.id}`, err));
listener.onUserSocketDisconnect((_user, err) => console.error('eventsub disconnected', err ?? ''));
listener.onStreamOnline(channel, (e) => { streamId = e.id; console.log(`live! stream ${streamId}`); });
listener.onChannelChatMessage(channel, bot, (e) => handleChat(e).catch((err) => console.error('chat handler failed', err)));

const handleChat = async (e: EventSubChannelChatMessageEvent) => {
  console.log(`chat <${e.chatterName}> ${e.messageText}`);
  const chatter = { userId: e.chatterId, userName: e.chatterDisplayName };
  const say = (text: string) => api.asUser(bot, (ctx) => ctx.chat.sendChatMessage(channel, text));

  // No self-skip needed: greet() fires once per user per stream, and bot replies never start with "!".
  const hello = greet(viewers, chatter, streamId);
  if (hello.message) {
    viewers = hello.viewers;
    await writeFile(VIEWERS_FILE, JSON.stringify(viewers, null, 2));
    await say(hello.message);
  }

  const cmd = handleCommand(town, chatter, e.messageText);
  if (cmd) {
    if (cmd.town !== town) {
      town = cmd.town;
      await writeFile(TOWN_FILE, JSON.stringify(town, null, 2));
      pushTown(town);
    }
    await say(cmd.reply);
  }
};
listener.start();
console.log(`listening to #${channel.name} as ${bot.name} (stream: ${streamId})`);
console.log(`town overlay: http://localhost:${OVERLAY_PORT}/town`);
