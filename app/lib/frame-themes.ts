export type FrameTheme = { name: string; assetId: string; color: string; ink: string; cutout?: "heart"; assetMode?: "pattern"; transparentPerforations?: boolean };
export const frameThemes: FrameTheme[] = [
  { name: "Black", assetId: "black", color: "#000000", ink: "#ffffff" },
  { name: "35mm film", assetId: "35mm-film", color: "#211e1d", ink: "#edc573", assetMode: "pattern", transparentPerforations: true },
  { name: "Dihbooth film", assetId: "dihbooth-film", color: "#000000", ink: "#ffffff", assetMode: "pattern" },
  { name: "White", assetId: "white", color: "#ffffff", ink: "#000000" },
  { name: "Lavender", assetId: "lavender", color: "#e5ddf5", ink: "#514668" },
  { name: "Baby pink hearts", assetId: "baby-pink-hearts", color: "#f7c9d2", ink: "#9d344f", cutout: "heart" },
  { name: "Graphite confetti", assetId: "graphite-confetti", color: "#f2ecdc", ink: "#756852", assetMode: "pattern" },
  { name: "Coral heart scatter", assetId: "coral-heart-scatter", color: "#eee1df", ink: "#936a68", assetMode: "pattern" },
  { name: "Pencil sketch", assetId: "pencil-heart-accent", color: "#e8e5f0", ink: "#5c566b", assetMode: "pattern" },
];
