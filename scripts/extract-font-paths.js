/**
 * Extract font glyph paths from Inter font using opentype.js
 * Run with: node scripts/extract-font-paths.js
 */

const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

const FONT_PATH = path.join(__dirname, '../public/fonts/Inter-Regular.ttf');
const OUTPUT_PATH = path.join(__dirname, '../src/lib/fontPaths.ts');

// Characters to extract
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// How many points to sample per curve segment
const CURVE_SAMPLES = 8;

// Minimum distance between points for line interpolation (in font units)
// Inter font has 2048 units per em, so 50 units ≈ 2.4% of letter height
const MIN_POINT_DISTANCE = 50;

/**
 * Interpolate points along a straight line to match curve density
 */
function interpolateLine(x0, y0, x1, y1, minDistance) {
  const points = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate how many points we need based on line length
  const numPoints = Math.max(1, Math.ceil(distance / minDistance));

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    points.push({
      x: x0 + dx * t,
      y: y0 + dy * t
    });
  }
  return points;
}

/**
 * Sample a quadratic bezier curve
 */
function sampleQuadratic(x0, y0, x1, y1, x2, y2, samples) {
  const points = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
    const y = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
    points.push({ x, y });
  }
  return points;
}

/**
 * Sample a cubic bezier curve
 */
function sampleCubic(x0, y0, x1, y1, x2, y2, x3, y3, samples) {
  const points = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const x = mt*mt*mt*x0 + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x3;
    const y = mt*mt*mt*y0 + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*y3;
    points.push({ x, y });
  }
  return points;
}

/**
 * Convert opentype path commands to point array
 */
function pathToPoints(pathCommands, unitsPerEm) {
  const points = [];
  let currentX = 0;
  let currentY = 0;

  for (const cmd of pathCommands) {
    switch (cmd.type) {
      case 'M': // Move to
        currentX = cmd.x;
        currentY = cmd.y;
        points.push({ x: currentX / unitsPerEm, y: 1 - currentY / unitsPerEm });
        break;

      case 'L': // Line to - interpolate points along the line
        const linePoints = interpolateLine(
          currentX, currentY,
          cmd.x, cmd.y,
          MIN_POINT_DISTANCE
        );
        // Skip first point (it's the current position)
        for (let i = 1; i < linePoints.length; i++) {
          points.push({
            x: linePoints[i].x / unitsPerEm,
            y: 1 - linePoints[i].y / unitsPerEm
          });
        }
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case 'Q': // Quadratic bezier
        const qPoints = sampleQuadratic(
          currentX, currentY,
          cmd.x1, cmd.y1,
          cmd.x, cmd.y,
          CURVE_SAMPLES
        );
        // Skip first point (it's the current position)
        for (let i = 1; i < qPoints.length; i++) {
          points.push({
            x: qPoints[i].x / unitsPerEm,
            y: 1 - qPoints[i].y / unitsPerEm
          });
        }
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case 'C': // Cubic bezier
        const cPoints = sampleCubic(
          currentX, currentY,
          cmd.x1, cmd.y1,
          cmd.x2, cmd.y2,
          cmd.x, cmd.y,
          CURVE_SAMPLES
        );
        // Skip first point (it's the current position)
        for (let i = 1; i < cPoints.length; i++) {
          points.push({
            x: cPoints[i].x / unitsPerEm,
            y: 1 - cPoints[i].y / unitsPerEm
          });
        }
        currentX = cmd.x;
        currentY = cmd.y;
        break;

      case 'Z': // Close path
        // Don't add a point, just signals path closure
        break;
    }
  }

  return points;
}

/**
 * Normalize points to 0-1 range based on actual bounds
 */
function normalizePoints(points) {
  if (points.length === 0) return points;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  // Normalize to 0-1 range, maintaining aspect ratio
  const scale = Math.max(width, height);

  return points.map(p => ({
    x: (p.x - minX) / scale,
    y: (p.y - minY) / scale
  }));
}

async function main() {
  console.log('Loading font from:', FONT_PATH);

  const font = await opentype.load(FONT_PATH);
  console.log('Font loaded:', font.names.fontFamily.en);
  console.log('Units per em:', font.unitsPerEm);

  const glyphPaths = {};

  for (const char of CHARS) {
    const glyph = font.charToGlyph(char);
    if (!glyph || !glyph.path || !glyph.path.commands) {
      console.warn(`No glyph found for: ${char}`);
      continue;
    }

    const rawPoints = pathToPoints(glyph.path.commands, font.unitsPerEm);
    const normalizedPoints = normalizePoints(rawPoints);

    // Round to 4 decimal places for smaller file size
    glyphPaths[char] = normalizedPoints.map(p => ({
      x: Math.round(p.x * 10000) / 10000,
      y: Math.round(p.y * 10000) / 10000
    }));

    console.log(`${char}: ${glyphPaths[char].length} points`);
  }

  // Add space
  glyphPaths[' '] = [];

  // Generate TypeScript output
  const output = `// Auto-generated font paths from Inter-Regular.ttf
// Do not edit manually - run: node scripts/extract-font-paths.js

export interface PathPoint {
  x: number;
  y: number;
}

export const fontPaths: Record<string, PathPoint[]> = ${JSON.stringify(glyphPaths, null, 2)};

// Get points for a text string, positioned and scaled for the canvas
export function getTextPathPoints(
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  density: number
): { points: PathPoint[]; letterBounds: { x: number; width: number }[] } {
  const upperText = text.toUpperCase();
  const allPoints: PathPoint[] = [];
  const letterBounds: { x: number; width: number }[] = [];

  if (upperText.length === 0) {
    return { points: [], letterBounds: [] };
  }

  // Calculate letter dimensions
  const padding = canvasWidth * 0.08;
  const availableWidth = canvasWidth - padding * 2;
  const letterWidth = Math.min(
    availableWidth / upperText.length,
    canvasHeight * 0.6
  );
  const letterHeight = letterWidth * 1.2;
  const letterSpacing = letterWidth * 0.1;
  const totalWidth =
    upperText.length * letterWidth + (upperText.length - 1) * letterSpacing;
  const startX = (canvasWidth - totalWidth) / 2;
  const startY = (canvasHeight - letterHeight) / 2;

  // Sample rate - fewer samples at lower density
  const sampleRate = Math.max(1, Math.floor((100 - density) / 15) + 1);

  for (let i = 0; i < upperText.length; i++) {
    const char = upperText[i];
    const letterPath = fontPaths[char];
    const letterX = startX + i * (letterWidth + letterSpacing);

    letterBounds.push({ x: letterX, width: letterWidth });

    if (letterPath) {
      for (let j = 0; j < letterPath.length; j += sampleRate) {
        const point = letterPath[j];
        allPoints.push({
          x: letterX + point.x * letterWidth,
          y: startY + point.y * letterHeight,
        });
      }
    }
  }

  return { points: allPoints, letterBounds };
}
`;

  fs.writeFileSync(OUTPUT_PATH, output);
  console.log(`\nGenerated: ${OUTPUT_PATH}`);
  console.log(`Total characters: ${Object.keys(glyphPaths).length}`);
}

main().catch(console.error);
