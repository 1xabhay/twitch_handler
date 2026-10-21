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
3. Keep it fresh: `ROOM=desk` in `.env`, then `make launcher` once (not while the launcher is running). The launcher now runs `make room-watch NAME=desk` with OBS: a tiny thumbnail every 10 s, and when the room stays different for a minute (lamp, daylight, things moved) it repaints; OBS picks up the new file by itself. Tune with `ROOM_CHANGE` (default 20; you moving in the chair measured 4-12, `ROOM_DEBUG=1` prints it) and `ROOM_SETTLE` (seconds, default 60).
4. Cut yourself out: install the [Background Removal plugin](https://github.com/royshil/obs-backgroundremoval) (check it supports your OBS version). Put the camera in its own scene `Camera`, add that scene as a source in your main scene, and put the Background Removal filter on **that** source, not on the camera itself (the watcher screenshots the camera and must see the whole room). Light yourself from the front.
5. Sources → + → Image → `data/room-desk.png`, drag it **below** the `Camera` scene source.

## Test
Start Recording → talk 30s, clap, `!task test` / `!done` in chat → Stop → File → Show Recordings.
