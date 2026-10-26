import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { formats, printGeometry } from '../app/lib/print-layout.ts';
const require=createRequire(import.meta.url);
const sharp=require('sharp');
const manifest={version:1,description:'Solid RGBA PNG frames. Photo openings are truly transparent; all other pixels are opaque.',themes:[]};
for(const [id,name,channel,ink] of [['black','Black',0,'#ffffff'],['white','White',255,'#000000']]) {
  const directory=path.resolve('public/frames',id);fs.mkdirSync(directory,{recursive:true});
  const theme={id,name,color:channel===0?'#000000':'#ffffff',ink,variants:[]};
  for(const format of formats)for(const withNote of [false,true]) {
    const g=printGeometry({format,paper:{color:theme.color,ink},frame:'plain',branding:false,date:false,caption:withNote?'Your note':''});
    const data=Buffer.alloc(format.w*format.h*4,channel);
    if(channel===0)for(let i=3;i<data.length;i+=4)data[i]=255;
    const boxes=[];
    for(let index=0;index<format.count;index++){
      const x=g.x+(index%format.cols)*(g.cell+g.gap),y=g.y+Math.floor(index/format.cols)*(g.cell+g.gap);
      boxes.push({x,y,width:g.cell,height:g.cell});
      for(let row=y;row<y+g.cell;row++)data.fill(0,(row*format.w+x)*4,(row*format.w+x+g.cell)*4);
    }
    const filename=`${format.id}-${withNote?'with-note':'no-note'}.png`,file=path.join(directory,filename);
    await sharp(data,{raw:{width:format.w,height:format.h,channels:4}}).png({compressionLevel:9}).toFile(file);
    // Validate the actual saved PNG, not just the input buffer.
    const {data:actual,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(info.width!==format.w||info.height!==format.h)throw Error(`Wrong size: ${filename}`);
    let alphaZero=0;
    for(let i=0;i<actual.length;i+=4){const alpha=actual[i+3];if(alpha===0)alphaZero++;else if(alpha!==255||actual[i]!==channel||actual[i+1]!==channel||actual[i+2]!==channel)throw Error(`Invalid pixel: ${filename}`);}
    if(alphaZero!==format.count*g.cell*g.cell)throw Error(`Incorrect cutout area: ${filename}`);
    for(const box of boxes)for(const [x,y] of [[box.x,box.y],[box.x+box.width-1,box.y+box.height-1]])if(actual[(y*format.w+x)*4+3]!==0)throw Error('Cutout alignment failed');
    theme.variants.push({layout:format.id,mode:withNote?'with-note':'no-note',src:`/frames/${id}/${filename}`,width:format.w,height:format.h,boxes,noteArea:withNote?{x:0,y:format.h-g.footer,width:format.w,height:g.footer}:null});
  }
  manifest.themes.push(theme);
}
fs.writeFileSync('public/frames/manifest.json',JSON.stringify(manifest,null,2));
fs.writeFileSync('public/frames/README.md',`# Black and white cutout frames\n\n32 exact-size RGBA PNGs: two themes × eight layouts × note/no-note.\n\nThe photo openings are transparent and the remaining frame is solid pure black or white. No guide lines, baked-in notes, branding or decorative outlines are included. Notes are drawn at runtime with contrasting text.\n\nUse manifest.json for exact canvas sizes and cutout coordinates. Regenerate with node --experimental-strip-types scripts/generate-solid-frames.mjs if layout geometry changes.\n`);
// Show both 3-photo strips against a checkerboard so even white borders are visible.
const checker=`<svg width="560" height="720" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="c" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#e6e6ed"/><path d="M0 0h12v12H0zM12 12h12v12H12z" fill="#f8f8fc"/></pattern></defs><rect width="560" height="720" fill="url(#c)"/><g font-family="Arial" font-size="18" fill="#4c5260" text-anchor="middle"><text x="150" y="30">BLACK</text><text x="410" y="30">WHITE</text></g></svg>`;
const black=await sharp('public/frames/black/strip-three-no-note.png').resize(200,600).toBuffer();
const white=await sharp('public/frames/white/strip-three-no-note.png').resize(200,600).toBuffer();
await sharp(Buffer.from(checker)).composite([{input:black,left:50,top:60},{input:white,left:310,top:60}]).png().toFile('public/frames/black-white-preview.png');
console.log('Generated and decoded all 32 PNGs: exact sizes, pure frame colors, full transparency, and cutout bounds verified.');
