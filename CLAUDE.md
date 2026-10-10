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
- `.env`: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_CHANNEL, TWITCH_BOT (bot = channel for now).
- Login once: `twitch configure` then `twitch token -u -s "user:read:chat user:write:chat"`; tokens saved to `user.token.json` (gitignored, Twurple refreshes + rewrites it).
- `npm start` — runs `src/main.ts` (Node runs TS natively, loads .env). Viewer memory in `data/` (gitignored). OBS browser source: http://localhost:3001/town (1920x1080).

## Style
- Bot voice: playful & witty. Speaks only when needed (greetings, timer, command replies) — no timed spam.
- Visuals: pixel art / retro. Calm motion, no loud alerts (co-working friendly).
- Community name: TBD.

## Research
- `docs/RESEARCH.md` — graded starter toolkit.
- `docs/INTERACTIVE.md` — chat-driven on-screen environment ideas.
- `docs/SETUP.md` — tested macOS streaming setup (Twitch app, OBS, free GoPro webcam, audio).

## Ledger
<!-- newest first: YYYY-MM-DD — what changed / decided, and why -->
- 2026-10-09 — Streaming setup done: OBS 32 + stream key, GoPro HERO11 via free official GoPro Webcam app (video only), Mac mic + RNNoise/Compressor, town overlay live in OBS. Captured in docs/SETUP.md.
- 2026-10-09 — Pixel town v1: `!task`/`!done` (one building per viewer, floors = tasks done, lit window = active task). Overlay at localhost:3001/town via SSE, bound to 127.0.0.1. Chosen over constellation/mural/voyage: builds on task list, fits pixel style.
- 2026-10-09 — First live run: greeting works in real chat (#halfopeneyes). Bot posts as the channel owner (no bot account yet). Offline "stream" = calendar day.
- 2026-10-09 — Stack chosen: TS + Twurple; build our own (borrow Dirework command names). Style picked. First feature: `greet` (viewer memory), TDD.
- 2026-10-09 — Toolkit research graded in docs/RESEARCH.md. BUILD candidates: viewer greeting, focus timer, task list, check-ins/recap, question queue, text commands, mode switch. Everything else uses Twitch-native or free tools.
- 2026-10-09 — Repo initialized: git, CLAUDE.md, .gitignore, .env.example. Stack and feature scope still to be decided.
