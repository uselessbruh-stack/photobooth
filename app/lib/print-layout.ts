// One high-resolution export per distinct arrangement; physical print size is not a layout.
export const formats = [
  { id: "strip-three", name: "3-photo strip", size: "1:3", w: 1200, h: 3600, cols: 1, rows: 3 },
  { id: "strip-two", name: "2-photo strip", size: "1:2", w: 1200, h: 2400, cols: 1, rows: 2 },
  { id: "strip-four", name: "4-photo strip", size: "1:4", w: 1200, h: 4800, cols: 1, rows: 4 },
  { id: "square-single", name: "Single square", size: "1:1", w: 1800, h: 1800, cols: 1, rows: 1 },
  { id: "square-four", name: "4-photo square", size: "1:1", w: 2400, h: 2400, cols: 2, rows: 2 },
  { id: "square-nine", name: "9-photo square", size: "1:1", w: 3000, h: 3000, cols: 3, rows: 3 },
  { id: "portrait-six", name: "6-photo portrait", size: "2:3", w: 1800, h: 2700, cols: 2, rows: 3 },
  { id: "landscape-six", name: "6-photo landscape", size: "3:2", w: 2700, h: 1800, cols: 3, rows: 2 },
].map(f => ({ ...f, count: f.cols * f.rows }));

export const frames = [
  { id: "plain", name: "Clean", icon: "□", description: "A simple paper border" },
  { id: "double", name: "Pencil", icon: "▣", description: "A double pencil outline" },
  { id: "check", name: "Checker", icon: "▦", description: "Little checks around the edges" },
  { id: "film", name: "Film", icon: "▤", description: "Classic film perforations" },
  { id: "dots", name: "Dot grid", icon: "⠿", description: "A quiet dotted border" },
  { id: "corners", name: "Corners", icon: "⌗", description: "Album-style photo corners" },
] as const;

export type PrintOptions = {
  format: (typeof formats)[number];
  paper: { color: string; ink: string; assetId?: string; transparentPerforations?: boolean };
  frame: string;
  branding: boolean;
  date: boolean;
  caption: string;
};

export const MAX_NOTE_LENGTH = 30;
export function noteMetrics(format: (typeof formats)[number]) {
  const fontSize = Math.max(36, Math.round(Math.min(format.w, format.h) * .055));
  return { fontSize, height: Math.round(fontSize * 2.3) };
}
export function normalizeNote(note: string) {
  return Array.from(note.replace(/[\r\n]+/g, " ")).slice(0, MAX_NOTE_LENGTH).join("").trim();
}

const frameImages = new Map<string, Promise<HTMLImageElement>>();
function loadFrame(src: string) {
  let pending = frameImages.get(src);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { frameImages.delete(src); reject(new Error(`Frame artwork could not load: ${src}`)); };
      image.src = src;
    });
    frameImages.set(src, pending);
  }
  return pending;
}

// Preview and export share these exact square cells. Future image-frame assets
// can use these same bounds without changing photo geometry.
export function printGeometry(options: PrintOptions) {
  const { format: s, branding, date, caption } = options;
  const unit = Math.min(s.w, s.h);
  const pad = Math.round(unit * .075);
  const gap = Math.round(unit * .04);
  const lineCount = Number(branding) + Number(date) + Number(!!normalizeNote(caption));
  const note = noteMetrics(s);
  const textLine = note.height;
  const footer = textLine * lineCount;
  const cell = Math.floor(Math.min((s.w - pad * 2 - gap * (s.cols - 1)) / s.cols, (s.h - pad * 2 - footer - gap * (s.rows - 1)) / s.rows));
  const gridW = cell * s.cols + gap * (s.cols - 1);
  const gridH = cell * s.rows + gap * (s.rows - 1);
  const x = Math.floor((s.w - gridW) / 2);
  const y = Math.floor((s.h - footer - gridH) / 2);
  return { pad, gap, cell, x, y, footer, textLine, unit, gridH, fontSize: note.fontSize };
}

