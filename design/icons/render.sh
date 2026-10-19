#!/bin/bash
# Renders the PNG icons in public/ from the SVG sources here (headless Chromium).
# Usage: design/icons/render.sh   (run from the repository root)
set -eu
src=design/icons
out=public
render() { # svg size png
  local tmp
  tmp=$(mktemp --suffix=.html)
  printf '<html><body style="margin:0;background:transparent"><img src="file://%s/%s" width="%s" height="%s" style="display:block"></body></html>' \
    "$PWD" "$1" "$2" "$2" > "$tmp"
  chromium --headless --no-sandbox --disable-gpu --hide-scrollbars --default-background-color=00000000 \
    --window-size="$2,$2" --screenshot="$PWD/$3" "file://$tmp" > /dev/null 2>&1
  rm -f "$tmp"
}
render "$src/icon.svg" 192 "$out/icon-192.png"
render "$src/icon.svg" 512 "$out/icon-512.png"
render "$src/icon-maskable.svg" 512 "$out/icon-maskable-512.png"
render "$src/icon-maskable.svg" 180 "$out/apple-touch-icon.png"
