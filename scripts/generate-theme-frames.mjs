import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {formats,printGeometry} from '../app/lib/print-layout.ts';
import {frameThemes} from '../app/lib/frame-themes.ts';
const sharp=createRequire(import.meta.url)('sharp');
const root=path.resolve('frames');fs.mkdirSync(root,{recursive:true});
const manifest={version:1,description:'Canonical frame artwork with transparent photo cutouts, opaque colored borders, and separate note/no-note variants.',themes:[]};
for(const theme of frameThemes.filter(theme=>!theme.cutout&&!theme.assetMode)){
  const folder=path.join(root,theme.assetId),runtime=path.resolve('public/frames',theme.assetId);
  fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(runtime,{recursive:true});
  const rgb=[1,3,5].map(i=>parseInt(theme.color.slice(i,i+2),16));
  const entry={...theme,variants:[]};
  for(const f of formats)for(const hasNote of [false,true]){
    const g=printGeometry({format:f,paper:theme,frame:'plain',branding:false,date:false,caption:hasNote?'note':''});
    const data=Buffer.alloc(f.w*f.h*4);for(let i=0;i<data.length;i+=4){data[i]=rgb[0];data[i+1]=rgb[1];data[i+2]=rgb[2];data[i+3]=255;}
    const boxes=[];
    for(let i=0;i<f.count;i++){
      const x=g.x+(i%f.cols)*(g.cell+g.gap),y=g.y+Math.floor(i/f.cols)*(g.cell+g.gap);boxes.push({x,y,width:g.cell,height:g.cell});
      for(let row=y;row<y+g.cell;row++)data.fill(0,(row*f.w+x)*4,(row*f.w+x+g.cell)*4);
    }
    const mode=hasNote?'with-note':'no-note',filename=`${f.id}-${mode}.png`,file=path.join(folder,filename);
    await sharp(data,{raw:{width:f.w,height:f.h,channels:4}}).png({compressionLevel:9}).toFile(file);
    const {data:actual,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let transparent=0;
    for(let i=0;i<actual.length;i+=4){if(actual[i+3]===0)transparent++;else if(actual[i+3]!==255||actual[i]!==rgb[0]||actual[i+1]!==rgb[1]||actual[i+2]!==rgb[2])throw Error(`${filename}: invalid border pixel`);}
    if(info.width!==f.w||info.height!==f.h||transparent!==f.count*g.cell*g.cell)throw Error(`${filename}: invalid cutout size`);
    for(const box of boxes)for(const [x,y]of[[box.x,box.y],[box.x+box.width-1,box.y+box.height-1]])if(actual[(y*f.w+x)*4+3]!==0)throw Error('Cutout misaligned');
    fs.copyFileSync(file,path.join(runtime,filename));
    entry.variants.push({layout:f.id,mode,file:`${theme.assetId}/${filename}`,src:`/frames/${theme.assetId}/${filename}`,width:f.w,height:f.h,cutouts:boxes,noteArea:hasNote?{x:0,y:f.h-g.footer,width:f.w,height:g.footer}:null});
  }
  fs.writeFileSync(path.join(folder,'dimensions.json'),JSON.stringify(entry,null,2));manifest.themes.push(entry);console.log(`${theme.name}: 16 PNGs verified (${theme.color}).`);
}
const readme=`# Frame themes

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

Exact canvas dimensions, cutout coordinates and note areas are in each theme's dimensions.json and the root manifest.json. Theme selection in the app uses app/lib/frame-themes.ts. Reusable transparent motif PNGs are saved in each decorative theme's motifs/ folder. Public serving copies are in public/frames/. Regenerate plain themes with node --experimental-strip-types scripts/generate-theme-frames.mjs; decorative sets with their corresponding scripts in scripts/.
`;
fs.writeFileSync(path.join(root,'README.md'),readme);fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
for(const theme of frameThemes.filter(t=>t.cutout||t.assetMode)){const file=path.resolve('frames',theme.assetId,'dimensions.json');if(fs.existsSync(file))manifest.themes.push(JSON.parse(fs.readFileSync(file,'utf8')));}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
fs.writeFileSync('public/frames/manifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync('public/frames/README.md',readme);
const solidThemes=frameThemes.filter(theme=>!theme.cutout&&!theme.assetMode);
const checker=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="680"><defs><pattern id="c" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#f9f9fc"/><path d="M0 0h10v10H0zM10 10h10v10H10z" fill="#e2e3eb"/></pattern></defs><rect width="100%" height="100%" fill="url(#c)"/>${solidThemes.map((t,i)=>`<text x="${125+i*250}" y="35" text-anchor="middle" font-family="Arial" font-size="20" fill="#4c5265">${t.name}</text>`).join('')}</svg>`;
const composites=[];for(let i=0;i<solidThemes.length;i++){const input=await sharp(path.join(root,solidThemes[i].assetId,'strip-three-no-note.png')).resize(180,540).toBuffer();composites.push({input,left:35+i*250,top:70});}
await sharp(Buffer.from(checker)).composite(composites).png().toFile(path.join(root,'themes-preview.png'));
console.log('48 exact-size transparent-cutout PNGs generated in frames/<theme>/ and synced to public/frames/<theme>/.');


