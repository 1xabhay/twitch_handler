#!/bin/sh
# Builds ~/Applications/Isamy Stream.app: starts the bot, installs the Spotify scene switch as a LaunchAgent, opens OBS, stops the bot when OBS quits.
# Usage: npm run launcher   (re-run after moving the project folder)
set -e
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node)"
APP="$HOME/Applications/Isamy Stream.app"
LOG="$HOME/Library/Logs/isamy-bot.log"
AGENT="$HOME/Library/LaunchAgents/tv.heyisamy.spotify-quiet.plist"

mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Isamy Stream</string>
  <key>CFBundleExecutable</key><string>launch</string>
  <key>CFBundleIdentifier</key><string>tv.heyisamy.stream</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
</dict></plist>
PLIST
# Spotify scene switch (scripts/spotify-quiet.ts) as a LaunchAgent: macOS keeps it alive, so closing a terminal or
# editor never un-mutes the room. Idle while OBS is closed. Load by hand once: launchctl bootstrap gui/$(id -u) "$AGENT"
mkdir -p "$(dirname "$AGENT")"
cat > "$AGENT" <<AGENTPLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>tv.heyisamy.spotify-quiet</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>scripts/spotify-quiet.ts</string></array>
  <key>WorkingDirectory</key><string>$PROJECT</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/isamy-spotify-quiet.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/isamy-spotify-quiet.log</string>
</dict></plist>
AGENTPLIST
cat > "$APP/Contents/MacOS/launch.new" <<LAUNCH
#!/bin/sh
cd "$PROJECT"
pkill -f "src/main.ts" 2>/dev/null; sleep 1   # never run two bots
echo "--- \$(date) starting bot" >> "$LOG"
"$NODE" --env-file=.env src/main.ts >> "$LOG" 2>&1 &
BOT=\$!
launchctl bootstrap gui/\$(id -u) "$AGENT" 2>/dev/null || true   # Spotify switch: a LaunchAgent, already running is fine
open -W -a OBS                                # wait here until OBS quits
kill \$BOT 2>/dev/null
echo "--- \$(date) bot stopped (OBS closed)" >> "$LOG"
LAUNCH
chmod +x "$APP/Contents/MacOS/launch.new"
mv "$APP/Contents/MacOS/launch.new" "$APP/Contents/MacOS/launch"   # new file: a running launcher keeps its own copy
cp /Applications/OBS.app/Contents/Resources/AppIcon.icns "$APP/Contents/Resources/AppIcon.icns" 2>/dev/null || true
echo "built: $APP (log: $LOG)"
