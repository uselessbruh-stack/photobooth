import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {formats,printGeometry} from '../app/lib/print-layout.ts';
const sharp=createRequire(import.meta.url)('sharp');
const folder=path.resolve('frames/baby-pink-hearts'),runtime=path.resolve('public/frames/baby-pink-hearts');
fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(runtime,{recursive:true});
const shape='M .5 .94 C .44 .87 .03 .63 .03 .34 C .03 .06 .35 .015 .5 .23 C .65 .015 .97 .06 .97 .34 C .97 .63 .56 .87 .5 .94 Z';
const entry={name:'Baby pink hearts',assetId:'baby-pink-hearts',color:'#f7c9d2',ink:'#9d344f',cutout:'heart',variants:[]};
const tiles=[];
for(let fi=0;fi<formats.length;fi++)for(const withNote of [false,true]){
  const f=formats[fi],g=printGeometry({format:f,paper:entry,frame:'plain',branding:false,date:false,caption:withNote?'Your note':''});
  const stroke=Math.max(5,g.unit*.005),heartStroke=Math.max(10,g.unit*.008),boxes=[];
  for(let i=0;i<f.count;i++)boxes.push({x:g.x+(i%f.cols)*(g.cell+g.gap),y:g.y+Math.floor(i/f.cols)*(g.cell+g.gap),width:g.cell,height:g.cell});
  const paths=boxes.map(b=>`<path d="${shape}" transform="translate(${b.x} ${b.y}) scale(${b.width})"/>`).join('');
  const outlines=boxes.map(b=>`<path d="${shape}" transform="translate(${b.x} ${b.y}) scale(${b.width})" fill="none" stroke="#a33e57" stroke-width="${heartStroke/b.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const note=withNote?`<rect x="${g.pad*.45}" y="${f.h-g.footer+g.fontSize*.12}" width="${f.w-g.pad*.9}" height="${g.footer-g.fontSize*.24}" rx="${g.fontSize*.2}" fill="#fbdce4" fill-opacity=".96"/>`:'';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}"><defs><mask id="holes" maskUnits="userSpaceOnUse" x="0" y="0" width="${f.w}" height="${f.h}"><rect width="100%" height="100%" fill="white"/><g fill="black">${paths}</g></mask></defs><g mask="url(#holes)"><rect width="100%" height="100%" fill="#f7c9d2"/>${note}<rect x="${stroke/2}" y="${stroke/2}" width="${f.w-stroke}" height="${f.h-stroke}" fill="none" stroke="#bd6a7d" stroke-width="${stroke*.4}"/></g>${outlines}</svg>`;
  const filename=`${f.id}-${withNote?'with-note':'no-note'}.png`,file=path.join(folder,filename);
  await sharp(Buffer.from(svg),{limitInputPixels:50000000}).png({compressionLevel:9}).toFile(file);
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==f.w||info.height!==f.h)throw Error('Wrong canvas dimensions');
  for(const b of boxes){const alpha=(x,y)=>data[(Math.floor(y)*f.w+Math.floor(x))*4+3];if(alpha(b.x+b.width*.5,b.y+b.height*.5)!==0)throw Error('Heart center must be transparent');if(alpha(b.x+b.width*.04,b.y+b.height*.04)!==255)throw Error('Heart corners must contain decorative frame');}
  if(withNote&&data[((f.h-10)*f.w+Math.floor(f.w/2))*4+3]!==255)throw Error('Note area must be opaque');
  fs.copyFileSync(file,path.join(runtime,filename));
  entry.variants.push({layout:f.id,mode:withNote?'with-note':'no-note',src:`/frames/baby-pink-hearts/${filename}`,width:f.w,height:f.h,photoBoxes:boxes,cutoutPathNormalized:shape,noteArea:withNote?{x:0,y:f.h-g.footer,width:f.w,height:g.footer}:null});
  const index=fi*2+Number(withNote),cw=300,ch=400,x=index%4*cw,y=Math.floor(index/4)*ch;
  const scale=Math.min(250/f.w,280/f.h),pw=Math.round(f.w*scale),ph=Math.round(f.h*scale);
  const png=await sharp(file).resize(pw,ph).png().toBuffer();tiles.push({input:png,left:x+Math.floor((cw-pw)/2),top:y+63+Math.floor((280-ph)/2)});
  console.log(`${filename}: dimensions and ${f.count} transparent heart openings verified`);
}
fs.writeFileSync(path.join(folder,'dimensions.json'),JSON.stringify(entry,null,2));
const labels=formats.flatMap((f,i)=>[false,true].map((n,j)=>{const x=(i*2+j)%4*300,y=Math.floor((i*2+j)/4)*400;return`<rect x="${x+5}" y="${y+5}" width="290" height="390" fill="#fbfbfd" stroke="#cdd3df"/><rect x="${x+15}" y="${y+58}" width="270" height="290" fill="url(#check)"/><g font-family="Arial" fill="#65515b" text-anchor="middle"><text x="${x+150}" y="${y+29}" font-size="16">${f.name}</text><text x="${x+150}" y="${y+48}" font-size="13">${n?'With note':'Without note'}</text><text x="${x+150}" y="${y+376}" font-size="14">${f.w} × ${f.h} px</text></g>`;})).join('');
const sheet=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><defs><pattern id="check" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#fafafd"/><path d="M0 0h10v10H0zM10 10h10v10H10z" fill="#e1e3eb"/></pattern></defs><rect width="100%" height="100%" fill="#f2f3f8"/>${labels}</svg>`;
await sharp(Buffer.from(sheet)).composite(tiles).png().toFile(path.join(folder,'all-layouts-preview.png'));
fs.writeFileSync(path.join(folder,'README.md'),'# Baby pink hearts\n\nSixteen exact-layout PNG overlays with genuine transparent heart-shaped photo openings. Eight layouts, each with and without note space. The full heart-shaped photo windows are the only heart motifs; no tiled decorations cross or break them.\n\nNo note text is baked into frames. Keep dimensions unchanged. The contact sheet checkerboard is only a preview; individual frame cutouts contain real alpha.\n\nRegenerate with node --experimental-strip-types scripts/generate-heart-frames.mjs.\n');
for(const target of ['frames/manifest.json','public/frames/manifest.json']){const manifest=JSON.parse(fs.readFileSync(target,'utf8'));manifest.themes=manifest.themes.filter(t=>(t.assetId||t.id)!=='baby-pink-hearts');manifest.themes.push(entry);fs.writeFileSync(target,JSON.stringify(manifest,null,2));}
console.log('16 baby-pink heart-cutout PNGs and the full contact sheet are ready.');
