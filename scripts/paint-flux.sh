#!/bin/sh
# One photo in on stdin, one anime-style PNG out on stdout, same size: the Docker painter's contract, but
# FLUX.2 [klein] 4B edit (Apache-2.0) through mflux, natively, since Docker on a Mac has no GPU.
# Install once: uv tool install --python 3.12 mflux --with 'pillow<13'. Model (~16 GB) downloads on first run.
# Logs go to stderr. Knobs: ROOM_FLUX_STEPS, ROOM_FLUX_SEED, ROOM_FLUX_PROMPT, ROOM_FLUX_QUANTIZE (MFLUX_BIN for tests).
set -eu
MFLUX_BIN=${MFLUX_BIN:-mflux-generate-flux2-edit}
STEPS=${ROOM_FLUX_STEPS:-4}
SEED=${ROOM_FLUX_SEED:-7}
# 8-bit by default: full precision needs ~16 GB and swaps on a 16 GB Mac (140 s/step on an M2 Pro). 0 = full precision.
QUANTIZE=${ROOM_FLUX_QUANTIZE:-8}
PROMPT=${ROOM_FLUX_PROMPT:-"Repaint this photo as a hand-painted anime background in the style of a Studio Ghibli film: soft painterly brushwork, clean line art, gentle cel shading. Keep the exact same room: same layout, furniture, objects, camera angle and lighting. Do not add any people."}

dir=$(mktemp -d)
trap 'rm -rf "$dir"' EXIT
cat > "$dir/in"
sips -s format png "$dir/in" --out "$dir/in.png" >/dev/null
size() { sips -g "$1" "$dir/in.png" | awk '/pixel/ {print $2}'; }
w=$(size pixelWidth)
h=$(size pixelHeight)
# klein works best around 1 MP: 1024 on the long side, aspect kept, sides in multiples of 16.
if [ "$w" -ge "$h" ]; then gw=1024; gh=$(( (h * 1024 / w + 8) / 16 * 16 )); else gh=1024; gw=$(( (w * 1024 / h + 8) / 16 * 16 )); fi

q=""
[ "$QUANTIZE" = 0 ] || q="--quantize $QUANTIZE"
# shellcheck disable=SC2086 # $q is empty or two words
"$MFLUX_BIN" --model flux2-klein-4b $q --image-paths "$dir/in.png" --prompt "$PROMPT" \
  --seed "$SEED" --steps "$STEPS" --width "$gw" --height "$gh" --output "$dir/out.png" >&2
sips -z "$h" "$w" "$dir/out.png" --out "$dir/final.png" >/dev/null
cat "$dir/final.png"
