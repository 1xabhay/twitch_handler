# Pixel Town — a cozy Twitch companion

A small, self-hosted Twitch bot plus OBS overlays for **co-working, Just Chatting and podcast** streams. Viewers' tasks become floors in a pixel-art town, chatters walk around as tiny builders, a research-backed focus timer keeps the session on rhythm, and viewers can request songs.

Runs on your own computer. No server, no subscription.

## Features

- **Pixel town overlay.** Every viewer gets a building. `!task` adds a floor under scaffolding; `!done` lights its windows; a flag goes up when everything is finished. Buildings top out at 4 floors and spread into a block next door, then into skyline rows behind; empty lots are houses and parks. The city starts fresh on your first go-live of the day (or mods run `!newday`) (finished floors archived, unfinished ones carry over).
- **Builders.** Anyone who chatted in the last 30 minutes walks the street and hammers at their own scaffolding (`!leave` / `!join` to opt out/in).
- **Living scene.** Sky follows the real sunrise/sunset for your city, plus stars, moon, clouds, birds, seasonal trees, street lamps, daily rain/snow and a roof cat. Follows send a delivery truck; raids arrive by bus.
- **Viewer greetings.** First-time chatters and returning regulars get different (playful) welcomes, once per stream.
- **Focus timer.** `shift` (8 h, 50/10 on the hour, lunch at 4 h), `pomodoro` (25/5) and `deep` (90/20) presets, with break prompts ranked by the research in [docs/FOCUS.md](docs/FOCUS.md).
- **Song requests (Spotify).** `!sr`, `!song`, `!skip`, a shared playlist, and a now-playing card. Limited to stream-safe labels by default. Read [docs/MUSIC.md](docs/MUSIC.md) before changing that.
- **Workout Meter.** Viewers earn 🧱 bricks (chatting, hanging out, finishing floors) and pour them into a shared meter. Each filled tier queues a harder exercise, up to 🥊 2 min shadow boxing, done at the next break (max 2/hour, 10 min apart).
- **Link commands and Discord.** `!socials`, `!discord`, `!insta`, `!playlist`, plus an optional "we're live" post to a Discord channel.

## Chat commands

| Command | Who | What |
|---|---|---|
| `!task <text>` | anyone | start a new floor on your building |
| `!done 2` / `!done` | anyone | finish floor 2 / your only open floor |
| `!tasks` | anyone | list your open floors |
| `!remove 2` | anyone | drop an unfinished floor (finished floors stay) |
| `!newday` | mods | fresh city: archive to `data/town-<date>.json`, keep unfinished floors |
| `!leave` / `!join` | anyone | hide / show your builder |
| `!timer` | anyone | current focus phase and time left |
| `!timer start [shift\|pomodoro\|deep]`, `pause`, `resume`, `skip`, `stop` | mods | control the focus timer |
| `!sr <song>` | followers (1 per 10 min), mods | request a song |
| `!song` | anyone | what's playing |
| `!skip` | mods | skip the current song |
| `!workout [n]` / `!bricks` | anyone | pour 🧱 bricks into the Workout Meter / check your balance |
| `!workout off` / `on` | mods | pause / resume the Workout Meter |
| `!socials`, `!discord`, `!insta`, `!playlist` | anyone | links |

## OBS overlays

Add each as a **Browser** source. The bot must be running.

| URL | Size | Shows |
|---|---|---|
| `http://localhost:3001/town` | 1920×1080 | the town and sky (`?sky=0` for buildings only, `?alpha=0.6` to see through more; default 0.8) |
| `http://localhost:3001/timer` | 600×200 | focus timer, hidden when no timer runs |
| `http://localhost:3001/music` | 600×140 | now-playing card, hidden when nothing plays |
| `http://localhost:3001/workout` | 600×160 | Workout Meter and workout banner |

Overlays reload themselves when the bot restarts. The server only listens on `127.0.0.1`.

## Setup

Requirements: macOS or Linux, Node 23.6+ (runs TypeScript natively), [Twitch CLI](https://dev.twitch.tv/docs/cli/), OBS. A separate bot account is recommended.

```sh
npm install
cp .env.example .env          # fill in TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_CHANNEL, TWITCH_BOT
twitch configure              # paste the same Client ID + Secret
npm run login -- bot          # approve as the bot account (device code)
npm run login -- channel      # approve as the broadcaster
npm start
```

Then, in your channel's chat, run `/mod <botname>` so the bot can see follows and gets the Chat Bot badge.

Optional extras:

- **Real sun:** set `SUN_LAT` / `SUN_LON` (a city is precise enough).
- **Spotify:** create an app at developer.spotify.com with redirect URI `http://127.0.0.1:3002/callback`, set `SPOTIFY_CLIENT_ID` and `SPOTIFY_PLAYLIST`, then `npm run login:spotify`. Queueing needs Premium.
- **Links and Discord:** `LINK_DISCORD`, `LINK_INSTA`, `LINK_PLAYLIST`, `DISCORD_WEBHOOK`.
- **One-click start (macOS):** `npm run launcher` builds `~/Applications/Isamy Stream.app`, which starts the bot, opens OBS and stops the bot when OBS quits.

A full first-time walkthrough (Twitch app, OBS, GoPro as webcam, audio, troubleshooting) is in [docs/SETUP.md](docs/SETUP.md).

## Development

```sh
npm test          # Vitest
npm run typecheck # tsc --noEmit
```

- **Functional core, imperative shell.** Logic lives in pure, tested modules (`src/greet.ts`, `town.ts`, `focus.ts`, `music.ts`, `links.ts`, `src/scene/*`). `src/main.ts` wires them to Twitch (Twurple, EventSub WebSocket), Spotify and files.
- **No bundler.** The overlay pages import the same tested modules from `/lib/*.ts`, type-stripped by Node at request time.
- **State** is plain JSON in `data/`; tokens live in `tokens/`. Both are gitignored.
- Decisions and history are logged in [CLAUDE.md](CLAUDE.md). Research notes are in [docs/](docs/).

## License

Not yet chosen. The project is planned to be open-sourced.
