# Pixel city: review and roadmap

Three reviews of the city overlay on 2026-10-10, each written from one point of view (engineering, product, design), merged into one plan. Shipped items are ticked.

## Product (positioning)
- **Comparable products:**
  - PomodoroWorld: 3D, your focus grows a world, viewers level up their buildings.
  - Task-list bots (Super Sweet Bot, Streamer.bot): `!task` and `!done` are the genre's standard commands.
  - Forest / Flora: group stakes.
  - Spirit City: Lofi Sessions: companions and a cozy room.
  - Rusty's Retirement: an idle game in a bottom-of-screen strip. It sold over 500k copies, which shows the format works, but motion has to stay slow.
  - Focusmate: say your goal, then report back.
  - StudyStream: quiet rooms full of people.
- **What viewers value:** gentle accountability, company without social pressure, rituals (goal → quiet focus → check-in), and being seen.
  - Sources: NPR 2024-07-25 on body doubling; arXiv 2108.00637 on Bilibili study streams.
- **Positioning:** PomodoroWorld rewards *your* focus with a world. Pixel Town is a neighbourhood that chat builds *together*. It is free, open-source and self-hosted, and it is about who showed up, not how much they got done.
- **Risks:**
  - New viewers don't discover `!task`.
  - With names hidden, viewers can't find their building.
  - A flood of tasks could fill the street.
  - The daily reset wipes visible history.

## Engineering (fixed)
- [x] Corrupt or half-written data files no longer load as an empty town and then get overwritten. Missing file = fresh start; corrupt file = stop. Saves are atomic (temp file, then rename) and run in order per file.
- [x] A landmark left open by a focus block that ended while the bot was off withers on boot. A timer that ran out while the bot was off is cleared.
- [x] Two quick `!timer skip` commands can no longer create two landmarks: the timer state updates before any await.
- [x] Landmarks take at most half the street (the newest that fit), so viewers' tasks never get pushed off it.
- [x] Overlay pages and modules are sent `no-store`, so OBS never shows a stale page.
- [x] The layout is recomputed only when state changes, not every frame.

## Design (fixed)
- [x] Scaffolding is see-through and finished buildings are solid and lit, so the two states read by mass and shape.
- [x] The sky's top edge fades into the camera instead of ending in a hard line.
- [x] Sidewalk, curb and lane dashes; cars drive in the road.
- [x] Trees and lamps sit in some gaps only, not between every lot. Lamps throw a soft cone of light.
- [x] Calmer motion:
  - beacons blink once every 3 s, each on its own beat (they used to blink together every 750 ms)
  - the hammer runs at 450 ms per stroke, the walk cycle at 240 ms
  - a paused timer dims instead of blinking
  - the current-session dot is solid
- [x] "Construction complete" (about 1.3 s, silent): the scaffolding falls away from the bottom up, then a glint sweeps across the front of the building.
- [x] The balloon never flies over the sun clock.

## Next (backlog)
- **P0:**
  - [x] Greeting mentions `!task`, plus a `!help` command.
  - [x] The `!task` reply names the building.
  - [x] Max 10 open tasks per viewer.
  - [x] Credit PomodoroWorld in the README.
- **P1:**
  - Break roll call: on a break, builders gather in a square and the bot names who finished something. A check-in ritual, not a leaderboard.
  - `!where`: briefly highlights your buildings (recognition without names on screen).
  - `!paint <colour>`: viewers choose their roof colour.
  - Persistent lots for regulars. This conflicts with the blank-canvas daily reset, so the streamer decides.
- **Design, P1:**
  - Move to one palette (Endesga 32): replace the lavender walls, FLAGS and sky colours.
  - Light from the left: a 1px shade column on each building's right edge and a dark roofline.
  - Standard 2×3 windows and 2×4 doors.
  - At night, about 1 in 6 windows dark.
- **P2:**
  - Weekly city timelapse snapshot.
  - Community milestone landmarks.
  - Reduced-motion setting.
  - One-click install for other streamers.
