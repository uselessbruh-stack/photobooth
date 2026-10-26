import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { formats, printGeometry } from "../app/lib/print-layout.ts";

const sharp = createRequire(import.meta.url)("sharp");
const theme = { name: "Dihbooth film", assetId: "dihbooth-film", color: "#000000", ink: "#ffffff", assetMode: "pattern" };
const brand = "Dihbooth";
const folder = path.resolve("frames", theme.assetId);
const runtime = path.resolve("public/frames", theme.assetId);
fs.mkdirSync(folder, { recursive: true });
fs.mkdirSync(runtime, { recursive: true });
const artFolder = path.join(folder, "assets");
const runtimeArtFolder = path.join(runtime, "assets");
fs.mkdirSync(artFolder, { recursive: true });
fs.mkdirSync(runtimeArtFolder, { recursive: true });

// Build the small pieces of film artwork as standalone transparent PNGs so
// each frame variant uses the same crisp, reusable art at its native size.
const meterTickCount = 22;
const meterLines = Array.from({ length: meterTickCount }, (_, i) => {
  const y = 24 + i * (952 / (meterTickCount - 1));
  const lengths = [72, 112, 66, 142, 92, 58, 128, 78, 106, 62];
  const width = [5, 6, 4, 6, 5][i % 5];
  return `<path d="M${256 - lengths[i % lengths.length]} ${y}H256" stroke="#ffffff" stroke-width="${width}" stroke-linecap="butt"/>`;
}).join("");
const meterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="1000" viewBox="0 0 256 1000">${meterLines}</svg>`;
const playPauseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><path d="M22 33H106M32 48H96" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="square"/><path d="M64 63 39 105H89Z" fill="#e8c778"/></svg>`;
const playUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><path d="M64 23 29 87H99Z" fill="#e8c778"/></svg>`;
const dividerPauseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="512" viewBox="0 0 128 512"><path d="M64 20 35 76H93Z" fill="#e8c778"/><path d="M42 112V492M86 112V492" stroke="#fff" stroke-width="12" stroke-linecap="round"/></svg>`;
const artwork = [
  ["left-meter-lines.png", meterSvg],
  ["play-pause.png", playPauseSvg],
  ["play-up.png", playUpSvg],
  ["divider-pause.png", dividerPauseSvg],
];
const artworkBuffers = new Map();
for (const [name, svg] of artwork) {
  const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  artworkBuffers.set(name, buffer);
  await sharp(buffer).toFile(path.join(artFolder, name));
  fs.copyFileSync(path.join(artFolder, name), path.join(runtimeArtFolder, name));
}

