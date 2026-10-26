import fs from 'node:fs';
import path from 'node:path';
import { formats, printGeometry, MAX_NOTE_LENGTH, normalizeNote } from '../app/lib/print-layout.ts';
const out = path.resolve('design');
fs.mkdirSync(out, { recursive: true });
const catalog = [];
const rows = [];
const table = [];
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for (const format of formats) {
  const variants = {};
  for (const withNote of [false, true]) {
    const options = {format, paper:{color:'#e9e8f5',ink:'#53576d'},frame:'plain',branding:false,date:false,caption:withNote?'Your note':''};
    const g = printGeometry(options);
    const boxes = Array.from({length:format.count},(_,index)=>({index:index+1,x:g.x+(index%format.cols)*(g.cell+g.gap),y:g.y+Math.floor(index/format.cols)*(g.cell+g.gap),width:g.cell,height:g.cell}));
    const gridW = format.cols*g.cell+(format.cols-1)*g.gap;
    const margins = {left:g.x,right:format.w-g.x-gridW,top:g.y,bottom:format.h-g.y-g.gridH};
    const variant = {mode:withNote?'with-note':'no-note',canvas:{width:format.w,height:format.h},grid:{columns:format.cols,rows:format.rows},photoBox:{width:g.cell,height:g.cell},gap:{horizontal:g.gap,vertical:g.gap},margins,noteArea:withNote?{x:0,y:format.h-g.textLine,width:format.w,height:g.textLine,textMaxLength:MAX_NOTE_LENGTH,textFontSize:g.fontSize,textBaseline:format.h-g.textLine/2+g.fontSize*.35,textMaxWidth:format.w-2*g.pad}:null,boxes};
    variants[variant.mode] = variant;
    const id = `${format.id}-${variant.mode}`;
    const rects = boxes.map(b=>`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/>`).join('');
    const outlines = boxes.map(b=>`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="#407bb4" stroke-width="2"/><text x="${b.x+b.width/2}" y="${b.y+b.height/2}" fill="#407bb4" text-anchor="middle" font-family="Arial" font-size="${Math.min(32,g.cell*.07)}">${b.index}: ${g.cell} × ${g.cell} px</text>`).join('');
    const note = withNote?`<rect x="0" y="${format.h-g.textLine}" width="${format.w}" height="${g.textLine}" fill="#fff3c9" stroke="#c59c38" stroke-width="2" stroke-dasharray="8 5"/><text x="${format.w/2}" y="${format.h-g.textLine/2+g.fontSize*.35}" fill="#967018" text-anchor="middle" font-family="Arial" font-size="${g.fontSize}">NOTE: ${g.textLine} px · max 30 characters</text>`:'';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${format.w}" height="${format.h}" viewBox="0 0 ${format.w} ${format.h}"><title>${esc(format.name)} ${format.size} ${variant.mode}</title><defs><mask id="holes"><rect width="100%" height="100%" fill="white"/><g fill="black">${rects}</g></mask></defs><rect width="100%" height="100%" fill="#e9e8f5" mask="url(#holes)"/>${outlines}${note}</svg>`;
    fs.writeFileSync(path.join(out,`${id}.svg`),svg);
    rows.push([format.name,format.size,variant.mode,format.w,format.h,format.cols,format.rows,g.cell,g.cell,g.gap,g.gap,margins.left,margins.right,margins.top,margins.bottom,withNote?g.textLine:0,boxes.map(b=>`${b.x}:${b.y}`).join(';')]);
    for(const caption of withNote?['x','x'.repeat(30)]:['','   ']) {
      const actual=printGeometry({...options,caption});
      if(actual.cell!==g.cell||actual.x!==g.x||actual.y!==g.y||actual.footer!==(withNote?g.textLine:0))throw Error(`Unstable geometry ${id}`);
    }
    for(const b of boxes)if(b.width!==b.height||b.x<0||b.y<0||b.x+b.width>format.w||b.y+b.height>format.h-g.footer)throw Error(`Invalid box ${id}`);
  }
  catalog.push({id:format.id,name:format.name,aspectRatio:format.size,...variants});
  const a=variants['no-note'],b=variants['with-note'];
  table.push(`| ${format.name} (${format.size}) | ${format.w} × ${format.h} | ${format.cols} × ${format.rows} | ${a.photoBox.width} × ${a.photoBox.height} | ${b.photoBox.width} × ${b.photoBox.height} | ${a.gap.horizontal} |`);
}
if(normalizeNote('a'.repeat(40)).length!==30)throw Error('Note cap failed');
fs.writeFileSync(path.join(out,'frame-dimensions.json'),JSON.stringify({units:"pixels",exportType:"digital PNG",note:{maxCharacters:30,height:"Fixed per format; see noteArea",fontSize:"5.5% of shorter canvas edge, minimum 36 px"},formats:catalog},null,2));
const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
fs.writeFileSync(path.join(out,'frame-dimensions.csv'),[['Name','Aspect ratio','Variant','Canvas width px','Canvas height px','Columns','Rows','Photo width px','Photo height px','Gap horizontal px','Gap vertical px','Left margin px','Right margin px','Top margin px','Bottom margin px','Note area height px','Box origins x:y, reading order'].join(','),...rows.map(r=>r.map(quote).join(','))].join('\n'));
const guide=`# Digital frame design dimensions

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
${table.join('\n')}

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
`;
fs.writeFileSync(path.join(out,'FRAME-DESIGN-GUIDE.md'),guide);
console.log(guide.split('## Exact coordinates')[0]);
console.log(`Verified ${formats.length*2} layouts and fixed note geometry for 1- and 30-character notes; wrote 16 SVG guides + CSV + JSON + Markdown.`);
