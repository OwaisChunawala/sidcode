import { RoleShape } from "./types";

export interface AnimatedShape extends RoleShape {
  // Animation properties
  vx: number; // velocity x
  vy: number; // velocity y
  vRotation: number; // rotation velocity
  pulsePhase: number; // for pulsing effect
  pulseSpeed: number;
  originalRadius?: number;
  originalWidth?: number;
  originalHeight?: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmount: number;
}

export function addAnimationProperties(
  shapes: RoleShape[],
  chaos: number,
  motion: number,
  seed: number,
  stationaryMode: boolean = false
): AnimatedShape[] {
  // Simple seeded random
  let s = seed;
  const random = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const motionMultiplier = motion / 100;

  return shapes.map((shape, i) => {
    // Seed each shape differently
    for (let j = 0; j < i; j++) random();

    const chaosMultiplier = chaos / 100;
    const roleMultiplier =
      shape.role === "anchor" ? 0.3 : shape.role === "accent" ? 0.7 : 1.0;

    // In stationary mode (for text paths), shapes wobble in place with no drift
    const velocityScale = stationaryMode ? 0 : 1;

    const animated: AnimatedShape = {
      ...shape,
      vx: (random() - 0.5) * 3 * chaosMultiplier * roleMultiplier * motionMultiplier * velocityScale,
      vy: (random() - 0.5) * 3 * chaosMultiplier * roleMultiplier * motionMultiplier * velocityScale,
      vRotation: (random() - 0.5) * 3 * chaosMultiplier * roleMultiplier * motionMultiplier * (stationaryMode ? 0.3 : 1),
      pulsePhase: random() * Math.PI * 2,
      pulseSpeed: (0.02 + random() * 0.04) * motionMultiplier,
      wobblePhase: random() * Math.PI * 2,
      wobbleSpeed: (0.015 + random() * 0.03) * motionMultiplier,
      wobbleAmount: (stationaryMode ? 4 : 8) + random() * (stationaryMode ? 8 : 15) * chaosMultiplier * motionMultiplier,
    };

    // Store original sizes for pulsing
    if (shape.type === "circle" || shape.type === "semicircle") {
      animated.originalRadius = shape.radius;
    } else if (shape.type === "rectangle") {
      animated.originalWidth = shape.width;
      animated.originalHeight = shape.height;
    } else if (shape.type === "triangle") {
      (animated as AnimatedShape & { originalSize?: number }).originalSize = shape.size;
    }

    return animated;
  });
}

export function updateAnimatedShapes(
  shapes: AnimatedShape[],
  width: number,
  height: number,
  deltaTime: number
): void {
  const dt = deltaTime * 0.06; // normalize to ~60fps feeling

  for (const shape of shapes) {
    // Update position with velocity
    shape.x += shape.vx * dt;
    shape.y += shape.vy * dt;

    // Add wobble
    shape.wobblePhase += shape.wobbleSpeed * dt;
    const wobbleX = Math.sin(shape.wobblePhase) * shape.wobbleAmount;
    const wobbleY = Math.cos(shape.wobblePhase * 1.3) * shape.wobbleAmount;

    // Bounce off edges (with some padding)
    const padding = 50;
    if (shape.x < padding || shape.x > width - padding) {
      shape.vx *= -1;
      shape.x = Math.max(padding, Math.min(width - padding, shape.x));
    }
    if (shape.y < padding || shape.y > height - padding) {
      shape.vy *= -1;
      shape.y = Math.max(padding, Math.min(height - padding, shape.y));
    }

    // Update rotation
    shape.rotation += shape.vRotation * dt;

    // Update pulse
    shape.pulsePhase += shape.pulseSpeed * dt;
    const pulseFactor = 1 + Math.sin(shape.pulsePhase) * 0.15;

    // Apply pulse to size
    if ((shape.type === "circle" || shape.type === "semicircle") && shape.originalRadius) {
      shape.radius = shape.originalRadius * pulseFactor;
    } else if (
      shape.type === "rectangle" &&
      shape.originalWidth &&
      shape.originalHeight
    ) {
      shape.width = shape.originalWidth * pulseFactor;
      shape.height = shape.originalHeight * pulseFactor;
    } else if (shape.type === "triangle") {
      const originalSize = (shape as AnimatedShape & { originalSize?: number }).originalSize;
      if (originalSize) {
        shape.size = originalSize * pulseFactor;
      }
    }

    // Temporarily offset position for wobble (applied during render)
    (shape as AnimatedShape & { wobbleX: number; wobbleY: number }).wobbleX =
      wobbleX;
    (shape as AnimatedShape & { wobbleX: number; wobbleY: number }).wobbleY =
      wobbleY;
  }
}

