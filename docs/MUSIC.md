# Music on Stream — research

Date: 2026-10-10.

## Verdict: no Spotify as stream audio

- Spotify Terms: personal, non-commercial use only; no redistribution — https://www.spotify.com/us/legal/end-user-agreement/
- Spotify Developer Policy bans webcasting to simultaneous listeners, syncing recordings with video, integrating with another service's streams — https://developer.spotify.com/policy
- Chillhop explicitly: playing their Spotify playlists on Twitch is not permitted — https://chillhop.com/creators/
- Twitch Music Guidelines: no music you don't own/license; streaming subscriptions are personal only; "radio station-style" broadcasts restricted — https://legal.twitch.com/legal/music/
- 3 copyright strikes → account termination — https://legal.twitch.com/en/legal/dmca-guidelines/20211907/
- Soundtrack by Twitch shut down July 2023.

## Cleared catalogues

| Source | Cost | Credit | Notes |
|---|---|---|---|
| StreamBeats | free | none | Twitch + monetize OK; no music-only "radio" streams; download MP3/WAV — https://www.streambeats.com/licensing |
| NCS | free | "Music provided by NCS" | https://ncs.io/usage-policy |
| Lofi Girl | free (non-commercial) | required line | ask before monetized use — https://lofigirl.com/terms |
| Pretzel | free / paid | free tier posts credit | own player |
| Epidemic Sound | paid | — | own app |

## Design

- **Player:** local files (downloaded cleared tracks) played by an overlay page (`<audio>`), added to OBS as a Browser source with "Control audio via OBS".
- **`!sr <query>`:** searches only the local catalogue → allowlisted by construction. Rate-limited, mod `!skip`.
- **Shared playlist:** local JSON the bot plays; optional mirror to a streamer-owned Spotify playlist for viewers' personal listening (`POST /v1/playlists/{id}/items`, PKCE, redirect `http://127.0.0.1:PORT/callback`, Premium for queue control).
- **Now playing:** overlay + `!song`, includes required credit.
- Music in the background of co-working is fine; a music-only stream is not.
