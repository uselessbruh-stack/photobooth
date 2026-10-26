# Frame themes

The app offers nine themes: Black, White, Lavender, Baby pink hearts, Graphite confetti, Coral heart scatter, Pencil sketch, 35mm film, and Dihbooth film. Each has 16 full-resolution PNGs: eight digital layouts, with-note and no-note. Photo openings are transparent; Baby pink hearts uses heart-shaped openings. 35mm film has transparent sprocket holes, while Dihbooth has none. Notes are not baked into PNGs.

- black/ — solid black with white note ink
- white/ — solid white with black note ink
- lavender/ — light lavender with dark ink
- baby-pink-hearts/ — blush doodles with dusty-red ink and heart-shaped openings
- graphite-confetti/ — light gray with compact coral and antique-gold pencil accents
- coral-heart-scatter/ — light gray with scattered hand-drawn coral hearts
- pencil-heart-accent/ — light gray with a hand-sketched photo border
- 35mm-film/ — charcoal negative with transparent sprocket holes
- dihbooth-film/ — pure black with reusable transparent rail artwork and no sprocket holes

Exact canvas dimensions, cutout coordinates and note areas are in each theme's dimensions.json and the root manifest.json. Theme selection in the app uses app/lib/frame-themes.ts. Reusable transparent motif PNGs are saved in each decorative theme's motifs/ folder. Public serving copies are in public/frames/.

Regenerate plain themes with node --experimental-strip-types scripts/generate-theme-frames.mjs. Each decorative theme has its own generator in scripts/.