export function samplePhoto(index: number, filter = "none") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 700;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = filter;
  ctx.fillStyle = ["#dce2ec", "#dcdceb", "#d5e0d9", "#e8e1cd", "#d5e3e6", "#dddde3"][index % 6];
  ctx.fillRect(0, 0, 700, 700);
  ctx.fillStyle = "#f8f9f5";
  ctx.beginPath(); ctx.arc(350, 260, 120, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(350, 690, 260, 230, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#71748a";
  ctx.font = "100px Georgia"; ctx.textAlign = "center";
  ctx.fillText(["◡", "◉", "✦", "⌁", "☺", "◒"][index % 6], 350, 290);
  ctx.font = "16px Arial";
  ctx.fillText("PRACTICE PHOTO", 350, 635);
  return canvas.toDataURL("image/jpeg", .9);
}

function decorate(ctx: CanvasRenderingContext2D, o: PrintOptions, g: ReturnType<typeof printGeometry>) {
  const { w, h } = o.format;
  const step = Math.max(12, Math.round(g.unit * .025));
  ctx.strokeStyle = o.paper.ink;
  ctx.fillStyle = o.paper.ink;
  ctx.globalAlpha = .45;
  ctx.lineWidth = Math.max(2, g.unit * .002);
  if (o.frame === "double") {
    const inset = g.unit * .018;
    ctx.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset);
    ctx.strokeRect(inset * 1.7, inset * 1.7, w - 3.4 * inset, h - 3.4 * inset);
  }
  if (o.frame === "check") {
    for (let x = 0; x < w; x += step) {
      for (let row = 0; row < 2; row++) if ((Math.round(x / step) + row) % 2 === 0) {
        ctx.fillRect(x, row * step, step, step);
        ctx.fillRect(x, h - (row + 1) * step, step, step);
      }
    }
    for (let y = step * 2; y < h - step * 2; y += step) {
      for (let col = 0; col < 2; col++) if ((Math.round(y / step) + col) % 2 === 0) {
        ctx.fillRect(col * step, y, step, step);
        ctx.fillRect(w - (col + 1) * step, y, step, step);
      }
    }
  }
  if (o.frame === "film") {
    for (let y = step; y < h - step; y += step * 2.5) {
      ctx.fillRect(step * .45, y, step * .9, step * 1.4);
      ctx.fillRect(w - step * 1.35, y, step * .9, step * 1.4);
    }
  }
  if (o.frame === "dots") {
    for (let x = step; x < w; x += step) for (const y of [step, h - step]) {
      ctx.beginPath(); ctx.arc(x, y, step * .11, 0, Math.PI * 2); ctx.fill();
    }
    for (let y = step * 2; y < h - step; y += step) for (const x of [step, w - step]) {
      ctx.beginPath(); ctx.arc(x, y, step * .11, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function decorateTheme(ctx: CanvasRenderingContext2D, options: PrintOptions, geometry: ReturnType<typeof printGeometry>) {
  if (options.paper.assetId !== "baby-pink-hearts") return;
  const { format } = options;
  const size = Math.max(24, geometry.unit * .034);
  const sideX = Math.max(size * .72, geometry.x * .48);
  const drawHeart = (x: number, y: number, scale: number, rotation: number, color = "#b84760") => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale / 2, scale / 2);
    ctx.beginPath();
    ctx.moveTo(0, .78);
    ctx.bezierCurveTo(-.16, .61, -1, .04, -1, -.43);
    ctx.bezierCurveTo(-1, -1.02, -.22, -1.06, 0, -.48);
    ctx.bezierCurveTo(.22, -1.06, 1, -1.02, 1, -.43);
    ctx.bezierCurveTo(1, .04, .16, .61, 0, .78);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#8f304b";
    ctx.lineWidth = Math.max(1.5, geometry.unit * .0015);
    ctx.stroke();
    ctx.restore();
  };
  const drawBow = (x: number, y: number, scale: number, rotation: number) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(scale / 40, scale / 40);
    ctx.strokeStyle = "#a83e58"; ctx.fillStyle = "#f19a9b"; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(-24, -23, -19, -4); ctx.quadraticCurveTo(-16, 8, -2, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.quadraticCurveTo(24, -23, 19, -4); ctx.quadraticCurveTo(16, 8, 2, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, 3); ctx.quadraticCurveTo(-7, 20, -13, 22); ctx.moveTo(2, 3); ctx.quadraticCurveTo(8, 17, 14, 20); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 4, 5, 0, 0, Math.PI * 2); ctx.fillStyle = "#f7c9d2"; ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  const drawSparkle = (x: number, y: number, scale: number, color: string) => {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.fillStyle = "#f8a2a0"; ctx.lineWidth = Math.max(1.5, geometry.unit * .0014); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -scale); ctx.quadraticCurveTo(scale * .13, -scale * .12, scale, 0); ctx.quadraticCurveTo(scale * .12, scale * .12, 0, scale); ctx.quadraticCurveTo(-scale * .12, scale * .12, -scale, 0); ctx.quadraticCurveTo(-scale * .12, -scale * .12, 0, -scale); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-scale * 1.35, scale * .8, scale * .11, 0, Math.PI * 2); ctx.arc(scale * 1.25, -scale * .95, scale * .09, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  const drawStamp = (x: number, y: number, scale: number) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.12); ctx.strokeStyle = "#9f3d55"; ctx.fillStyle = "#f7d6d8"; ctx.lineWidth = Math.max(1.5, geometry.unit * .0015);
    const edge = scale * .78; ctx.fillRect(-edge / 2, -edge / 2, edge, edge); ctx.strokeRect(-edge / 2, -edge / 2, edge, edge);
    ctx.setLineDash([scale * .08, scale * .07]); ctx.strokeRect(-edge * .38, -edge * .38, edge * .76, edge * .76); ctx.setLineDash([]);
    ctx.restore(); drawHeart(x, y + scale * .02, scale * .28, 0, "#bb4b61");
  };
  const drawFlower = (x: number, y: number, scale: number) => {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#ed8e92"; ctx.strokeStyle = "#9f3d55"; ctx.lineWidth = Math.max(1.3, geometry.unit * .0012);
    for (let petal = 0; petal < 5; petal++) { ctx.save(); ctx.rotate(petal * Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -scale * .42, scale * .22, scale * .34, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, scale * .17, 0, Math.PI * 2); ctx.fillStyle = "#f8d58a"; ctx.fill(); ctx.stroke(); ctx.restore();
  };
  for (let row = 0; row < format.rows; row++) {
    const top = geometry.y + row * (geometry.cell + geometry.gap);
    drawFlower(sideX, top + geometry.cell * .16, size * .76);
    drawHeart(sideX, top + geometry.cell * .49, size, -.12);
    drawBow(sideX, top + geometry.cell * .81, size * 1.12, -.08);
    drawHeart(format.w - sideX, top + geometry.cell * .18, size * .75, .1, "#cc6577");
    drawBow(format.w - sideX, top + geometry.cell * .52, size * 1.05, .08);
    drawStamp(format.w - sideX, top + geometry.cell * .84, size * .85);
    drawSparkle(sideX * 1.75, top + geometry.cell * .34, size * .25, "#ae4c63");
    drawSparkle(format.w - sideX * 1.8, top + geometry.cell * .7, size * .22, "#ad4d61");
    for (let column = 0; column < format.cols - 1; column++) {
      const gutterX = geometry.x + column * (geometry.cell + geometry.gap) + geometry.cell + geometry.gap * .5;
      const miniSize = Math.min(size * .48, geometry.gap * .52);
      drawHeart(gutterX, top + geometry.cell * .5, miniSize, column % 2 ? .1 : -.1, column % 2 ? "#cc6577" : "#b84760");
      drawSparkle(gutterX, top + geometry.cell * .24, miniSize * .36, "#ad4d61");
      drawSparkle(gutterX, top + geometry.cell * .76, miniSize * .33, "#ae4c63");
    }
    if (row < format.rows - 1) {
      const gutterY = top + geometry.cell + geometry.gap * .5;
      const miniSize = Math.min(size * .42, geometry.gap * .4);
      for (let column = 0; column < format.cols; column++) {
        const centerX = geometry.x + column * (geometry.cell + geometry.gap) + geometry.cell * .5;
        drawSparkle(centerX, gutterY, miniSize * .34, "#ad4d61");
      }
    }
  }
}

export async function renderPrint(items: string[], options: PrintOptions, previewMaxEdge?: number) {
  await document.fonts.load("18px SketchHand");
  const c = document.createElement("canvas"), s = options.format;
  const scale = previewMaxEdge ? Math.min(1, previewMaxEdge / Math.max(s.w, s.h)) : 1;
  c.width = Math.round(s.w * scale); c.height = Math.round(s.h * scale);
  const ctx = c.getContext("2d")!, g = printGeometry(options);
  ctx.scale(scale, scale);
  if (!options.paper.transparentPerforations) {
    ctx.fillStyle = options.paper.color; ctx.fillRect(0, 0, s.w, s.h);
  }
  for (let i = 0; i < s.count; i++) {
    const img = new Image(); img.src = items[i]; await img.decode();
    const edge = Math.min(img.width, img.height);
    const x = g.x + (i % s.cols) * (g.cell + g.gap), y = g.y + Math.floor(i / s.cols) * (g.cell + g.gap);
    ctx.drawImage(img, (img.width - edge) / 2, (img.height - edge) / 2, edge, edge, x, y, g.cell, g.cell);
    if (options.frame === "corners") {
      ctx.fillStyle = options.paper.ink;
      const t = g.cell * .08;
      for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + g.cell, y, -1, 1], [x, y + g.cell, 1, -1], [x + g.cell, y + g.cell, -1, -1]]) {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * t, cy); ctx.lineTo(cx, cy + dy * t); ctx.closePath(); ctx.fill();
      }
    }
  }
  if (options.paper.assetId && !options.branding && !options.date) {
    const mode = normalizeNote(options.caption) ? "with-note" : "no-note";
    const artwork = await loadFrame(`/frames/${options.paper.assetId}/${s.id}-${mode}.png`);
    if (artwork.naturalWidth !== s.w || artwork.naturalHeight !== s.h) throw new Error("Frame artwork dimensions do not match this layout.");
    ctx.drawImage(artwork, 0, 0, s.w, s.h);
  } else {
    decorate(ctx, options, g);
  }
  decorateTheme(ctx, options, g);
  const lines: string[] = [];
  if (options.branding) lines.push("little moments");
  if (normalizeNote(options.caption)) lines.push(normalizeNote(options.caption));
  if (options.date) lines.push(new Date().toLocaleDateString("en-GB"));
  ctx.fillStyle = options.paper.ink; ctx.textAlign = "center";
  ctx.font = `${g.fontSize}px SketchHand, cursive`;
  let y = s.h - g.footer + g.textLine / 2 + g.fontSize * .35;
  for (const line of lines) { ctx.fillText(line, s.w / 2, y, s.w - g.pad * 2); y += g.textLine; }
  return c.toDataURL("image/png");
}
