import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { formats, printGeometry } from "../app/lib/print-layout.ts";

const sharp = createRequire(import.meta.url)("sharp");
const theme = { name: "35mm film", assetId: "35mm-film", color: "#211e1d", ink: "#edc573", assetMode: "pattern", transparentPerforations: true };
const folder = path.resolve("frames", theme.assetId);
const runtime = path.resolve("public/frames", theme.assetId);
fs.mkdirSync(folder, { recursive: true });
fs.mkdirSync(runtime, { recursive: true });

const entry = { ...theme, variants: [] };
const previews = [];
for (let fi = 0; fi < formats.length; fi++) for (const hasNote of [false, true]) {
  const format = formats[fi];
  const geometry = printGeometry({ format, paper: theme, frame: "plain", branding: false, date: false, caption: hasNote ? "note" : "" });
  const safeInset = Math.ceil(geometry.unit * 0.145);
  const holeWidth = Math.max(32, Math.round(geometry.unit * 0.085));
  const holeHeight = Math.max(22, Math.round(geometry.unit * 0.055));
  const edgeInset = Math.max(12, Math.round(geometry.unit * 0.015));
  const pitch = Math.max(holeHeight * 2.2, Math.round(geometry.unit * 0.13));
  const clearGap = Math.max(10, Math.round(geometry.unit * 0.045));
  if (edgeInset + holeWidth + clearGap > safeInset) throw new Error(`${format.id}: sprocket rail is too narrow`);
  const cell = Math.floor(Math.min(
    (format.w - safeInset * 2 - geometry.gap * (format.cols - 1)) / format.cols,
    (format.h - geometry.pad * 2 - geometry.footer - geometry.gap * (format.rows - 1)) / format.rows,
  ));
  const gridWidth = cell * format.cols + geometry.gap * (format.cols - 1);
  const gridHeight = cell * format.rows + geometry.gap * (format.rows - 1);
  const gridX = Math.floor((format.w - gridWidth) / 2);
  const gridY = Math.floor((format.h - geometry.footer - gridHeight) / 2);
  const boxes = Array.from({ length: format.count }, (_, i) => ({
    x: gridX + (i % format.cols) * (cell + geometry.gap),
    y: gridY + Math.floor(i / format.cols) * (cell + geometry.gap),
    width: cell,
    height: cell,
  }));
  const holes = [];
  const endY = format.h - edgeInset - holeHeight;
  const holeCount = Math.max(2, Math.round((endY - edgeInset) / pitch) + 1);
  const actualPitch = (endY - edgeInset) / (holeCount - 1);
  for (let index = 0; index < holeCount; index++) {
    const y = Math.round(edgeInset + index * actualPitch);
    holes.push({ x: edgeInset, y, width: holeWidth, height: holeHeight });
    holes.push({ x: format.w - edgeInset - holeWidth, y, width: holeWidth, height: holeHeight });
  }
  const photoMask = boxes.map(box => `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/>`).join("");
  const sprocketMask = holes.map(hole => `<rect x="${hole.x}" y="${hole.y}" width="${hole.width}" height="${hole.height}" rx="${Math.round(hole.height * 0.2)}"/>`).join("");
  const line = Math.max(5, Math.round(geometry.unit * 0.004));
  const photoEdges = boxes.map(box => `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="#403936" stroke-width="${line}"/>`).join("");
  const noteBand = hasNote
    ? `<rect x="${safeInset}" y="${format.h - geometry.footer + line}" width="${format.w - 2 * safeInset}" height="${geometry.footer - line * 2}" rx="${Math.max(4, line * 2)}" fill="#211e1d" stroke="#6b5740" stroke-opacity=".75" stroke-width="${line}"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${format.w}" height="${format.h}" viewBox="0 0 ${format.w} ${format.h}"><defs><mask id="negative-holes" maskUnits="userSpaceOnUse" x="0" y="0" width="${format.w}" height="${format.h}"><rect width="${format.w}" height="${format.h}" fill="white"/><g fill="black">${photoMask}${sprocketMask}</g></mask></defs><g mask="url(#negative-holes)"><rect width="${format.w}" height="${format.h}" fill="${theme.color}"/><rect x="${line}" y="${line}" width="${format.w - line * 2}" height="${format.h - line * 2}" fill="none" stroke="#554a44" stroke-width="${line}"/>${photoEdges}${noteBand}</g></svg>`;
  const mode = hasNote ? "with-note" : "no-note";
  const filename = `${format.id}-${mode}.png`;
  const file = path.join(folder, filename);
  await sharp(Buffer.from(svg), { limitInputPixels: 50000000 }).png({ compressionLevel: 9 }).toFile(file);
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== format.w || info.height !== format.h) throw new Error(`${filename}: incorrect canvas size`);
  const checkTransparent = (x, y, description) => {
    const alpha = data[(Math.floor(y) * format.w + Math.floor(x)) * 4 + 3];
    if (alpha !== 0) throw new Error(`${filename}: ${description} is not transparent`);
  };
  for (const box of boxes) checkTransparent(box.x + box.width / 2, box.y + box.height / 2, "photo cutout");
  for (const hole of holes) checkTransparent(hole.x + hole.width / 2, hole.y + hole.height / 2, "sprocket hole");
  if (data[3] !== 255) throw new Error(`${filename}: film surface should be opaque`);
  fs.copyFileSync(file, path.join(runtime, filename));
  entry.variants.push({
    layout: format.id, mode, file: `${theme.assetId}/${filename}`, src: `/frames/${theme.assetId}/${filename}`,
    width: format.w, height: format.h, cutouts: boxes, perforations: holes,
    noteArea: hasNote ? { x: safeInset, y: format.h - geometry.footer + line, width: format.w - 2 * safeInset, height: geometry.footer - 2 * line } : null,
  });

  const index = fi * 2 + Number(hasNote);
  const cellWidth = 300, cellHeight = 400;
  const left = index % 4 * cellWidth, top = Math.floor(index / 4) * cellHeight;
  const scale = Math.min(245 / format.w, 270 / format.h);
  const width = Math.round(format.w * scale), height = Math.round(format.h * scale);
  const input = await sharp(file).resize(width, height).png().toBuffer();
  previews.push({ input, left: left + Math.floor((cellWidth - width) / 2), top: top + 64 + Math.floor((270 - height) / 2) });
  console.log(`${filename}: ${format.count} photo openings and ${holes.length} transparent sprocket holes verified`);
}

