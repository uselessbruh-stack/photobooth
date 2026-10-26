# Little Moments Photobooth

A hand-drawn lavender photobooth experience built with Next.js. Guests choose a film look and frame, take a sequence of photos, watch their strip develop, then download the finished keepsake.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. Camera capture requires localhost or HTTPS; photos are processed in the browser and are not uploaded.

## Project map

- `app/` — the booth flow, layout picker, camera, print preview, and browser-side photo/print logic.
- `public/art/` and `public/fonts/` — illustrated booth scenes, control artwork, and locally served fonts.
- `frames/` — canonical full-resolution transparent frame PNGs, organized by theme, with dimensions and previews.
- `public/frames/` — runtime copies loaded by the app.
- `design/` — layout guides, pixel dimensions, and SVG templates.
- `scripts/` — reproducible frame and design asset generators.

The favicon is the lavender camera illustration in `app/icon.svg`. Frame exports retain square photo openings; optional notes are drawn by the app and are not baked into frame PNGs.
