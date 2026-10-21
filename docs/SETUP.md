# Streaming Setup (macOS, free)

What actually worked for a first-time setup.

## Twitch
1. Verify email, enable 2FA (Settings → Security and Privacy).
2. Register an app at https://dev.twitch.tv/console — name must **not contain "twitch"** and must be unique. Redirect URL `http://localhost:3000`, Category Chat Bot, Confidential.
3. Copy Client ID + new Secret into `.env` (see `.env.example`). Save the file.

## Bot
```sh
brew install twitchdev/twitch/twitch-cli
twitch configure            # paste Client ID + Secret
npm install
npm run login -- bot        # approve as the bot account (device code: open the URL in that account's window)
npm run login -- channel    # approve as the broadcaster
npm start
```
In the broadcaster's chat: `/mod <botname>` (lets the bot see follows and get the Chat Bot badge).

Tip: use a separate bot account. Logging in through a browser that's signed into the wrong account silently authorizes that account — device-code flow avoids it.

## OBS
- `brew install --cask obs`. Allow Screen Recording, Camera, Microphone.
- Wizard: 1080p, 30fps. **Connect Account** can fail with Google passkey logins (OBS's embedded browser can't do passkeys) → use **Stream Key** from https://dashboard.twitch.tv/settings/stream instead. Never show it on stream.

## GoPro as webcam (free)
- Official app: **GoPro Webcam by GoPro, Inc., free** — https://apps.apple.com/us/app/gopro-webcam/id6477835262. Beware paid look-alikes ("Camera Suite for GoPro Hero", $10.99, third-party).
- Supports HERO8 Black and newer (not HERO11 Mini / MAX). Allow the camera extension, restart the Mac.
- Camera: Preferences → Connections → USB Connection → GoPro Connect; Auto Power Off → Never; Lens Linear.
- OBS: Video Capture Device → GoPro Webcam.
- USB webcam mode is **video only** — Media Mod mic needs HDMI + capture card. Use the Mac mic or a wired headset instead (avoid AirPods mic: low-quality call mode).

- **Black GoPro in OBS** (GoPro preview fine, menu bar icon blue): double-click the Video Capture Device → switch Device to another camera, then back to the GoPro → OK. Cause (from the OBS log, 2026-10-21): OBS saves the camera's unique ID, and the GoPro Webcam app hands out a new ID on every reconnect, so OBS asks for a camera that no longer exists (`Unable to initialize device with unique ID`). Re-picking by name fetches the current ID. `make room-watch` now does this by itself within 10 s (current ID from `system_profiler SPCameraDataType`). Tip: turn the GoPro on *before* opening OBS.

