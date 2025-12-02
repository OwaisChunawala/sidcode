import { Circle, Rectangle, Line, Semicircle, Triangle, Shape } from "./types";

// Render a shape to a canvas context
export function renderShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.save();
  ctx.translate(shape.x, shape.y);
  ctx.rotate((shape.rotation * Math.PI) / 180);

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
  }

  ctx.restore();
}

function renderCircle(ctx: CanvasRenderingContext2D, circle: Circle): void {
  ctx.beginPath();
  ctx.arc(0, 0, circle.radius, 0, Math.PI * 2);

  if (circle.fill) {
    ctx.fillStyle = circle.fill;
    ctx.fill();
  }

  if (circle.stroke) {
    ctx.strokeStyle = circle.stroke;
    ctx.lineWidth = circle.strokeWidth || 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

function renderRectangle(ctx: CanvasRenderingContext2D, rect: Rectangle): void {
  const x = -rect.width / 2;
  const y = -rect.height / 2;
  const r = rect.cornerRadius || 0;

  ctx.beginPath();

  if (r > 0) {
    // Rounded rectangle
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + rect.width - r, y);
    ctx.quadraticCurveTo(x + rect.width, y, x + rect.width, y + r);
    ctx.lineTo(x + rect.width, y + rect.height - r);
    ctx.quadraticCurveTo(
      x + rect.width,
      y + rect.height,
      x + rect.width - r,
      y + rect.height
    );
    ctx.lineTo(x + r, y + rect.height);
    ctx.quadraticCurveTo(x, y + rect.height, x, y + rect.height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  } else {
    ctx.rect(x, y, rect.width, rect.height);
  }

  ctx.closePath();

  if (rect.fill) {
    ctx.fillStyle = rect.fill;
    ctx.fill();
  }

  if (rect.stroke) {
    ctx.strokeStyle = rect.stroke;
    ctx.lineWidth = rect.strokeWidth || 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

function renderLine(ctx: CanvasRenderingContext2D, line: Line): void {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(line.x2 - line.x, line.y2 - line.y);

  ctx.strokeStyle = line.stroke || "#ffffff";
  ctx.lineWidth = line.strokeWidth || 2;
  ctx.lineCap = "round";
  ctx.stroke();
}

// Shape factory functions
export function createCircle(
  x: number,
  y: number,
  radius: number,
  options: Partial<Circle> = {}
): Circle {
  return {
    type: "circle",
    x,
    y,
    radius,
    rotation: 0,
    ...options,
  };
}

export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  options: Partial<Rectangle> = {}
): Rectangle {
  return {
    type: "rectangle",
    x,
    y,
    width,
    height,
    rotation: 0,
    ...options,
  };
}

export function createLine(
  x: number,
  y: number,
  x2: number,
  y2: number,
  options: Partial<Line> = {}
): Line {
  return {
    type: "line",
    x,
    y,
    x2,
    y2,
    rotation: 0,
    ...options,
  };
}

export function createSemicircle(
  x: number,
  y: number,
  radius: number,
  options: Partial<Semicircle> = {}
): Semicircle {
  return {
    type: "semicircle",
    x,
    y,
    radius,
    rotation: 0,
    ...options,
  };
}

export function createTriangle(
  x: number,
  y: number,
  size: number,
  options: Partial<Triangle> = {}
): Triangle {
  return {
    type: "triangle",
    x,
    y,
    size,
    rotation: 0,
    ...options,
  };
}
