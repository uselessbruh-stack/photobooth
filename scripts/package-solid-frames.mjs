import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {formats,printGeometry} from '../app/lib/print-layout.ts';
const sharp=createRequire(import.meta.url)('sharp');
const root=path.resolve('design/black-white-exact-frames');fs.mkdirSync(root,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('public/frames/manifest.json','utf8'));
const rows=[];
for(const f of formats)for(const mode of ['no-note','with-note']){
  const g=printGeometry({format:f,paper:{color:'#000',ink:'#fff'},frame:'plain',branding:false,date:false,caption:mode==='with-note'?'Your note':''});
  const right=f.w-g.x-f.cols*g.cell-(f.cols-1)*g.gap,bottom=f.h-g.y-g.gridH;
  rows.push(`| ${f.name} | ${mode} | ${f.w} × ${f.h} | ${g.cell} × ${g.cell} | ${g.gap} | ${g.x} / ${right} / ${g.y} / ${bottom} | ${g.footer} |`);
}
for(const theme of manifest.themes){
  const directory=path.join(root,theme.id);fs.mkdirSync(directory,{recursive:true});
  const composites=[];const W=1360,H=1760,cw=340,ch=440;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><pattern id="check" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#f9f9fc"/><path d="M0 0h10v10H0zM10 10h10v10H10z" fill="#e0e1e8"/></pattern></defs><rect width="100%" height="100%" fill="#f4f5f9"/>`;
  for(let fi=0;fi<formats.length;fi++)for(let mi=0;mi<2;mi++){
    const f=formats[fi],mode=mi?'with-note':'no-note',index=fi*2+mi,x=(index%4)*cw,y=Math.floor(index/4)*ch;
    const variant=theme.variants.find(v=>v.layout===f.id&&v.mode===mode);
    const filename=`${f.id}__${f.w}x${f.h}px__${mode}.png`;
    const input=path.resolve('public'+variant.src);
    fs.copyFileSync(input,path.join(directory,filename));variant.downloadFile=`${theme.id}/${filename}`;
    const scale=Math.min(290/f.w,292/f.h),pw=Math.round(f.w*scale),ph=Math.round(f.h*scale);
    const small=await sharp(input).resize(pw,ph).toBuffer();
    composites.push({input:small,left:x+Math.floor((cw-pw)/2),top:y+71+Math.floor((292-ph)/2)});
    svg+=`<rect x="${x+8}" y="${y+8}" width="324" height="424" rx="5" fill="white" stroke="#d4d8e3"/><rect x="${x+20}" y="${y+66}" width="300" height="302" fill="url(#check)"/><g font-family="Arial" text-anchor="middle" fill="#444e62"><text x="${x+170}" y="${y+30}" font-size="17">${theme.name}: ${f.name}</text><text x="${x+170}" y="${y+52}" font-size="14">${mode==='with-note'?'With note space':'Without note space'}</text><text x="${x+170}" y="${y+391}" font-size="15">${f.w} × ${f.h} px · ${f.size}</text><text x="${x+170}" y="${y+413}" font-size="13">${variant.boxes[0].width} px square holes · ${f.count} photos</text></g>`;
  }
  svg+='</svg>';
  await sharp(Buffer.from(svg)).composite(composites).png().toFile(path.join(root,`${theme.id}-all-layouts.png`));
}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(root,'EXACT-DIMENSIONS.md'),`# Exact black and white PNG frames\n\n32 final frame images: 8 layouts × 2 note states × 2 colors. Every filename contains its canvas dimensions. Black uses #000000; white uses #FFFFFF. Photo cutouts are fully transparent. Frames contain no checkerboard, guide marks, labels or preprinted note.\n\nAll measurements are pixels. The same dimensions apply to both colors. Gap is edge-to-edge between adjacent photo boxes. Margins are Left / Right / Top / Bottom measured from canvas edges to the photo-grid edges; bottom includes the note area where present.\n\n| Layout | Variant | Outer canvas | Individual photo cutout | Gap | Margins L/R/T/B | Reserved note height |\n|---|---|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n\nSee manifest.json for each individual photo cutout's exact x/y/width/height and the note-area bounds.\n\nWith-note PNGs leave a solid blank bottom area for the app to draw the note. That area is fixed per layout, independent of text length. No-note PNGs have no extra note area.\n\nThe overview PNGs are previews on checkerboard backgrounds to demonstrate transparency. Use the individual PNGs inside black/ or white/ for your website. Do not resize or crop them before integration.\n`);
console.log('Packaged 32 individual PNG frames with dimensioned filenames, 2 complete visual sheets, an exact dimension table and a cutout-coordinate manifest.');
console.log(rows.join('\n'));
