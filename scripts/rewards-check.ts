// Can this channel use Channel Points through the API? Creates one disabled test reward, then deletes it.
// Before May 2026 the API refused non-Affiliates (403). Needs channel:manage:redemptions (npm run login -- channel).
import { readFile, readdir } from 'node:fs/promises';
import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';

const { TWITCH_CLIENT_ID: clientId = '', TWITCH_CLIENT_SECRET: clientSecret = '', TWITCH_CHANNEL = '' } = process.env;
const auth = new RefreshingAuthProvider({ clientId, clientSecret });
for (const f of (await readdir('tokens')).filter((f) => f.endsWith('.json'))) await auth.addUserForToken(JSON.parse(await readFile(`tokens/${f}`, 'utf8')));
const api = new ApiClient({ authProvider: auth });
const channel = await api.users.getUserByName(TWITCH_CHANNEL);
if (!channel) throw new Error(`${TWITCH_CHANNEL} not found`);

try {
  const reward = await api.channelPoints.createCustomReward(channel, { title: 'api check (delete me)', cost: 1, isEnabled: false });
  await api.channelPoints.deleteCustomReward(channel, reward.id);
  console.log('✅ the bot can create and manage Channel Points rewards on', channel.name);
} catch (err) {
  console.log('❌ not allowed yet:', (err as Error).message);
}
