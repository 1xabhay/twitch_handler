# Contributing

Thanks for helping build the town. Themes are the easiest way in: see [docs/THEMES.md](docs/THEMES.md).

```sh
npm install
npm run preview -- plain day   # overlay without Twitch, http://localhost:3005/town?bg=1
npm test && npm run typecheck
```

- **Test first.** Write the failing test, then the smallest code that passes. Pure logic lives in `src/*.ts` and `src/scene/*.ts` with a `*.test.ts` beside it.
- **Functional core, imperative shell.** No I/O, clocks or randomness in pure modules: pass them in. Twitch, files and OBS only in `src/main.ts` and `scripts/`.
- **Don't reinvent.** Official Twitch APIs (EventSub + Helix via Twurple), existing deps, the platform. New dependencies need a reason in the PR.
- **Small PRs, conventional commits**: `feat:`, `fix:`, `test:`, `docs:`, `chore:`.
- **Never commit secrets.** `.env`, `tokens/` and `data/` are gitignored; `.env.example` documents the keys.
- **Bot voice**: playful, short, speaks only when needed, no em dashes in chat copy.