## Audio
- Settings → Audio → Mic/Aux → your mic. Peak in yellow, never red.
- Filters: Noise Suppression (RNNoise), then Compressor.
- **Music on its own source** (so muting the mic doesn't mute music): Sources → + → macOS Audio Capture → Mode: Application → Spotify. Mute the *Mic/Aux* slider in OBS's Audio Mixer (not the Mac's mic or Spotify), music keeps going. Wear headphones so the mic doesn't pick up the music twice. Keep music about 10 dB under your voice: here the Spotify source sits at -22 dB, so music peaks about -27 dB against a voice at -15 to -18 dB (measured from the post-fader meters).

## Overlay
- Browser source `http://localhost:3001/town`, 1920×1080, top of Sources. Bot must be running.

## Layout: real desk, pixel world (default)
One style per scene, nothing over you or the desk robot. `make obs-scenes` (OBS open) builds two scenes from your camera, mic and music, and leaves your other scenes alone:
- **Focus**: the real camera full frame + `City band` (`/town?bg=0`, the slim pixel strip with the sky clock and timer).
- **Break**: `City full` (`/town?bg=city`) + the camera small, top right (480x270).
The bot switches to Break on breaks and lunch and back to Focus otherwise (sceneFor in src/focus.ts); without those scenes it logs once and changes nothing. Make the camera clean in the room, not in software: aim the GoPro (Linear lens) at the plainest wall, crop tight, one soft light in front of you.

## Anime room behind you (experiment, off)
Off by default since 2026-10-21: mixing a painted room with pixel art and a cutout read as cluttered. Turn it back on with `ROOM=desk` in `.env`.
1. OBS → Tools → WebSocket Server Settings → **Enable** (lets the scripts ask OBS for the camera frame; the password is read from OBS's config, nothing to copy).
2. `make room NAME=desk` → `data/room-desk.png`. Best with the room empty. The painter is FLUX.2 [klein] 4B (Apache-2.0) via mflux, run natively (Docker on a Mac has no GPU): install once with `uv tool install --python 3.12 mflux --with 'pillow<13'` (Pillow 13 breaks mflux); the model (~16 GB) downloads on first use; ~80 s per paint at 8-bit on an M2 Pro 16 GB. **It never paints while you are live**: it shares the GPU with OBS (measured 30 → 22-29 fps, 279 skipped frames per paint); repaints wait until you're offline and the light keeps following meanwhile. `ROOM_PAINTER=anime` uses the old AnimeGANv2 in Docker instead (~15 s, CPU, weaker look). With OBS closed, ffmpeg grabs the camera. From any photo: `make room NAME=kitchen PHOTO=pic.jpg`.
3. Cut yourself out. Put the camera in its own scene `Camera`, add that scene as a source in your main scene, and put the cutout filter on **that** source, not on the camera itself (the watcher screenshots the camera and must see the whole room). Light yourself from the front. Compared side by side on this setup (2026-10-21):
   - **Use: [macOS Background Removal](https://github.com/sebastian-s-beckmann/obs-mac-backgroundremoval)** (Apple Vision, GPL-2.0, 0.3.0, pre-release, *unsigned*: check the SHA-256 against the release notes, it has no install scripts). Effect filter "macOS Background Removal", quality **Balanced**, threshold **0.6**. Crisp edges, no halo, no motion trails, 3.5 ms a frame. **Accurate** takes 37 ms a frame and drops OBS to 24 fps: don't.
   - Fallback, kept disabled on `Camera`: [Background Removal](https://github.com/royshil/obs-backgroundremoval) 1.4.1, Robust Video Matting, CoreML, threshold off, mask expansion -4, feather 0.05, temporal smooth 0.7. Softer (it runs at a fixed 320x192), a grey halo of wall around the head, and the smoothing drags trails when you move; 7 ms a frame. It can also get stuck passing the whole camera after a camera dropout; the watcher spots a cutout covering >95% of the frame and switches the filters off and on.
   - OBS loads plugins only at start: install them with OBS closed.
4. Sources → + → Image → `data/room-desk.png`, drag it **below** the `Camera` scene source.
5. Keep it fresh: `ROOM=desk` in `.env`, then `make launcher` once. The launcher runs `make room-watch NAME=desk` with OBS: every 10 s it checks whether you're in the `Camera` cutout, and once you've been away a minute (breaks!) it paints the empty room, so no ghost of you ends up in the picture. Light follows along without repainting: each tick it fits how much brighter or darker the room is than when painted (room pixels only, not you) and eases a Color Correction filter `Room light` on the `Anime room` source toward it over ~30 s (it creates the filter). It repaints only when something in the empty room moved, i.e. what's left after the light fit stays high. OBS picks up the new file by itself; the painted-from thumbnail is kept in `data/room-desk.json`, so restarts keep following the light. Knobs: `ROOM_SETTLE` (seconds away, 60), `ROOM_PRESENT` (share of the frame that counts as you, 0.05; seated measured 0.25), `ROOM_CHANGE` (left after the light fit, 0-255, 6; steady room measured 1.0-1.1), `ROOM_CUTOUT` (Camera), `ROOM_SOURCE` (Anime room). `ROOM_DEBUG=1` prints the numbers.
6. Things that move and aren't people (a desk robot, a pet) get frozen into the picture and hidden by the cutout. Give them a live window: a scene `Reachy` holding the camera, with an Image Mask/Blend filter (Alpha Mask, Color Channel) using a soft white oval on black, placed between the anime room and `Camera`. Make the oval with `ffmpeg -f lavfi -i color=black:s=1920x1080 -vf "format=gray,geq=lum='255*clip((1-hypot((X-1344)/240\,(Y-640)/360))*4\,0\,1)'" -frames:v 1 data/reachy-mask.png` (centre 1344,640 and radii 240,360 in pixels: move them to your robot).

**Don't** send obs-websocket `GetInputPropertiesListPropertyItems` for a macOS Audio Capture source's `application` list: it crashed OBS 32.2 twice (null string in obs-websocket). `GetInputSettings` is fine.

## Test
Start Recording → talk 30s, clap, `!task test` / `!done` in chat → Stop → File → Show Recordings.
