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
TBD (pending decision).

## Ledger
<!-- newest first: YYYY-MM-DD — what changed / decided, and why -->
- 2026-10-09 — Repo initialized: git, CLAUDE.md, .gitignore, .env.example. Stack and feature scope still to be decided.
