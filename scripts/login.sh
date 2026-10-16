#!/bin/sh
# Log a Twitch account in via the Twitch CLI (device code flow) and save its tokens to tokens/<userId>.json (gitignored).
# Usage: npm run login -- bot      (approve as the bot account)
#        npm run login -- channel  (approve as the broadcaster)
# Device code flow: open the printed URL in a browser window logged in as the account you want, enter the code.
set -e
case "$1" in
  bot) SCOPES="user:read:chat user:write:chat user:bot moderator:read:followers" ;;
  channel) SCOPES="channel:bot channel:manage:broadcast user:edit channel:manage:redemptions" ;;
  *) echo "usage: npm run login -- bot|channel"; exit 1 ;;
esac
mkdir -p tokens
twitch token -u --dcf -s "$SCOPES" 2>&1 | node --env-file=.env -e '
  let all = "";
  process.stdin.on("data", (c) => {
    all += c;
    for (const line of String(c).split("\n")) if (line.trim() && !/Token:/.test(line)) console.log(line); // show code/URL, hide secrets
  });
  process.stdin.on("end", async () => {
    const get = (k) => (all.match(new RegExp(k + ":\\s*(\\S+)")) || [])[1];
    const [accessToken, refreshToken] = [get("User Access Token"), get("Refresh Token")];
    if (!accessToken || !refreshToken) { console.error("login failed"); process.exit(1); }
    const r = await fetch("https://api.twitch.tv/helix/users", {
      headers: { Authorization: `Bearer ${accessToken}`, "Client-Id": process.env.TWITCH_CLIENT_ID },
    });
    const { data: [u] } = await r.json();
    const token = { accessToken, refreshToken, expiresIn: 0, obtainmentTimestamp: 0 };
    require("fs").writeFileSync(`tokens/${u.id}.json`, JSON.stringify(token, null, 2));
    console.log(`logged in as ${u.login} → tokens/${u.id}.json`);
  });'
