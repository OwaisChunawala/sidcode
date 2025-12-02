import { Palette, CanvasPreset } from "./types";

export const palettes: Palette[] = [
  {
    name: "Aurora",
    background: "#0d1117",
    anchor: ["#58a6ff", "#39d353", "#a371f7"],
    accent: ["#388bfd", "#2ea043", "#8b5cf6"],
    texture: ["#1f6feb33", "#23863533", "#6e40c933"],
  },
  {
    name: "Sunset",
    background: "#1a1a2e",
    anchor: ["#ff6b6b", "#feca57", "#ff9ff3"],
    accent: ["#ee5a5a", "#f8b739", "#f368e0"],
    texture: ["#ff6b6b33", "#feca5733", "#ff9ff333"],
  },
  {
    name: "Ocean",
    background: "#0c1821",
    anchor: ["#00b4d8", "#0077b6", "#90e0ef"],
    accent: ["#0096c7", "#005f73", "#48cae4"],
    texture: ["#00b4d833", "#0077b633", "#90e0ef33"],
  },
  {
    name: "Forest",
    background: "#1b2e1b",
    anchor: ["#95d5b2", "#40916c", "#74c69d"],
    accent: ["#52b788", "#2d6a4f", "#b7e4c7"],
    texture: ["#95d5b233", "#40916c33", "#74c69d33"],
  },
  {
    name: "Mono",
    background: "#111111",
    anchor: ["#ffffff", "#e0e0e0", "#c0c0c0"],
    accent: ["#a0a0a0", "#808080", "#d0d0d0"],
    texture: ["#ffffff22", "#e0e0e022", "#c0c0c022"],
  },
];

export const canvasPresets: CanvasPreset[] = [
  { name: "Square", width: 800, height: 800, ratio: "1:1" },
  { name: "Landscape", width: 1200, height: 675, ratio: "16:9" },
  { name: "Portrait", width: 675, height: 1200, ratio: "9:16" },
  { name: "Classic", width: 1000, height: 750, ratio: "4:3" },
  { name: "Wide", width: 1200, height: 500, ratio: "12:5" },
];

export function getPalette(name: string): Palette {
  return palettes.find((p) => p.name === name) || palettes[0];
}

// Interpolate colors between palette variations
export function varyColor(
  baseColor: string,
  variation: number,
  seed: number
): string {
  // Simple variation: adjust lightness based on variation and seed
  const hash = (seed * 9301 + 49297) % 233280;
  const rnd = hash / 233280;

  // Parse hex color
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);

  // Apply variation
  const variationAmount = (variation / 100) * 0.3; // Max 30% variation
  const adjust = (rnd - 0.5) * 2 * variationAmount;

  const newR = Math.min(255, Math.max(0, Math.round(r * (1 + adjust))));
  const newG = Math.min(255, Math.max(0, Math.round(g * (1 + adjust))));
  const newB = Math.min(255, Math.max(0, Math.round(b * (1 + adjust))));

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}
