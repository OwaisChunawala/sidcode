import { Controls, Palette, RoleShape, Shape, PathShapeType } from "./types";
import { createCircle, createRectangle, createLine, createSemicircle, createTriangle } from "./shapes";
import { createRandomUtils, RandomUtils } from "./random";
import { varyColor } from "./palettes";
import { getTextPathPoints } from "./fontPaths";

interface GeneratorConfig {
  width: number;
  height: number;
  controls: Controls;
  palette: Palette;
  seed: number;
  text?: string;
}

export function generateComposition(config: GeneratorConfig): RoleShape[] {
  const { width, height, controls, palette, seed, text } = config;

  // If text is provided, use text-based composition
  if (text && text.trim().length > 0) {
    return generateTextComposition(config);
  }

  const rng = createRandomUtils(seed);
  const shapes: RoleShape[] = [];

  // Generate shapes by role in order (anchors first, then accents, then texture)
  const anchors = generateAnchors(width, height, controls, palette, rng, seed);
  const accents = generateAccents(width, height, controls, palette, rng, anchors, seed);
  const texture = generateTexture(width, height, controls, palette, rng);

  shapes.push(...anchors, ...accents, ...texture);

  return shapes;
}

// Create a shape at a given position based on the selected shape type
function createShapeAtPoint(
  x: number,
  y: number,
  size: number,
  shapeType: PathShapeType,
  color: string,
  rotation: number,
  nextPoint?: { x: number; y: number },
  flowAngle?: number // Optional flow angle for orienting shapes in drift mode
): Shape {
  // Convert flow angle to radians if provided
  const flowRad = flowAngle !== undefined ? (flowAngle * Math.PI) / 180 : undefined;

  switch (shapeType) {
    case "circle":
      return createCircle(x, y, size, {
        fill: color,
        rotation,
      });
    case "semicircle":
      // Orient semicircle toward flow direction if available
      const semiRotation = flowRad !== undefined ? flowAngle! : rotation;
      return createSemicircle(x, y, size, {
        fill: color,
        rotation: semiRotation,
      });
    case "triangle":
      // Orient triangle toward flow direction if available
      const triRotation = flowRad !== undefined ? flowAngle! : rotation;
      return createTriangle(x, y, size * 2, {
        fill: color,
        rotation: triRotation,
      });
    case "rectangle":
      return createRectangle(x, y, size * 1.8, size * 1.8, {
        fill: color,
        rotation,
      });
    case "line":
      // Lines point toward flow direction, next point on path, or use rotation
      const angle = flowRad !== undefined
        ? flowRad
        : nextPoint
          ? Math.atan2(nextPoint.y - y, nextPoint.x - x)
          : rotation * (Math.PI / 180);
      const length = size * 2.5;
      return createLine(x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length, {
        stroke: color,
        strokeWidth: Math.max(2, size * 0.3),
      });
    default:
      return createCircle(x, y, size, {
        fill: color,
        rotation,
      });
  }
}

// Generate shapes distributed along text letter paths - SIMPLIFIED
function generateTextComposition(config: GeneratorConfig): RoleShape[] {
  const { width, height, controls, palette, seed, text } = config;
  const rng = createRandomUtils(seed);
  const shapes: RoleShape[] = [];

  if (!text) return shapes;

  // Get points along the text path
  const { points } = getTextPathPoints(text, width, height, controls.density);

  if (points.length === 0) return shapes;

  // Uniform size based on Scale slider (extended range for smaller shapes)
  const baseSize = Math.min(width, height) * 0.025;
  const size = baseSize * (0.1 + (controls.scale / 100) * 2.0);
  // At scale=0: size = baseSize * 0.1 (10% - very small)
  // At scale=50: size = baseSize * 1.1
  // At scale=100: size = baseSize * 2.1

  // Chaos affects offset from path
  const chaosOffset = (controls.chaos / 100) * size * 2;

  // Get the selected shape type
  const shapeType = controls.pathShape;

  // Create one shape at each point along the path
  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // Apply chaos offset
    const offsetX = rng.gaussian() * chaosOffset;
    const offsetY = rng.gaussian() * chaosOffset;
    const x = point.x + offsetX;
    const y = point.y + offsetY;

    // Slight rotation variation based on chaos
    const rotation = rng.range(-30, 30) * (controls.chaos / 100);

    // Cycle through palette colors
    const colorIndex = i % palette.anchor.length;
    const color = varyColor(
      palette.anchor[colorIndex],
      controls.paletteVariation,
      seed + i
    );

    // Get next point for line direction
    const nextPoint = i < points.length - 1 ? points[i + 1] : undefined;

    // Pass flow angle only when in drift mode for shape orientation
    const orientFlowAngle = controls.animationMode === "drift" ? controls.flowAngle : undefined;

    const shape = createShapeAtPoint(x, y, size, shapeType, color, rotation, nextPoint, orientFlowAngle);
    shapes.push({ ...shape, role: "anchor" });
  }

  return shapes;
}

