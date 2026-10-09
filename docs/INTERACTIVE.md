# Interactive On-Screen Environment — research

Date: 2026-10-09. Goal: viewers shape something on screen even when the streamer isn't chatting. Beyond the generic lo-fi cafe/co-working scene. Calm, lurker-friendly, low maintenance. Style: pixel art.

## Gap

No existing tool combines **persistent world across streams + grows from focus/presence + open-source browser source**. Closest: Twitch Aquarium (opt-in persistent fish, $5, closed), LurkBait (cozy idle fishing, $7, closed), StreamSpell/Meld gardens (subs/goal-driven, closed).

## Concepts (ranked)

| # | Concept | Impact | Novelty | Effort |
|---|---|---|---|---|
| 1 | **Constellation sky** — each viewer's star (fixed spot from user id), brightens with presence/focus; community minutes unlock constellation lines; named and kept forever | High | High | S |
| 2 | **Shared garden/terrarium** — plant once, grows with your chat/task minutes, seasons | High | Med-High | M |
| 3 | **Slow pixel mural** — `!place x y color`, 2–5 min cooldown, persists for weeks, time-lapse at milestones | Med-High | Med | S |
| 4 | **Pixel town** — `!task` lights a window, `!done` adds a permanent building; town grows over months | High (Co) | High | M |
| 5 | **Chat-mood weather** — emote/keyword mood shifts rain, fireflies; real-clock day/night | Med | Med | S |
| 6 | **Idle voyage** — boat moves per stream minute, chat votes the fork every 15–30 min, logbook | Med-High (Pod) | High | M |
| 7 | **Collection log** (`!dex`) — layer on top of 1/2 | Med | Low | S |

## Design rules (from research)

- Opt-in presence (lurkers invisible unless they choose). No decay/guilt mechanics (pets nag).
- Co-op over competitive. One animation at a time, subtle motion, no sound by default, colorblind-safe.
- Slow cadence works (Stream Raiders 30-min rhythm; Striner et al. CHI 2021 on pacing).

## Tech

- Plain `<canvas>` 2D (PixiJS only if it gets heavy). Pixel art: `image-rendering: pixelated`.
- Server owns state (JSON file), pushes to overlay over local WebSocket; overlay re-fetches full snapshot on connect (OBS unloads hidden sources).
- Animate on `requestAnimationFrame` timestamps, cap 30fps, transparent 1920×1080.
- Optional read-only `/world` web page so viewers can find their spot later.

## Sources

- Twitch Aquarium https://cleverbones.itch.io/twitchaquarium
- LurkBait https://store.steampowered.com/app/2767520/_/
- Evotars (browser-source avatars, reference) https://github.com/inferst/evotars-app
- StreamSpell garden https://www.streamspell.com/post/stream-garden-widget-free-interactive-chat-widget-obs-streamlabs
- Picrumble pixel canvas https://forum.godotengine.org/t/picrumble-a-collaborative-competitive-canvas-via-twitch/86266
- Flores-Saviaga et al. https://arxiv.org/abs/2012.00215
- Striner et al. CHI 2021 https://digitalcommons.memphis.edu/facpubs/2954
- OBS browser source https://obsproject.com/kb/browser-source.html
