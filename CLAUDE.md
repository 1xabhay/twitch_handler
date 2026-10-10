# twitch_handler

Twitch handler app. Intended to be open-sourced.

## Principles
- **TDD**: write the failing test first, then the minimum code to pass, then refactor.
- **Functional style**: pure functions, immutable data, side effects (network, I/O) pushed to the edges.
- **Don't reinvent**: use the official Twitch APIs and established libraries/toolchains; custom code only for glue.
- **Small iterations**: one small, tested change per commit. Conventional commit messages (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- **Secrets**: credentials live in `.env` (gitignored). `.env.example` documents the keys. Never commit tokens.

## Twitch integration notes
- App registered at https://dev.twitch.tv/console (account needs verified email + 2FA).
- Chat: use EventSub + Helix API, not IRC (Twitch's current recommendation).
- Scopes: request the minimum needed and record them here as features are added.

## Stack
- TypeScript (Node 25, ESM, run TS directly), Twurple v8 (`auth`, `api`, `eventsub-ws`) — chat via EventSub, not IRC.
- Vitest for tests (`npm test`), `npm run typecheck`. twitch-cli for mocking events.
- Pure functional core in `src/*.ts` with `*.test.ts` beside it; Twitch/OBS I/O only at the edges.

## Running
- `.env`: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_CHANNEL (heyisamy), TWITCH_BOT (halfopeneyes).
- Login: `twitch configure` once, then `npm run login -- bot` (as the bot account) and `npm run login -- channel` (as the broadcaster). Device-code flow: open the printed URL in a window logged in as that account. Tokens → `tokens/<userId>.json` (gitignored, Twurple refreshes them). Bot must be a mod in the channel (`/mod <bot>`).
- `npm run launcher` builds the "Isamy Stream" app (bot + OBS together). `npm start` — runs `src/main.ts` (Node runs TS natively, loads .env). Viewer memory in `data/` (gitignored). OBS browser sources: http://localhost:3001/town (1920x1080), http://localhost:3001/timer (600x200), http://localhost:3001/music (600x140), http://localhost:3001/workout (600x160).

## Style
- Bot voice: playful & witty. Speaks only when needed (greetings, timer, command replies) — no timed spam.
- Visuals: pixel art / retro. Calm motion, no loud alerts (co-working friendly).
- Community name: TBD.

## Research
- `docs/RESEARCH.md` — graded starter toolkit.
- `docs/INTERACTIVE.md` — chat-driven on-screen environment ideas.
- `docs/FOCUS.md` — research behind the focus timer presets.
- `docs/SETUP.md` — tested macOS streaming setup (Twitch app, OBS, free GoPro webcam, audio).
- `docs/CITY.md` — engineer/PM/designer review of the pixel city, positioning vs PomodoroWorld, backlog.

## Ledger
- 2026-10-10 — City review (docs/CITY.md): atomic in-order saves + corrupt file stops boot; boot withers stale landmarks; landmarks ≤ half street; no-store overlay; !help, greeting mentions !task, !task names the building, 10 open/viewer; airy scaffolds vs solid lit buildings, soft sky edge, sidewalk/lanes, calmer blink rates, completion reveal. Kept streamer's choices over designer's (moving sun clock, sky that grows).
- 2026-10-10 — Sky clock: sun/moon position = celestial(now, sunrise/sunset) in ambient.ts (local time; real sun via SUN_LAT/SUN_LON → state.sun, else 06:00/20:00). Carries the timer: emptying ring, 2x pixel-font countdown, session dots. Sky stays ≥75px tall above the skyline while a timer runs.
- 2026-10-10 — PomodoroWorld-inspired (pomodoroworld.com): focus blocks build streamer landmarks (town key `focus`, stepLandmark in town.ts) sized by block length, right-aligned on the street, scaffold grows with the countdown (overlay imports /lib/focus.ts), withers on stop/skip mid-focus; completion appended to the break announcement. Street life unlocks at 3/6/12 finished builds (cars, food cart, balloon). Skipped from PomodoroWorld: XP/leaderboards (bricks cover it), extra worlds.
- 2026-10-10 — Live feedback: town covered the camera → SimCity-style city (src/scene/city.ts): buildings solid (canvas `?alpha=` default 1). Blank street each day; each `!task` stores a random `kind` (pool in src/scene/city.ts) and `at`; lots fill the street in `at` order, then new tasks become storeys on the shortest office/apartment. sky 0.5 alpha, opening up above the skyline as towers rise, no names drawn (privacy + clutter). `!newday` (mods) archives to data/town-<date>.json and keeps only unfinished floors; also auto on first go-live of the day (archive file = once-per-day marker). Music muted with mic → Spotify as its own macOS Audio Capture source (docs/SETUP.md).
<!-- newest first: YYYY-MM-DD — what changed / decided, and why -->
- 2026-10-10 — Category → Co-working & Studying. Workout Meter: own currency 🧱 bricks (Channel Points need Affiliate; swap in later via channel_points redemption events). Earn: 20 welcome, +1/chat/min, +5 per 10 min active, +10 per finished floor. Spicier ladder 50/100/150/250/400 → 2 min shadow boxing; fires at breaks only, max 2/h, 10 min apart. Overlay /workout (600x160).
- 2026-10-10 — Link commands (!discord !insta !playlist !socials, LINK_* in .env); Discord go-live post via DISCORD_WEBHOOK with @here (playful copy). Launcher app `npm run launcher` → ~/Applications/Isamy Stream.app: starts bot, opens OBS, stops bot when OBS quits; log ~/Library/Logs/isamy-bot.log.
- 2026-10-10 — Spotify song requests live: `!sr` (followers, 10-min cooldown, mods exempt), `!song`, `!skip` (mods); accepted songs mirrored to "Study Queue". Streamer chose MUSIC_ALLOW_ALL=true knowingly (DMCA risk explained, docs/MUSIC.md); default for others stays allowlist (StreamBeats, NCS by label/artist). Now-playing overlay /music (600x140). Login: `npm run login:spotify` (PKCE, 127.0.0.1:3002).
- 2026-10-10 — Focus timer (docs/FOCUS.md research): presets shift (50/10 on the hour, lunch at 4h, 8h), pomodoro, deep (90/20). `!timer` anyone; start/pause/resume/skip/stop mods only. Phase changes announced with evidence-ranked break prompts. Overlay at /timer (600x200). Sky follows real sun via suncalc + SUN_LAT/SUN_LON.
- 2026-10-10 — Moved to new channel **heyisamy** (name hunt: real words/first names exhausted on Twitch; Isamy ~ Japanese isamu "courage", echoing user's name). halfopeneyes is now the bot (mod, Chat Bot badge via app-token send). Multi-account tokens in tokens/, `npm run login -- bot|channel` with device-code flow.
- 2026-10-10 — Living town: builders (chatters in last 30 min, `!leave`/`!join` opt-out) walk + hammer at their scaffolding; day/night sky on local clock, stars/moon, clouds, birds, seasonal trees, lamps, deterministic daily rain/snow, roof cat; follow = delivery truck, raid = bus drops off builders. Pure scene logic in src/scene/ served to browser via node:module stripTypeScriptTypes (no bundler). `?sky=0` disables backdrop.
- 2026-10-10 — Town v2: floors are numbered tasks (`!task`, `!done N`, `!tasks`, `!remove N`, no limit). Wordless states from research: scaffolding+hazard band = in progress, lit windows = done, flag+roof garden = building complete. Shape not colour carries state (colorblind-safe). Added EventSub/chat logging after a silent no-events stream.
- 2026-10-09 — Streaming setup done: OBS 32 + stream key, GoPro HERO11 via free official GoPro Webcam app (video only), Mac mic + RNNoise/Compressor, town overlay live in OBS. Captured in docs/SETUP.md.
- 2026-10-09 — Pixel town v1: `!task`/`!done` (one building per viewer, floors = tasks done, lit window = active task). Overlay at localhost:3001/town via SSE, bound to 127.0.0.1. Chosen over constellation/mural/voyage: builds on task list, fits pixel style.
- 2026-10-09 — First live run: greeting works in real chat (#halfopeneyes). Bot posts as the channel owner (no bot account yet). Offline "stream" = calendar day.
- 2026-10-09 — Stack chosen: TS + Twurple; build our own (borrow Dirework command names). Style picked. First feature: `greet` (viewer memory), TDD.
- 2026-10-09 — Toolkit research graded in docs/RESEARCH.md. BUILD candidates: viewer greeting, focus timer, task list, check-ins/recap, question queue, text commands, mode switch. Everything else uses Twitch-native or free tools.
- 2026-10-09 — Repo initialized: git, CLAUDE.md, .gitignore, .env.example. Stack and feature scope still to be decided.
