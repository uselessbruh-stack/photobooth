import fs from "node:fs";
import path from "node:path";

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">${body}</svg>`;
const ink = "#5c566b";
const heartPath = "M128 224 C112 207 26 153 26 91 C26 48 78 28 112 67 C119 75 124 83 128 91 C135 73 152 48 180 46 C207 44 230 64 230 93 C230 151 152 207 128 224 Z";

export const coralHeartSprites = [
  { name: "coral-heart.png", svg: svg(`<path d="${heartPath}" fill="#f2a39c" stroke="#d36f69" stroke-width="10" stroke-linejoin="round"/><path d="M46 91 C48 65 69 53 88 61" fill="none" stroke="#ffd5cd" stroke-width="6" stroke-linecap="round"/>`) },
];

export const pencilSketchSprites = [
  { name: "graphite-star.png", svg: svg(`<path d="M127 20 L145 108 L232 128 L145 146 L127 235 L109 146 L22 128 L109 108 Z" fill="none" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/><path d="M132 27 L149 111 L224 129" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`) },
  { name: "graphite-hatch.png", svg: svg(`<g fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round"><path d="M48 190 Q91 145 134 104"/><path d="M83 218 Q128 171 174 125"/><path d="M126 226 Q168 183 208 140"/></g><path d="M55 188 Q100 143 138 107" fill="none" stroke="#89839a" stroke-width="3" stroke-linecap="round"/>`) },
  { name: "tiny-pencil.png", svg: svg(`<g transform="rotate(-42 128 128)"><rect x="102" y="38" width="52" height="155" rx="12" fill="#d8d3e4" stroke="${ink}" stroke-width="8"/><path d="M102 185 L128 228 L154 185 Z" fill="#efe4cf" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/><path d="M120 215 L128 236 L137 215 Z" fill="${ink}"/><path d="M102 63 H154" stroke="${ink}" stroke-width="5"/><path d="M112 46 H144" stroke="#aaa3b9" stroke-width="4" stroke-linecap="round"/></g>`) },
  { name: "graphite-dots.png", svg: svg(`<g fill="${ink}"><circle cx="91" cy="111" r="10"/><circle cx="158" cy="78" r="7"/><circle cx="173" cy="155" r="12"/><circle cx="105" cy="184" r="6"/></g>`) },
];

const confettiColors = ["#c79c59", "#d27d75", "#8d80aa"];
export const confettiSprites = confettiColors.flatMap((color, colorIndex) => [
  { name: `sparkle-${colorIndex}.png`, svg: svg(`<path d="M128 16 Q143 109 240 128 Q143 143 128 240 Q112 143 16 128 Q112 109 128 16 Z" fill="${color}"/><path d="M127 43 L133 122" stroke="#fff8f1" stroke-width="5" stroke-linecap="round" opacity=".8"/>`) },
  { name: `star-${colorIndex}.png`, svg: svg(`<path d="M128 19 L151 99 L234 75 L174 132 L228 192 L148 163 L124 239 L108 158 L27 183 L87 128 L31 67 L110 96 Z" fill="${color}" stroke="#fff8f1" stroke-width="5" stroke-linejoin="round"/>`) },
  { name: `dash-${colorIndex}.png`, svg: svg(`<g fill="none" stroke="${color}" stroke-width="15" stroke-linecap="round"><path d="M53 167 Q99 139 145 93"/><path d="M120 190 Q159 158 202 117"/></g>`) },
  { name: `dot-${colorIndex}.png`, svg: svg(`<g fill="${color}"><circle cx="90" cy="92" r="23"/><circle cx="165" cy="126" r="14"/><circle cx="113" cy="177" r="11"/></g>`) },
]);

export async function buildMotifPngs(sharp, directory, sprites) {
  fs.mkdirSync(directory, { recursive: true });
  const output = {};
  for (const sprite of sprites) {
    const file = path.join(directory, sprite.name);
    await sharp(Buffer.from(sprite.svg)).png({ compressionLevel: 9 }).toFile(file);
    output[sprite.name] = fs.readFileSync(file).toString("base64");
  }
  return output;
}

export function placeOnWindowEdges(boxes, count, size, random, bounds) {
  const placed = [];
  for (let index = 0; index < count; index++) {
    const box = boxes[index % boxes.length];
    let choice = null;
    for (let attempt = 0; attempt < 300 && !choice; attempt++) {
      const side = Math.floor(random() * 4);
      const along = .18 + random() * .64;
      const offset = size * (.32 + random() * .08);
      const x = side === 0 ? box.x + offset : side === 1 ? box.x + box.width - offset : box.x + box.width * along;
      const y = side === 2 ? box.y + offset : side === 3 ? box.y + box.height - offset : box.y + box.height * along;
      const safeRadius = size * .72;
      const safe = x - safeRadius >= 2 && x + safeRadius <= bounds.width - 2 && y - safeRadius >= 2 && y + safeRadius <= bounds.height - bounds.footer - 2;
      const clear = placed.every((other) => Math.hypot(other.x - x, other.y - y) >= size * 1.25);
      if (safe && clear) choice = { x, y, boxIndex: index % boxes.length };
    }
    if (!choice) {
      throw new Error(`Could not place decoration ${index + 1}/${count} without overlap for ${bounds.layout}.`);
    }
    placed.push(choice);
  }
  return placed;
}
