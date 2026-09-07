# LENA brand assets

Master files for the LENA Digital House logo. All artwork is vector, drawn on a
512 grid, with no font dependency in the mark and the Latin wordmark (the
letterforms are paths, not text).

## Files

| File | Use |
| --- | --- |
| `lena-mark.svg` | Primary mark — evolved L glyph with an orbit node (concept A) |
| `lena-mark-alt.svg` | Alternate mark — connected-systems house (concept B) |
| `lena-mark-mono.svg` | Single-colour mark (white) for dark surfaces and mono print |
| `lena-lockup-dark.svg` | Mark + LENA + DIGITAL HOUSE, for dark backgrounds |
| `lena-lockup-light.svg` | Mark + LENA + DIGITAL HOUSE, for light backgrounds |
| `lena-lockup-alt-dark.svg` | Alternate mark lockup |
| `lena-lockup-ar.svg` | Arabic lockup (لينا) — needs an Arabic font at render time |
| `lena-mark-{64,192,512}.png` | Raster exports of the primary mark |
| `lena-mark-alt-{192,512}.png` | Raster exports of the alternate mark |
| `lena-mark-maskable-512.png` | PWA maskable icon (mark padded on the tile colour) |
| `index.html` | Brand sheet — served at `/brand/` in the dev server |

`lena-lockup-ar.svg` is the only file that depends on a font
(`Noto Sans Arabic` / `Noto Kufi Arabic`); the site's own lockup renders the
tagline in HTML instead, so nothing on the site breaks if the font is missing.

## Palette

| Role | Hex |
| --- | --- |
| Deep navy (page) | `#030612` |
| Tile top | `#101E45` |
| Tile bottom | `#04081A` |
| Blue | `#72A5FF` |
| Violet | `#9D7CFF` |
| Pink | `#FF83C3` |
| Cyan node | `#51E1FF` |
| Gold | `#FFC76A` |
| Text | `#F5F8FF` |

## Usage in code

`src/design-system/brand/LenaLogo.tsx` renders the same geometry inline, so the
component and the exported files never drift:

```tsx
import LenaLogo from "@/design-system/brand/LenaLogo";

<LenaLogo />                        // mark + wordmark
<LenaLogo compact />                // mark only
<LenaLogo variant="house" />        // alternate concept
```

Clear space: keep at least the mark's corner radius (≈24% of its size) free on
all sides. Minimum size: 16 px for the mark, 96 px wide for a lockup.