fs.writeFileSync(path.join(folder, "dimensions.json"), JSON.stringify(entry, null, 2));
fs.writeFileSync(path.join(folder, "README.md"), `# 35mm film\n\nA deep charcoal film-negative frame with repeated sprocket perforations down both edges. Every photo window and every edge perforation is transparent. Eight layouts are available with and without an optional note area.\n\nExact photo and perforation coordinates are recorded in dimensions.json. Regenerate with node --experimental-strip-types scripts/generate-35mm-film.mjs.\n`);

const cells = formats.flatMap((format, i) => [false, true].map((note, j) => {
  const x = (i * 2 + j) % 4 * 300, y = Math.floor((i * 2 + j) / 4) * 400;
  return `<rect x="${x + 5}" y="${y + 5}" width="290" height="390" fill="#fbfbfd" stroke="#cdd3df"/><rect x="${x + 15}" y="${y + 58}" width="270" height="290" fill="url(#check)"/><g font-family="Arial" fill="#65515b" text-anchor="middle"><text x="${x + 150}" y="${y + 29}" font-size="16">${format.name}</text><text x="${x + 150}" y="${y + 48}" font-size="13">${note ? "With note" : "Without note"}</text><text x="${x + 150}" y="${y + 376}" font-size="14">${format.w} × ${format.h} px</text></g>`;
})).join("");
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><defs><pattern id="check" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#fafafd"/><path d="M0 0h10v10H0zM10 10h10v10h-10z" fill="#e1e3eb"/></pattern></defs><rect width="100%" height="100%" fill="#f2f3f8"/>${cells}</svg>`;
await sharp(Buffer.from(sheet)).composite(previews).png().toFile(path.join(folder, "all-layouts-preview.png"));

for (const target of ["frames/manifest.json", "public/frames/manifest.json"]) {
  const manifest = JSON.parse(fs.readFileSync(target, "utf8"));
  manifest.themes = manifest.themes.filter(item => item.assetId !== theme.assetId);
  manifest.themes.push(entry);
  fs.writeFileSync(target, JSON.stringify(manifest, null, 2));
}
for (const target of ["frames/README.md", "public/frames/README.md"]) {
  const text = fs.readFileSync(target, "utf8");
  const line = "- 35mm-film/ — charcoal negative with transparent sprocket holes and photo windows\n";
  const updated = text.includes("35mm-film/") ? text : text.replace("# Frame themes\n\n", "# Frame themes\n\n" + line);
  fs.writeFileSync(target, updated.replace("The app offers Black, White,", "The app offers 35mm film, Black, White,"));
}
console.log("16 35mm film frame PNGs generated and verified.");
