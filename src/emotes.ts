// Channel follower emotes the bot can use in chat (bot account must follow the channel).
// ponytail: prefix hardcoded to our channel, move to .env when someone else runs this bot.
export const PREFIX = 'heyisam';
export const E = {
  brick: `${PREFIX}Brick`,
  lockin: `${PREFIX}Lockin`,
  lit: `${PREFIX}Lit`,
  cozy: `${PREFIX}Cozy`,
  grass: `${PREFIX}Grass`,
} as const;
