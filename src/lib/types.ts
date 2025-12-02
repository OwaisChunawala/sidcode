// Shape types
export type ShapeType = "circle" | "rectangle" | "line" | "semicircle" | "triangle";

// Path shape type for user selection
export type PathShapeType = "circle" | "semicircle" | "triangle" | "rectangle" | "line";

// Animation mode type
export type AnimationMode = "full" | "stationary" | "drift" | "pulse";

export interface BaseShape {
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface Circle extends BaseShape {
  type: "circle";
  radius: number;
}

export interface Rectangle extends BaseShape {
  type: "rectangle";
  width: number;
  height: number;
  cornerRadius?: number;
}

export interface Line extends BaseShape {
  type: "line";
  x2: number;
  y2: number;
}

export interface Semicircle extends BaseShape {
  type: "semicircle";
  radius: number;
}

export interface Triangle extends BaseShape {
  type: "triangle";
  size: number;
}

export type Shape = Circle | Rectangle | Line | Semicircle | Triangle;

// Role types
export type Role = "anchor" | "accent" | "texture";

export interface RoleShape extends Shape {
  role: Role;
}

// Control parameters
export interface Controls {
  structure: number; // 0-100
  density: number; // 0-100
  scale: number; // 0-100
  chaos: number; // 0-100
  motion: number; // 0-100 - animation speed/intensity
  paletteVariation: number; // 0-100
  pathShape: PathShapeType; // Shape type for text paths
  animationMode: AnimationMode; // Animation behavior mode
  flowAngle: number; // 0-360 degrees - direction of flow/drift
}

// Palette
export interface Palette {
  name: string;
  background: string;
  anchor: string[];
  accent: string[];
  texture: string[];
}

// Canvas size presets
export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
  ratio: string;
}

// Composition state
export interface CompositionState {
  seed: number;
  controls: Controls;
  palette: Palette;
  canvasPreset: CanvasPreset;
  text?: string;
}
