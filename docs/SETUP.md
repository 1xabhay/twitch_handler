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

- **Black GoPro in OBS** (GoPro preview fine, menu bar icon blue): double-click the Video Capture Device → switch Device to another camera, then back to the GoPro → OK. OBS holds a stale handle when it starts before the GoPro is ready. Tip: turn the GoPro on *before* opening OBS.

## Audio
- Settings → Audio → Mic/Aux → your mic. Peak in yellow, never red.
- Filters: Noise Suppression (RNNoise), then Compressor.
- **Music on its own source** (so muting the mic doesn't mute music): Sources → + → macOS Audio Capture → Mode: Application → Spotify. Mute the *Mic/Aux* slider in OBS's Audio Mixer (not the Mac's mic or Spotify), music keeps going. Wear headphones so the mic doesn't pick up the music twice. Music at about -20 dB, under your voice.

## Overlay
- Browser source `http://localhost:3001/town`, 1920×1080, top of Sources. Bot must be running.

## Anime room behind you (optional)
1. OBS → Tools → WebSocket Server Settings → **Enable** (lets the scripts ask OBS for the camera frame; the password is read from OBS's config, nothing to copy).
2. `make room NAME=desk` → `data/room-desk.png`. You can stay seated: your body covers the part behind you anyway. AnimeGANv2 in Docker paints it at 512 px (~15 s; first run builds the image, ~1 GB). With OBS closed, ffmpeg grabs the camera instead. From any photo: `make room NAME=kitchen PHOTO=pic.jpg`.
3. Cut yourself out: install the [Background Removal plugin](https://github.com/royshil/obs-backgroundremoval) (1.4.1 works on OBS 32.2; OBS loads plugins only at start). Put the camera in its own scene `Camera`, add that scene as a source in your main scene, and put the Background Removal filter on **that** source, not on the camera itself (the watcher screenshots the camera and must see the whole room). Light yourself from the front. Filter settings (compared side by side on this setup, 2026-10-21): model **Robust Video Matting** (the others stair-step hair and shoulders), inference **CoreML**, threshold **off**, mask expansion **-4** (0 leaves a bright wall fringe), feather **0.05** (0.15 halos the hair), temporal smooth 0.7, calculate every frame. RVM runs at a fixed 320x192 inside the plugin, so edges stay a little soft whatever the settings.
4. Sources → + → Image → `data/room-desk.png`, drag it **below** the `Camera` scene source.
5. Keep it fresh: `ROOM=desk` in `.env`, then `make launcher` once. The launcher runs `make room-watch NAME=desk` with OBS: every 10 s it checks whether you're in the `Camera` cutout, and once you've been away a minute (breaks!) it paints the empty room, so no ghost of you ends up in the picture. After that it repaints only when the empty room looks different (lamp, daylight, things moved). OBS picks up the new file by itself. Knobs: `ROOM_SETTLE` (seconds away, 60), `ROOM_PRESENT` (share of the frame that counts as you, 0.05; seated measured 0.25), `ROOM_CHANGE` (0-255, 20), `ROOM_CUTOUT` (source name, Camera). `ROOM_DEBUG=1` prints the numbers.
6. Things that move and aren't people (a desk robot, a pet) get frozen into the picture and hidden by the cutout. Give them a live window: a scene `Reachy` holding the camera, with an Image Mask/Blend filter (Alpha Mask, Color Channel) using a soft white oval on black, placed between the anime room and `Camera`. Make the oval with `ffmpeg -f lavfi -i color=black:s=1920x1080 -vf "format=gray,geq=lum='255*clip((1-hypot((X-1344)/240\,(Y-640)/360))*4\,0\,1)'" -frames:v 1 data/reachy-mask.png` (centre 1344,640 and radii 240,360 in pixels: move them to your robot).

## Test
Start Recording → talk 30s, clap, `!task test` / `!done` in chat → Stop → File → Show Recordings.
