import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {formats,printGeometry} from '../app/lib/print-layout.ts';
const sharp=createRequire(import.meta.url)('sharp');
const out=path.resolve('design/black-individual');fs.mkdirSync(out,{recursive:true});
const manifest=[];
for(const f of formats){
  for(const withNote of [false,true]){
    const mode=withNote?'with-note':'without-note';
    const g=printGeometry({format:f,paper:{color:'#000000',ink:'#ffffff'},frame:'plain',branding:false,date:false,caption:withNote?'note':''});
    const buffer=Buffer.alloc(f.w*f.h*4);
    for(let i=3;i<buffer.length;i+=4)buffer[i]=255;
    const boxes=[];
    for(let i=0;i<f.count;i++){
      const x=g.x+(i%f.cols)*(g.cell+g.gap),y=g.y+Math.floor(i/f.cols)*(g.cell+g.gap);
      boxes.push({x,y,width:g.cell,height:g.cell});
      for(let row=y;row<y+g.cell;row++)buffer.fill(0,(row*f.w+x)*4,(row*f.w+x+g.cell)*4);
    }
    const filename=`black-${f.id}-${mode}-${f.w}x${f.h}.png`;
    const file=path.join(out,filename);
    // Each variant is independently rendered and encoded as its own PNG.
    await sharp(buffer,{raw:{width:f.w,height:f.h,channels:4}}).png({compressionLevel:9}).toFile(file);
    const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let transparent=0;
    for(let p=0;p<data.length;p+=4){if(data[p]||data[p+1]||data[p+2])throw Error('Nonblack pixel');if(data[p+3]===0)transparent++;else if(data[p+3]!==255)throw Error('Unexpected partial alpha');}
    if(info.width!==f.w||info.height!==f.h||transparent!==f.count*g.cell*g.cell)throw Error('Dimensions or transparency failed');
    manifest.push({file:filename,width:f.w,height:f.h,mode,cutouts:boxes,noteArea:withNote?{x:0,y:f.h-g.footer,width:f.w,height:g.footer}:null});
    console.log(`${filename} — ${f.count} transparent square cutouts verified`);
  }
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