const entry = { ...theme, variants: [] };
const previews = [];
for (let fi = 0; fi < formats.length; fi++) for (const hasNote of [false, true]) {
  const format = formats[fi];
  const base = printGeometry({ format, paper: theme, frame: "plain", branding: false, date: false, caption: hasNote ? "note" : "" });
  const labelFont = Math.max(24, Math.round(base.unit * 0.035));
  const labelGap = Math.max(Math.round(base.unit * 0.105), Math.round(labelFont * 2.4));
  const safeInset = Math.round(base.unit * 0.12);
  const singleLabelGap = format.rows === 1 ? labelGap : 0;
  const usableWidth = format.w - safeInset * 2 - base.gap * (format.cols - 1);
  const usableHeight = format.h - base.pad * 2 - base.footer - labelGap * (format.rows - 1) - singleLabelGap;
  const cell = Math.floor(Math.min(usableWidth / format.cols, usableHeight / format.rows));
  const gridWidth = cell * format.cols + base.gap * (format.cols - 1);
  const gridHeight = cell * format.rows + labelGap * (format.rows - 1);
  const x = Math.floor((format.w - gridWidth) / 2);
  const y = Math.floor((format.h - base.footer - singleLabelGap - gridHeight) / 2);
  const boxes = Array.from({ length: format.count }, (_, i) => ({
    x: x + (i % format.cols) * (cell + base.gap),
    y: y + Math.floor(i / format.cols) * (cell + labelGap),
    width: cell,
    height: cell,
  }));

  const photoMask = boxes.map(box => `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/>`).join("");
  const line = Math.max(5, Math.round(base.unit * 0.004));
  const rowLabels = [];
  for (let row = 0; row < format.rows - 1; row++) {
    const labelY = y + row * (cell + labelGap) + cell + labelGap / 2 + labelFont * 0.34;
    rowLabels.push(`<text x="${format.w / 2}" y="${labelY}" fill="${theme.ink}" font-family="Arial, sans-serif" font-size="${labelFont}" font-weight="600" letter-spacing="${Math.max(1, base.unit * 0.008)}" text-anchor="middle">${brand}</text>`);
    rowLabels.push(`<path d="M${format.w * 0.34} ${labelY - labelFont * 0.35}h${base.unit * 0.055}m${base.unit * 0.22} 0h${base.unit * 0.055}" stroke="#b9aba2" stroke-width="${line}" stroke-linecap="round"/>`);
  }
  if (singleLabelGap) {
    const labelY = y + cell + singleLabelGap / 2 + labelFont * 0.34;
    rowLabels.push(`<text x="${format.w / 2}" y="${labelY}" fill="${theme.ink}" font-family="Arial, sans-serif" font-size="${labelFont}" font-weight="600" letter-spacing="${Math.max(1, base.unit * 0.008)}" text-anchor="middle">${brand}</text>`);
  }
  const overlays = [];
  const addArtwork = async (name, left, top, width, height) => {
    const input = await sharp(artworkBuffers.get(name)).resize(width, height, { fit: "fill" }).png().toBuffer();
    overlays.push({ input, left, top });
  };
  const rightControlSize = Math.max(28, Math.round(Math.min(base.unit * 0.06, cell * 0.14)));
  const controlCenter = format.w - safeInset / 2;
  const leftArtWidth = Math.round(base.unit * 0.105);
  for (let row = 0; row < format.rows; row++) {
    const box = boxes[row * format.cols];
    const cy = box.y + box.height / 2;
    const leftEdge = box.x;
    const fitLeftArtWidth = Math.min(leftArtWidth, Math.max(1, leftEdge - line * 2 - 2));
    // Keep a clean two-pixel boundary so antialiasing can never cover the photo.
    await addArtwork("left-meter-lines.png", Math.round(leftEdge - fitLeftArtWidth - 2), box.y, fitLeftArtWidth, box.height);
    const playUpSize = Math.max(20, Math.round(Math.min(base.unit * 0.034, cell * 0.08)));
    await addArtwork("play-up.png", Math.round(controlCenter - playUpSize / 2), Math.round(box.y + cell * 0.06), playUpSize, playUpSize);
    await addArtwork("play-pause.png", Math.round(controlCenter - rightControlSize / 2), Math.round(cy - rightControlSize / 2), rightControlSize, rightControlSize);
    if (row < format.rows - 1 && labelGap > 0) {
      const dividerY = y + row * (cell + labelGap) + cell + labelGap / 2;
      const dividerHeight = Math.min(Math.round(base.unit * 0.07), Math.max(28, labelGap - line * 2));
      const dividerWidth = Math.round(dividerHeight * (128 / 512));
      await addArtwork("divider-pause.png", Math.round(controlCenter - dividerWidth / 2), Math.round(dividerY - dividerHeight / 2), dividerWidth, dividerHeight);
    }
  }
  const noteBand = hasNote
    ? `<rect x="${safeInset}" y="${format.h - base.footer + line}" width="${format.w - 2 * safeInset}" height="${base.footer - line * 2}" rx="${Math.max(4, line * 2)}" fill="${theme.color}" stroke="#61564f" stroke-width="${line}"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${format.w}" height="${format.h}" viewBox="0 0 ${format.w} ${format.h}"><defs><mask id="photo-windows" maskUnits="userSpaceOnUse" x="0" y="0" width="${format.w}" height="${format.h}"><rect width="${format.w}" height="${format.h}" fill="white"/><g fill="black">${photoMask}</g></mask></defs><g mask="url(#photo-windows)"><rect width="${format.w}" height="${format.h}" fill="${theme.color}"/><rect x="${line}" y="${line}" width="${format.w - line * 2}" height="${format.h - line * 2}" fill="none" stroke="#514845" stroke-width="${line}"/>${noteBand}</g>${rowLabels.join("")}</svg>`;

  const mode = hasNote ? "with-note" : "no-note";
  const filename = `${format.id}-${mode}.png`;
  const file = path.join(folder, filename);
  await sharp(Buffer.from(svg), { limitInputPixels: 50000000 }).composite(overlays).png({ compressionLevel: 9 }).toFile(file);
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== format.w || info.height !== format.h) throw new Error(`${filename}: incorrect canvas size`);
  const checkTransparent = (checkX, checkY, description) => {
    const alpha = data[(Math.floor(checkY) * format.w + Math.floor(checkX)) * 4 + 3];
    if (alpha !== 0) throw new Error(`${filename}: ${description} is not transparent`);
  };
  for (const box of boxes) {
    checkTransparent(box.x + box.width / 2, box.y + box.height / 2, "photo cutout");
    for (let py = box.y; py < box.y + box.height; py++) {
      for (let px = box.x; px < Math.min(box.x + 3, box.x + box.width); px++) {
        const alpha = data[(py * format.w + px) * 4 + 3];
        if (alpha !== 0) throw new Error(`${filename}: meter artwork overlaps photo cutout at ${px},${py}`);
      }
    }
  }
  if (data[3] !== 255) throw new Error(`${filename}: film surface should be opaque`);
  fs.copyFileSync(file, path.join(runtime, filename));
  entry.variants.push({
    layout: format.id, mode, file: `${theme.assetId}/${filename}`, src: `/frames/${theme.assetId}/${filename}`,
    width: format.w, height: format.h, cutouts: boxes, perforations: [],
    brandText: brand,
    labels: rowLabels.map((_, i) => i).filter(i => i % 2 === 0).map(row => ({ text: brand, dividerIndex: row / 2 })),
    leftLineMarks: format.rows * meterTickCount,
    leftLinesMeetPhotoEdge: true,
    artwork: ["assets/left-meter-lines.png", "assets/play-pause.png", "assets/play-up.png", "assets/divider-pause.png"],
    rightControl: "unboxed white bars with a gold up-triangle beside each photo; elongated upward pause mark in each divider",
    noteArea: hasNote ? { x: safeInset, y: format.h - base.footer + line, width: format.w - 2 * safeInset, height: base.footer - 2 * line } : null,
  });

  const index = fi * 2 + Number(hasNote), sheetCellWidth = 300, sheetCellHeight = 400;
  const left = index % 4 * sheetCellWidth, top = Math.floor(index / 4) * sheetCellHeight;
  const scale = Math.min(245 / format.w, 270 / format.h);
  const width = Math.round(format.w * scale), height = Math.round(format.h * scale);
  const input = await sharp(file).resize(width, height).png().toBuffer();
  previews.push({ input, left: left + Math.floor((sheetCellWidth - width) / 2), top: top + 64 + Math.floor((270 - height) / 2) });
  console.log(`${filename}: ${format.count} transparent photo windows with reusable PNG meter lines and play/pause artwork generated`);
}

fs.writeFileSync(path.join(folder, "dimensions.json"), JSON.stringify(entry, null, 2));
fs.writeFileSync(path.join(folder, "README.md"), `# Dihbooth film\n\nA pure-black retro frame with ${brand} printed between square photo windows. Separate transparent PNG artwork provides aligned white meter lines, the reference-style paired white bars and gold upward triangle, and an elongated upward pause mark in each divider. Meter lines stop before the transparent photo area. No sprocket holes are used; photo windows alone are transparent. Eight layouts are available, with optional note space.\n\nReusable artwork is in assets/. Exact photo and label coordinates are in dimensions.json. Regenerate with node --experimental-strip-types scripts/generate-dihbooth-film.mjs.\n`);

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
  const readme = fs.readFileSync(target, "utf8");
  const line = "- dihbooth-film/ — pure-black frame with aligned meter lines and reference-style white/gold play artwork; no sprocket holes\n";
  const updated = readme.includes("dihbooth-film/") ? readme : readme.replace("# Frame themes\n\n", `# Frame themes\n\n${line}`);
  fs.writeFileSync(target, updated.replace("The app offers 35mm film, Black,", "The app offers Dihbooth film, 35mm film, Black,"));
}
console.log("16 Dihbooth film frames generated and verified.");
