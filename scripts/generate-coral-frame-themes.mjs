import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {formats,printGeometry} from "../app/lib/print-layout.ts";
import {buildMotifPngs,placeOnWindowEdges,coralHeartSprites,pencilSketchSprites} from "./frame-motif-pngs.mjs";
const sharp=createRequire(import.meta.url)("sharp");
const themes=[
 {name:"Coral heart scatter",assetId:"coral-heart-scatter",color:"#eee1df",ink:"#936a68",accent:"#d36f69",fill:"#f4aaa3",kind:"scatter",description:"Warm blush paper with small filled coral hearts scattered around the square windows."},
 {name:"Pencil sketch",assetId:"pencil-heart-accent",color:"#e8e5f0",ink:"#5c566b",accent:"#625b70",outline:"#b47f96",fill:"none",kind:"accent",description:"Cool lavender paper with graphite pencil marks, little star sketches, and one loose dusty-rose photo border."}
];
for(const theme of themes){
 const folder=path.resolve("frames",theme.assetId),runtime=path.resolve("public/frames",theme.assetId);
 fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(runtime,{recursive:true});
 const entry={name:theme.name,assetId:theme.assetId,color:theme.color,ink:theme.ink,assetMode:"pattern",variants:[]},thumbs=[];
 const motifPngs=await buildMotifPngs(sharp,path.join(folder,"motifs"),theme.kind==="scatter"?coralHeartSprites:pencilSketchSprites);
 for(let fi=0;fi<formats.length;fi++)for(const hasNote of [false,true]){
  const f=formats[fi],g=printGeometry({format:f,paper:theme,frame:"plain",branding:false,date:false,caption:hasNote?"note":""});
  const line=Math.max(5,Math.round(g.unit*.004)),boxes=[];
  for(let i=0;i<f.count;i++)boxes.push({x:g.x+(i%f.cols)*(g.cell+g.gap),y:g.y+Math.floor(i/f.cols)*(g.cell+g.gap),width:g.cell,height:g.cell});
  const holes=boxes.map(b=>"<rect x=\""+b.x+"\" y=\""+b.y+"\" width=\""+b.width+"\" height=\""+b.height+"\"/>").join("");
  const borders=boxes.map(b=>"<rect x=\""+b.x+"\" y=\""+b.y+"\" width=\""+b.width+"\" height=\""+b.height+"\" fill=\"none\" stroke=\""+theme.ink+"\" stroke-width=\""+line+"\"/>").join("");
  let seed=(fi+1)*2654435761+(hasNote?7919:0)+(theme.kind==="accent"?15485863:0);
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const motifSize=Math.max(68,Math.round(Math.min(g.unit*(theme.kind==="scatter" ? .115 : .11),g.cell*.2)));
  const motifCount=theme.kind==="scatter"?boxes.length*2:Math.max(6,Math.min(12,boxes.length*2));
  const positions=placeOnWindowEdges(boxes,motifCount,motifSize,rand,{width:f.w,height:f.h,footer:g.footer,layout:f.id});
  const pencilNames=["graphite-star.png","graphite-hatch.png","tiny-pencil.png","graphite-dots.png"];
  const doodleMarkup=positions.map((p,i)=>{
   const name=theme.kind==="scatter"?"coral-heart.png":pencilNames[i%pencilNames.length],angle=Math.round((rand()-.5)*38);
   return "<image xlink:href=\"data:image/png;base64,"+motifPngs[name]+"\" x=\""+(p.x-motifSize/2)+"\" y=\""+(p.y-motifSize/2)+"\" width=\""+motifSize+"\" height=\""+motifSize+"\" transform=\"rotate("+angle+" "+p.x+" "+p.y+")\"/>";
  }).join("");
  let accentOutline="";
  if(theme.kind==="accent"){
   const b=boxes[Math.floor((boxes.length-1)/2)],q=Math.max(12,line*2.5);
   const d="M "+(b.x-q)+" "+(b.y+q)+" L "+(b.x+b.width*.27)+" "+(b.y-q*.5)+" L "+(b.x+b.width*.61)+" "+(b.y+q*.35)+" L "+(b.x+b.width+q)+" "+(b.y-q*.2)+" L "+(b.x+b.width+q*.45)+" "+(b.y+b.height*.29)+" L "+(b.x+b.width+q)+" "+(b.y+b.height*.64)+" L "+(b.x+b.width-q*.4)+" "+(b.y+b.height+q)+" L "+(b.x+b.width*.68)+" "+(b.y+b.height+q*.4)+" L "+(b.x+b.width*.31)+" "+(b.y+b.height+q)+" L "+(b.x-q)+" "+(b.y+b.height-q*.3)+" L "+(b.x-q*.5)+" "+(b.y+b.height*.63)+" L "+(b.x-q)+" "+(b.y+b.height*.28)+" Z";
   accentOutline="<path d=\""+d+"\" fill=\"none\" stroke=\""+theme.outline+"\" stroke-width=\""+Math.max(10,line*1.6)+"\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>";
  }
  const footerColor=theme.kind==="scatter"?"#f6d9d5":"#f1eff7",footer=hasNote?"<rect x=\""+g.pad+"\" y=\""+(f.h-g.footer+line)+"\" width=\""+(f.w-2*g.pad)+"\" height=\""+(g.footer-line*2)+"\" rx=\""+Math.max(4,line*2)+"\" fill=\""+footerColor+"\" fill-opacity=\".97\" stroke=\""+theme.ink+"\" stroke-opacity=\".44\" stroke-width=\""+line+"\"/>":"";
  const svg="<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\""+f.w+"\" height=\""+f.h+"\" viewBox=\"0 0 "+f.w+" "+f.h+"\"><defs><mask id=\"holes\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\""+f.w+"\" height=\""+f.h+"\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g fill=\"black\">"+holes+"</g></mask></defs><g mask=\"url(#holes)\"><rect width=\"100%\" height=\"100%\" fill=\""+theme.color+"\"/><rect x=\""+line+"\" y=\""+line+"\" width=\""+(f.w-line*2)+"\" height=\""+(f.h-line*2)+"\" fill=\"none\" stroke=\""+theme.ink+"\" stroke-width=\""+line+"\"/>"+borders+footer+"</g>"+doodleMarkup+accentOutline+"</svg>";
  const mode=hasNote?"with-note":"no-note",filename=f.id+"-"+mode+".png",file=path.join(folder,filename);
  await sharp(Buffer.from(svg),{limitInputPixels:50000000}).png({compressionLevel:9}).toFile(file);
  const result=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(result.info.width!==f.w||result.info.height!==f.h)throw Error(theme.assetId+"/"+filename+": wrong dimensions");
  for(const b of boxes){const center=(Math.floor(b.y+b.height/2)*f.w+Math.floor(b.x+b.width/2))*4+3;if(result.data[center]!==0)throw Error(filename+": square photo opening not transparent");}
  if(result.data[3]!==255)throw Error(filename+": frame must be opaque outside the photos");
  if(hasNote&&result.data[((f.h-10)*f.w+Math.floor(f.w/2))*4+3]!==255)throw Error(filename+": note band must be opaque");
  fs.copyFileSync(file,path.join(runtime,filename));
  entry.variants.push({layout:f.id,mode,file:theme.assetId+"/"+filename,src:"/frames/"+theme.assetId+"/"+filename,width:f.w,height:f.h,cutouts:boxes,noteArea:hasNote?{x:0,y:f.h-g.footer,width:f.w,height:g.footer}:null});
  const index=fi*2+Number(hasNote),cw=300,ch=400,x=index%4*cw,y=Math.floor(index/4)*ch,scale=Math.min(250/f.w,280/f.h),pw=Math.round(f.w*scale),ph=Math.round(f.h*scale);
  const preview=await sharp(file).resize(pw,ph).png().toBuffer();thumbs.push({input:preview,left:x+Math.floor((cw-pw)/2),top:y+63+Math.floor((280-ph)/2)});
  console.log(theme.name+": "+filename+" verified");
 }
 fs.writeFileSync(path.join(folder,"dimensions.json"),JSON.stringify(entry,null,2));
 const labels=formats.flatMap((f,i)=>[false,true].map((note,j)=>{const x=(i*2+j)%4*300,y=Math.floor((i*2+j)/4)*400;return"<rect x=\""+(x+5)+"\" y=\""+(y+5)+"\" width=\"290\" height=\"390\" fill=\"#fbfbfd\" stroke=\"#cdd3df\"/><rect x=\""+(x+15)+"\" y=\""+(y+58)+"\" width=\"270\" height=\"290\" fill=\"url(#check)\"/><g font-family=\"Arial\" fill=\"#65515b\" text-anchor=\"middle\"><text x=\""+(x+150)+"\" y=\""+(y+29)+"\" font-size=\"16\">"+f.name+"</text><text x=\""+(x+150)+"\" y=\""+(y+48)+"\" font-size=\"13\">"+(note?"With note":"Without note")+"</text><text x=\""+(x+150)+"\" y=\""+(y+376)+"\" font-size=\"14\">"+f.w+" × "+f.h+" px</text></g>";})).join("");
 const sheet="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"1600\"><defs><pattern id=\"check\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><rect width=\"20\" height=\"20\" fill=\"#fafafd\"/><path d=\"M0 0h10v10H0zM10 10h10v10h-10z\" fill=\"#e1e3eb\"/></pattern></defs><rect width=\"100%\" height=\"100%\" fill=\"#f2f3f8\"/>"+labels+"</svg>";
 await sharp(Buffer.from(sheet)).composite(thumbs).png().toFile(path.join(folder,"all-layouts-preview.png"));
 const readme="# "+theme.name+"\n\n"+theme.description+" Eight digital layouts, each with and without note space. Every photo opening stays square and transparent. Complete decorations can cross a window edge without changing the photo cutouts.\n\nReusable transparent PNG stamps are saved in motifs/. The pencil design uses graphite marks and one loose pencil outline around its middle photo. No note text is baked into frames.\n\nRegenerate both themes with node --experimental-strip-types scripts/generate-coral-frame-themes.mjs.\n";
 fs.writeFileSync(path.join(folder,"README.md"),readme);
}
for(const target of ["frames/manifest.json","public/frames/manifest.json"]){const manifest=JSON.parse(fs.readFileSync(target,"utf8"));for(const theme of themes){manifest.themes=manifest.themes.filter(t=>(t.assetId||t.id)!==theme.assetId);manifest.themes.push(JSON.parse(fs.readFileSync(path.resolve("frames",theme.assetId,"dimensions.json"),"utf8")));}fs.writeFileSync(target,JSON.stringify(manifest,null,2));}
console.log("32 coral-themed strip PNGs are ready.");
