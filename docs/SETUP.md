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

- **Black GoPro in OBS** (GoPro preview fine, menu bar icon blue): double-click the Video Capture Device → switch Device to another camera, then back to the GoPro → OK. Cause (from the OBS log, 2026-10-21): OBS saves the camera's unique ID, and the GoPro Webcam app hands out a new ID on every reconnect, so OBS asks for a camera that no longer exists (`Unable to initialize device with unique ID`). Re-picking by name fetches the current ID. The bot now does this by itself within a minute (current ID from `system_profiler SPCameraDataType`, obs-websocket on). Tip: turn the GoPro on *before* opening OBS.

## Audio
- Settings → Audio → Mic/Aux → your mic. Peak in yellow, never red.
- Filters: Noise Suppression (RNNoise), then Compressor.
- **Music on its own source** (so muting the mic doesn't mute music): Sources → + → macOS Audio Capture → Mode: Application → Spotify. Mute the *Mic/Aux* slider in OBS's Audio Mixer (not the Mac's mic or Spotify), music keeps going. Wear headphones so the mic doesn't pick up the music twice. Keep music about 10 dB under your voice: here the Spotify source sits at -22 dB, so music peaks about -27 dB against a voice at -15 to -18 dB (measured from the post-fader meters).

## Overlay
- Browser source `http://localhost:3001/town`, 1920×1080, top of Sources. Bot must be running.

## Layout: real desk, pixel world
One style per scene, nothing over you or the desk robot. Tools → WebSocket Server Settings → **Enable** first. `make obs-scenes` (OBS open) builds two scenes from your camera, mic and music, and leaves your other scenes alone:
- **Focus**: the real camera full frame + `City band` (`/town?bg=0&sky=0`, buildings only, cropped to the bottom 280 px so it sits along the desk line) + `Timer` (`/timer` card at half size, top right). Uncropped, the band's sky haze and clock covered the camera.
- **Break**: `City full` (`/town?bg=city`) + the camera small, top right (480x270).
Switch between them yourself (scene buttons, or a hotkey in Settings → Hotkeys). Make the camera clean in the room, not in software: aim the GoPro (Linear lens) at the plainest wall, crop tight, one soft light in front of you.

**Don't** send obs-websocket `GetInputPropertiesListPropertyItems` for a macOS Audio Capture source's `application` list: it crashed OBS 32.2 twice (null string in obs-websocket). `GetInputSettings` is fine.

## Test
Start Recording → talk 30s, clap, `!task test` / `!done` in chat → Stop → File → Show Recordings.
