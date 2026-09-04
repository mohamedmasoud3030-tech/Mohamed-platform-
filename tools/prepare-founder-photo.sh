#!/usr/bin/env bash
# Prepares the founder photograph for the web, and builds the social preview card.
#
# Run:  bash tools/prepare-founder-photo.sh <path-to-photo>
#
# What it does, and why:
#  - strips all metadata (photographs routinely carry GPS coordinates, camera
#    serial numbers and timestamps — none of that belongs on a public website);
#  - produces a square portrait sized for the page, not the original megapixels;
#  - produces a 1200x630 social preview card, because link previews on WhatsApp
#    and LinkedIn do not render SVG and currently show no image at all.
#
# After running, set FOUNDER.photo to "/founder.jpg" in
# artifacts/jiwdah/src/content/founder.ts.

set -euo pipefail

SOURCE="${1:-}"
PUBLIC="$(cd "$(dirname "$0")/.." && pwd)/artifacts/jiwdah/public"

if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
  echo "usage: bash tools/prepare-founder-photo.sh <path-to-photo>" >&2
  exit 1
fi

command -v convert >/dev/null || { echo "ImageMagick 'convert' is required." >&2; exit 1; }

# Resolve a font by file path rather than by name: registered font names differ
# between machines, and a missing name silently falls back to an unreadable one.
FONT_BOLD=""
FONT_REG=""
for candidate in /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf /usr/share/fonts/**/DejaVuSans-Bold.ttf; do
  [ -f "$candidate" ] && FONT_BOLD="$candidate" && break
done
for candidate in /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf /usr/share/fonts/**/DejaVuSans.ttf; do
  [ -f "$candidate" ] && FONT_REG="$candidate" && break
done
if [ -z "$FONT_BOLD" ] || [ -z "$FONT_REG" ]; then
  echo "note: no DejaVu font found — the preview card will be built without text." >&2
fi

echo "source: $SOURCE ($(identify -format '%wx%h' "$SOURCE"))"

# 1. Portrait: square, centred, metadata removed.
convert "$SOURCE" \
  -auto-orient -strip \
  -resize 440x440^ -gravity center -extent 440x440 \
  -quality 82 -interlace Plane \
  "$PUBLIC/founder.jpg"
echo "wrote founder.jpg   $(identify -format '%wx%h, %b' "$PUBLIC/founder.jpg")"

# 2. Social preview: 1200x630, portrait on the brand background with the wordmark.
convert -size 1200x630 \
  gradient:'#0b1230-#050814' \
  \( "$SOURCE" -auto-orient -strip -resize 380x380^ -gravity center -extent 380x380 \
     \( -size 380x380 xc:none -fill white -draw 'circle 190,190 190,4' \) \
     -alpha set -compose DstIn -composite \) \
  -gravity west -geometry +90+0 -compose over -composite \
  ${FONT_BOLD:+-font "$FONT_BOLD"} -pointsize 50 -fill '#ffffff' \
  -gravity northwest -annotate +520+214 'LENA Digital House' \
  ${FONT_REG:+-font "$FONT_REG"} -pointsize 28 -fill '#e8eeff' \
  -gravity northwest -annotate +522+288 'Mohamed Masoud' \
  ${FONT_REG:+-font "$FONT_REG"} -pointsize 23 -fill '#8fa3cf' \
  -gravity northwest -annotate +522+336 'Operating systems for' \
  -gravity northwest -annotate +522+368 'real businesses' \
  -strip -quality 86 \
  "$PUBLIC/lena-og.jpg"
echo "wrote lena-og.jpg   $(identify -format '%wx%h, %b' "$PUBLIC/lena-og.jpg")"

echo
echo "Next: set FOUNDER.photo = \"/founder.jpg\" in artifacts/jiwdah/src/content/founder.ts"
echo "      and DEFAULT_OG_IMAGE = \"/lena-og.jpg\" in artifacts/jiwdah/src/lib/seo.ts"
