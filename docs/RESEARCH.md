# Starter Toolkit Research — graded

Date: 2026-10-09. Formats: **JC** Just Chatting · **Pod** Talk Shows & Podcasts · **Co** Co-working & Studying (exact Twitch category names).

Sources: peer-reviewed HCI papers, Twitch docs/Creator Camp, streamer community guides, GitHub (verified via API). Reddit could not be crawled; community evidence is from tool docs, OBS forum, creator blogs (some vendor-biased).

## Grades

- **BUILD** — real gap, strong evidence, our app's job.
- **USE** — free tool or Twitch-native feature already covers it. Configure, don't code.
- **LATER** — weak evidence or premature for a new channel.

## Day-one setup (no code — USE)

| Item | Tool | Why |
|---|---|---|
| Broadcast software | OBS Studio | Default, free. Twitch Studio was shut down May 2024. |
| Audio | Decent mic + headphones | Every guide ranks audio above video/overlays. |
| Moderation | AutoMod (medium), Shield Mode preset, Suspicious User Detection | Native, free. Creator Camp: set up before first stream. |
| Anti hate-raid | Sery_Bot | Free, automatic; you have no human mods yet. |
| Music | StreamBeats (free) / Pretzel | DMCA strikes can end a channel. |
| Chat on screen | jChat / UChat browser source, or Twitch popout chat | Solved. |
| Now playing | tuna (OBS plugin) | Solved. |
| Remote guests (Pod) | Twitch Stream Together (≤5 guests) or VDO.Ninja | Free, native/OSS. Everyone on headphones. |
| Polls / predictions / channel points / clips / raids / /shoutout / schedule / markers | Twitch native | Don't rebuild. Note: polls/predictions need Affiliate. |
| Alerts | StreamElements (free) | Low value until you have followers. |

## App features (graded)

| # | Feature | JC | Pod | Co | Evidence | Grade |
|---|---|---|---|---|---|---|
| 1 | **Viewer memory & greeting** — first-ever chatter vs returning regular ("welcome back, 5th stream"), reset per stream, never call out lurkers | H | M | H | Papers: small-channel viewers are socially motivated, regulars form "third places" (Hilvert-Bruce 2018; Hamilton 2014; Wohn 2018). Community: Streamer.bot "First Words" has 12h-reset quirk. | **BUILD** |
| 2 | **Focus timer** — Pomodoro state machine, chat control (`!timer`), overlay, break announcements | L | L | H | Papers: synchronicity & ambience support self-regulation (Lee CHI'21; Buitrago 2022). Twitch Creator Camp recommends visible timers. Existing tools fragmented/paywalled. | **BUILD** |
| 3 | **Viewer task list** — `!task`, `!done`, `!focus`, `!next` (Dirework vocabulary), overlay | L | – | H | Papers: check-ins & progress reports build community (Wang 2021). Clearest community gap: no single free self-hosted bundle. | **BUILD** |
| 4 | **Check-ins, streaks, end-of-stream recap** (collective focus minutes, tasks done) | M | L | H | Papers: collective stats as gamification (Buitrago 2022). No free tool does this. | **BUILD** (after 1–3) |
| 5 | **Question / topic queue** — `!q`, mod next/skip, on-screen card; doubles as talk-prompt when chat is quiet | H | H | L | Papers: novice streamers struggle to keep talking to empty chat (Mok 2020). Community: #1 beginner mistake is not talking enough. Existing tools fragmented. | **BUILD** |
| 6 | **Custom text commands** (`!socials`, `!schedule`, `!guest`) + timed messages | M | M | M | Twitch has no custom `!commands`. Trivial — a lookup table. | **BUILD** (tiny) |
| 7 | **Mode switch** JC/Pod/Co — selects command set, overlay, rules | M | M | M | Papers: study rooms need stricter rules (Wang 2021; Seering 2017). | **BUILD** (just config) |
| 8 | Ad breaks aligned to timer breaks (`channel.ad_break.begin`) | L | M | H | Twitch guidance. Only matters once Affiliate. | LATER |
| 9 | Channel-point redemptions hooks (pick topic, break song) | M | M | M | Weak academic evidence; native rewards work without code. | LATER |
| 10 | Bot polls for non-Affiliates | M | H | L | Gap, but premature. | LATER |
| 11 | Discord continuity / multistream / clip-to-shorts | M | M | M | Growth lever, but separate tools (Aitum, etc.). | LATER |
| 12 | AI body double, VR, simulated audience | – | – | L | Preliminary studies only (n=12). | LATER / never |

## Technical decisions from research

- **Stack:** TypeScript + Twurple v8 (`@twurple/auth`, `@twurple/api`, `@twurple/eventsub-ws`), Vitest, twitch-cli for dev. TwitchIO 3.x is the equal Python alternative.
- **Chat via EventSub, not IRC.** `@twurple/chat` and `@twurple/easy-bot` are IRC; skip them, write a small pure command router. Avoid tmi.js (IRC, last release 2021).
- **Tokens:** `RefreshingAuthProvider` doesn't persist — save in `onRefresh` (JSON file, gitignored).
- **Testing:** pure functional core (parser, timer reducer, task reducer, viewer memory) gets most tests. twitch-cli mocks follows/raids/redemptions but **not** `channel.chat.message` (issue #344) — feed chat events through a fake source.
- **Overlays:** static HTML browser sources served from localhost, updates via SSE/WebSocket.
- **Bot badge:** app access token + `user:bot` (bot account) + `channel:bot` (broadcaster). Chatbot verification reviews currently paused.
- **Minimum scopes v1:** `user:read:chat`, `user:write:chat`, `user:bot`, `channel:bot`.

## Prior art

- **Dirework** (MIT, TS, Vitest, active) — near 1:1 co-working feature set. Cloudflare-specific, hand-rolled IRC, 1 maintainer. https://github.com/MrDemonWolf/dirework
- **jujoco task-list overlay** (MIT) — overlay UX reference. https://github.com/jujoco/twitch-multitask-task-list-overlay
- **Firebot** (GPL-3, Electron, on Twurple) — generic bot; extend via scripts instead of building alerts/commands. https://github.com/crowbartools/Firebot

## Key papers

- Hamilton et al., CHI 2014 — https://doi.org/10.1145/2556288.2557048
- Hilvert-Bruce et al., Computers in Human Behavior 2018 — https://doi.org/10.1016/j.chb.2018.02.013
- Wohn et al., CHI 2018 — https://doi.org/10.1145/3173574.3174048
- Mok et al., IMX 2020 — https://doi.org/10.1145/3391614.3399392
- Lee et al., CHI 2021 ("Study with Me" ambience)
- Wang & Zhang, arXiv 2021 — https://arxiv.org/abs/2108.00637
- Buitrago et al., Revista de Comunicación 2022 — https://doi.org/10.26441/RC21.1-2022-A3
- Seering et al., CSCW 2017 — https://doi.org/10.1145/2998181.2998277 (DOI unverified)
- Cai et al., CHI 2024 (third-party Twitch tools) — https://arxiv.org/abs/2401.11317

Gaps: no peer-reviewed work on podcast/guest streams or channel points; no causal study of greeting → retention.
