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

## Style
- Bot voice: playful & witty. Speaks only when needed (greetings, timer, command replies) — no timed spam.
- Visuals: pixel art / retro. Calm motion, no loud alerts (co-working friendly).
- Community name: TBD.

## Research
- `docs/RESEARCH.md` — graded starter toolkit.
- `docs/INTERACTIVE.md` — chat-driven on-screen environment ideas.

## Ledger
<!-- newest first: YYYY-MM-DD — what changed / decided, and why -->
- 2026-10-09 — Stack chosen: TS + Twurple; build our own (borrow Dirework command names). Style picked. First feature: `greet` (viewer memory), TDD.
- 2026-10-09 — Toolkit research graded in docs/RESEARCH.md. BUILD candidates: viewer greeting, focus timer, task list, check-ins/recap, question queue, text commands, mode switch. Everything else uses Twitch-native or free tools.
- 2026-10-09 — Repo initialized: git, CLAUDE.md, .gitignore, .env.example. Stack and feature scope still to be decided.
