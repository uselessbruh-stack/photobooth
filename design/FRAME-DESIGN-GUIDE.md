# Digital frame design dimensions

All measurements below are in **pixels** at the actual digital export resolution. Layouts are identified by aspect ratio and photo arrangement, not physical inches. Every current colored frame theme shares the same geometry; only its color changes. These are final export dimensions, not the smaller on-screen preview.

## Note behavior

- Maximum **30 characters**, one line; spaces count. Notes are trimmed and line breaks become spaces.
- With a note: a **fixed band sized for that print format** occupies the bottom of the canvas. Text length never changes this band or the photo geometry.
- Without a note (including whitespace-only): **0 px note band**. Ordinary frame margins still remain.
- Note font: **5.5% of the shorter canvas edge, minimum 36 px**. The note band is **2.3 × the font size**, rounded to whole pixels. Both remain constant for that format regardless of note length. Text is horizontally centered. Text is constrained to the canvas width minus twice the base padding.
- The outer canvas never changes size. Make separate **with-note** and **no-note** frame variants where photo positions differ.

## Quick dimensions

Grid means columns × rows. Every photo opening is square. Gap is the edge-to-edge distance between adjacent photo openings, identical horizontally and vertically. A gap value is not applied where there is only one row/column.

| Layout (aspect ratio) | Outer canvas W × H | Grid | Photo box, no note | Photo box, with note | Gap |
|---|---:|---:|---:|---:|---:|
| 3-photo strip (1:3) | 1200 × 3600 | 1 × 3 | 1020 × 1020 | 1020 × 1020 | 48 |
| 2-photo strip (1:2) | 1200 × 2400 | 1 × 2 | 1020 × 1020 | 1010 × 1010 | 48 |
| 4-photo strip (1:4) | 1200 × 4800 | 1 × 4 | 1020 × 1020 | 1020 × 1020 | 48 |
| Single square (1:1) | 1800 × 1800 | 1 × 1 | 1530 × 1530 | 1302 × 1302 | 72 |
| 4-photo square (1:1) | 2400 × 2400 | 2 × 2 | 972 × 972 | 820 × 820 | 96 |
| 9-photo square (1:1) | 3000 × 3000 | 3 × 3 | 770 × 770 | 643 × 643 | 120 |
| 6-photo portrait (2:3) | 1800 × 2700 | 2 × 3 | 729 × 729 | 686 × 686 | 72 |
| 6-photo landscape (3:2) | 2700 × 1800 | 3 × 2 | 729 × 729 | 615 × 615 | 72 |

## Exact coordinates and margins

Use **frame-dimensions.json** for each photo box's x, y, width and height and the optional note area's bounds. Origin (0,0) is the top-left corner; x runs right and y runs down. Boxes are listed left-to-right, then top-to-bottom. All photo coordinates are snapped to integer pixels. Left/right or top/bottom margins can differ by one pixel after centering; preserve the supplied coordinates.

Use **frame-dimensions.csv** for a flat table including the individual outer-to-grid margins and first/all box origins. Its bottom margin includes the note band when present. The note band starts at canvasHeight − noteArea.height; any normal spacing between the photo grid and that band is also shown by the photo coordinates.

## SVG templates

Each layout has two SVGs named LAYOUT-ID-no-note.svg and LAYOUT-ID-with-note.svg. Import at original pixel dimensions into your design tool. Photo cutouts are transparent; blue outlines/numbers mark the exact openings; yellow marks the note band. These outlines and labels are guides only and must be removed from your final artwork.

For final PNG frame artwork:

1. Keep the exact outer canvas pixel size and export as RGBA PNG with transparency.
2. Make all photo openings transparent at the JSON coordinates. Artwork elsewhere can be opaque.
3. Do not paint guide lines/numbers or preprint the user's note. The app draws the note at runtime.
4. Preserve the note area as a readable blank area in the with-note version.
5. Export at 100% without cropping, automatic trimming, padding changes or resizing. No extra bleed is currently included in these templates; consult your printer before adding physical print bleed.

These templates are measurement guides. The photobooth loads finished theme PNGs from public/frames and draws optional notes at runtime.

Regenerate this package from the project root with: node --experimental-strip-types scripts/generate-strip-guide.mjs
