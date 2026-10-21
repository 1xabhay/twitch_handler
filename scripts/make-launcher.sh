#!/bin/sh
# Builds ~/Applications/Isamy Stream.app: starts the bot, opens OBS, stops the bot when OBS quits.
# Usage: npm run launcher   (re-run after moving the project folder)
set -e
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node)"
APP="$HOME/Applications/Isamy Stream.app"
LOG="$HOME/Library/Logs/isamy-bot.log"

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
cat > "$APP/Contents/MacOS/launch.new" <<LAUNCH
#!/bin/sh
cd "$PROJECT"
pkill -f "src/main.ts" 2>/dev/null; sleep 1   # never run two bots
echo "--- \$(date) starting bot" >> "$LOG"
"$NODE" --env-file=.env src/main.ts >> "$LOG" 2>&1 &
BOT=\$!
open -W -a OBS                                 # wait here until OBS quits
kill \$BOT 2>/dev/null
echo "--- \$(date) bot stopped (OBS closed)" >> "$LOG"
LAUNCH
chmod +x "$APP/Contents/MacOS/launch.new"
mv "$APP/Contents/MacOS/launch.new" "$APP/Contents/MacOS/launch"   # new file: a running launcher keeps its own copy
cp /Applications/OBS.app/Contents/Resources/AppIcon.icns "$APP/Contents/Resources/AppIcon.icns" 2>/dev/null || true
echo "built: $APP (log: $LOG)"