function generateAnchors(
  width: number,
  height: number,
  controls: Controls,
  palette: Palette,
  rng: RandomUtils,
  seed: number
): RoleShape[] {
  const shapes: RoleShape[] = [];

  // Number of anchors: 1-5 based on density (but less sensitive than accents)
  const count = Math.max(1, Math.floor(1 + (controls.density / 100) * 3));

  // Scale affects size
  const baseSize = Math.min(width, height) * 0.15;
  const sizeMultiplier = 0.5 + (controls.scale / 100) * 1.5;
  const size = baseSize * sizeMultiplier;

  // Structure affects placement
  const useGrid = controls.structure > 50;
  const gridSize = Math.ceil(Math.sqrt(count + 2));

  for (let i = 0; i < count; i++) {
    let x: number, y: number;

    if (useGrid) {
      // Grid-based placement
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);
      const cellW = width / gridSize;
      const cellH = height / gridSize;
      x = cellW * (col + 0.5);
      y = cellH * (row + 0.5);

      // Apply chaos as offset from grid
      const chaosAmount = (controls.chaos / 100) * cellW * 0.4;
      x += rng.gaussian() * chaosAmount;
      y += rng.gaussian() * chaosAmount;
    } else {
      // Free-form placement with margin
      const margin = size;
      x = rng.range(margin, width - margin);
      y = rng.range(margin, height - margin);
    }

    // Choose shape type
    const shapeType = rng.pick(["circle", "rectangle", "circle"] as const);
    const color = varyColor(
      rng.pick(palette.anchor),
      controls.paletteVariation,
      seed + i
    );

    // Rotation affected by chaos
    const rotation = controls.chaos > 30 ? rng.range(-45, 45) * (controls.chaos / 100) : 0;

    let shape: Shape;

    if (shapeType === "circle") {
      const radius = size * rng.range(0.6, 1.0);
      shape = createCircle(x, y, radius, {
        fill: color,
        rotation,
      });
    } else {
      const w = size * rng.range(0.8, 1.5);
      const h = size * rng.range(0.8, 1.5);
      shape = createRectangle(x, y, w, h, {
        fill: color,
        rotation,
        cornerRadius: rng.chance(0.6) ? size * 0.1 : 0,
      });
    }

    shapes.push({ ...shape, role: "anchor" });
  }

  return shapes;
}

function generateAccents(
  width: number,
  height: number,
  controls: Controls,
  palette: Palette,
  rng: RandomUtils,
  anchors: RoleShape[],
  seed: number
): RoleShape[] {
  const shapes: RoleShape[] = [];

  // Number of accents: 0-15 based on density
  const count = Math.floor((controls.density / 100) * 15);

  // Accent size is smaller than anchors
  const baseSize = Math.min(width, height) * 0.06;
  const sizeMultiplier = 0.5 + (controls.scale / 100) * 1.0;
  const size = baseSize * sizeMultiplier;

  for (let i = 0; i < count; i++) {
    let x: number, y: number;

    // High structure: accents orbit around anchors
    if (controls.structure > 60 && anchors.length > 0) {
      const anchor = rng.pick(anchors);
      const angle = rng.range(0, Math.PI * 2);
      const distance = size * rng.range(2, 5);
      x = anchor.x + Math.cos(angle) * distance;
      y = anchor.y + Math.sin(angle) * distance;
    } else {
      // Free placement
      x = rng.range(size, width - size);
      y = rng.range(size, height - size);
    }

    // Apply chaos
    if (controls.chaos > 20) {
      const drift = size * (controls.chaos / 100) * 2;
      x += rng.gaussian() * drift;
      y += rng.gaussian() * drift;
    }

    const color = varyColor(
      rng.pick(palette.accent),
      controls.paletteVariation,
      seed + i + 100
    );

    const rotation = rng.range(-30, 30) * (controls.chaos / 100);

    // Accents have more variety in shape types
    const shapeType = rng.pick(["circle", "rectangle", "line"] as const);

    let shape: Shape;

    if (shapeType === "circle") {
      shape = createCircle(x, y, size * rng.range(0.4, 0.8), {
        fill: rng.chance(0.7) ? color : undefined,
        stroke: rng.chance(0.5) ? color : undefined,
        strokeWidth: 2,
        rotation,
      });
    } else if (shapeType === "rectangle") {
      shape = createRectangle(
        x,
        y,
        size * rng.range(0.5, 1.5),
        size * rng.range(0.5, 1.5),
        {
          fill: rng.chance(0.6) ? color : undefined,
          stroke: rng.chance(0.4) ? color : undefined,
          strokeWidth: 2,
          rotation,
          cornerRadius: rng.chance(0.5) ? size * 0.15 : 0,
        }
      );
    } else {
      const length = size * rng.range(1, 3);
      const angle = rng.range(0, Math.PI * 2);
      shape = createLine(
        x,
        y,
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length,
        {
          stroke: color,
          strokeWidth: rng.range(1, 3),
        }
      );
    }

    shapes.push({ ...shape, role: "accent" });
  }

  return shapes;
}

function generateTexture(
  width: number,
  height: number,
  controls: Controls,
  palette: Palette,
  rng: RandomUtils
): RoleShape[] {
  const shapes: RoleShape[] = [];

  // Texture only appears at higher density
  if (controls.density < 40) return shapes;

  // Number of texture elements scales with density
  const count = Math.floor(((controls.density - 40) / 60) * 50);

  const baseSize = Math.min(width, height) * 0.015;
  const size = baseSize * (0.5 + (controls.scale / 100) * 0.5);

  for (let i = 0; i < count; i++) {
    const x = rng.range(0, width);
    const y = rng.range(0, height);

    const color = rng.pick(palette.texture);

    // Texture is mostly dots and short lines
    const shapeType = rng.pick(["circle", "line", "circle"] as const);

    let shape: Shape;

    if (shapeType === "circle") {
      shape = createCircle(x, y, size * rng.range(0.3, 1.0), {
        fill: color,
      });
    } else {
      const length = size * rng.range(2, 6);
      const angle = controls.structure > 50
        ? rng.pick([0, Math.PI / 2, Math.PI / 4, -Math.PI / 4])
        : rng.range(0, Math.PI * 2);
      shape = createLine(x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length, {
        stroke: color,
        strokeWidth: 1,
      });
    }

    shapes.push({ ...shape, role: "texture" });
  }

  return shapes;
}
