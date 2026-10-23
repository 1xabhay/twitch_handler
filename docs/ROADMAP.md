# Roadmap

Long-term work, not scheduled yet. Short-term ideas live in docs/CITY.md (backlog) and docs/INTERACTIVE.md.

## Security: vulnerability testing (added 2026-10-22)
Start regular security testing of the bot and its local servers.
- Dependency audit in `make check` (`npm audit`), then a scheduled scan.
- Threat model the edges: chat input (commands, `!sr`, `!task` text), the overlay server on 127.0.0.1:3001, OAuth tokens in `tokens/`, obs-websocket, the Discord webhook.
- Fuzz the pure parsers with chat-shaped input; check nothing a viewer types reaches a shell, a file path or OBS.
- Secret scanning on every commit (history was audited clean on 2026-10-16, keep it that way).

## Infra: in-house first, cloud in parallel (added 2026-10-22)
Run everything we depend on in-house, with cloud as a parallel path for distribution.
- **Rule:** cloud is a distribution channel, never a blocker. Development, research and releasing to production must all work with no cloud account or network service up.
- In-house: local builds and checks (`make check`, `make docker-check`), local test events (twitch-cli), self-hosted CI runner, local release artifacts.
- Cloud in parallel: GitHub (public repo, releases), registries, hosted CI as mirrors. Losing one delays distribution only.
- Twitch, Spotify and Discord APIs are the product's own edges, not infra; they stay, behind the functional core.
- First step: list every external service the dev/release loop touches today and mark which ones can block it.