export function renderAnimatedShape(
  ctx: CanvasRenderingContext2D,
  shape: AnimatedShape
): void {
  const wobbleX =
    (shape as AnimatedShape & { wobbleX?: number }).wobbleX || 0;
  const wobbleY =
    (shape as AnimatedShape & { wobbleY?: number }).wobbleY || 0;

  ctx.save();
  ctx.translate(shape.x + wobbleX, shape.y + wobbleY);
  ctx.rotate((shape.rotation * Math.PI) / 180);

  // Add glow effect for anchors
  if (shape.role === "anchor" && shape.fill) {
    ctx.shadowColor = shape.fill;
    ctx.shadowBlur = 20 + Math.sin(shape.pulsePhase) * 10;
  }

  switch (shape.type) {
    case "circle":
      renderCircle(ctx, shape);
      break;
    case "rectangle":
      renderRectangle(ctx, shape);
      break;
    case "line":
      renderLine(ctx, shape);
      break;
    case "semicircle":
      renderSemicircle(ctx, shape);
      break;
    case "triangle":
      renderTriangle(ctx, shape);
      break;
  }

  ctx.restore();
}

function renderCircle(
  ctx: CanvasRenderingContext2D,
  shape: AnimatedShape
): void {
  if (shape.type !== "circle") return;

  ctx.beginPath();
  ctx.arc(0, 0, shape.radius, 0, Math.PI * 2);

  if (shape.fill) {
    ctx.fillStyle = shape.fill;
    ctx.fill();
  }

  if (shape.stroke) {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth || 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

function renderRectangle(
  ctx: CanvasRenderingContext2D,
  shape: AnimatedShape
): void {
  if (shape.type !== "rectangle") return;

  const x = -shape.width / 2;
  const y = -shape.height / 2;
  const r = shape.cornerRadius || 0;

  ctx.beginPath();

  if (r > 0) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + shape.width - r, y);
    ctx.quadraticCurveTo(x + shape.width, y, x + shape.width, y + r);
    ctx.lineTo(x + shape.width, y + shape.height - r);
    ctx.quadraticCurveTo(
      x + shape.width,
      y + shape.height,
      x + shape.width - r,
      y + shape.height
    );
    ctx.lineTo(x + r, y + shape.height);
    ctx.quadraticCurveTo(x, y + shape.height, x, y + shape.height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  } else {
    ctx.rect(x, y, shape.width, shape.height);
  }

  ctx.closePath();

  if (shape.fill) {
    ctx.fillStyle = shape.fill;
    ctx.fill();
  }

  if (shape.stroke) {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth || 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

function renderLine(
  ctx: CanvasRenderingContext2D,
  shape: AnimatedShape
): void {
  if (shape.type !== "line") return;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(shape.x2 - shape.x, shape.y2 - shape.y);

  ctx.strokeStyle = shape.stroke || "#ffffff";
  ctx.lineWidth = shape.strokeWidth || 2;
  ctx.lineCap = "round";
  ctx.stroke();
}

function renderSemicircle(
  ctx: CanvasRenderingContext2D,
  shape: AnimatedShape
): void {
  if (shape.type !== "semicircle") return;

  ctx.beginPath();
  ctx.arc(0, 0, shape.radius, 0, Math.PI);
  ctx.closePath();

  if (shape.fill) {
    ctx.fillStyle = shape.fill;
    ctx.fill();
  }

  if (shape.stroke) {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth || 2;
    ctx.stroke();
  }
}

function renderTriangle(
  ctx: CanvasRenderingContext2D,
  shape: AnimatedShape
): void {
  if (shape.type !== "triangle") return;

  const size = shape.size;
  const height = (size * Math.sqrt(3)) / 2;

  ctx.beginPath();
  // Equilateral triangle pointing up
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(-size / 2, height / 2);
  ctx.lineTo(size / 2, height / 2);
  ctx.closePath();

  if (shape.fill) {
    ctx.fillStyle = shape.fill;
    ctx.fill();
  }

  if (shape.stroke) {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth || 2;
    ctx.stroke();
  }
}
