# Digital frame assets

The booth offers eight digital arrangements: 2-, 3-, and 4-photo strips; single, 4-photo, and 9-photo squares; and 6-photo portrait and landscape grids. Each layout has square openings and a high-resolution canvas, so it can be printed at any size that preserves its aspect ratio.

`../frames/` contains the canonical theme PNGs, contact sheets, and `dimensions.json`. `../public/frames/` contains the runtime copies loaded by the app; its `manifest.json` lists themes and variants. Current themes are Black, White, Lavender, Baby pink hearts, Graphite confetti, Coral heart scatter, Pencil sketch, 35mm film, and Dihbooth film. Photo openings are transparent; Baby pink hearts uses heart-shaped openings, while the other themes use square openings. Dihbooth is pure black with transparent photo windows and no sprocket holes.

Layout measurements and SVG guides are in `FRAME-DESIGN-GUIDE.md`, `frame-dimensions.json`, `frame-dimensions.csv`, and the `*-with-note.svg` / `*-no-note.svg` templates. Notes are optional, limited to 30 characters, and drawn by the app rather than baked into frame PNGs.

Frame artwork generators are in `../scripts/`. Camera photos and print composition are processed locally in the browser.
