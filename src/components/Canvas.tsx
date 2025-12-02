"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Controls, Palette, CanvasPreset } from "@/lib/types";
import { generateComposition } from "@/lib/generator";
import {
  AnimatedShape,
  addAnimationProperties,
  updateAnimatedShapes,
  renderAnimatedShape,
} from "@/lib/animation";

interface CanvasProps {
  controls: Controls;
  palette: Palette;
  canvasPreset: CanvasPreset;
  seed: number;
  text: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function Canvas({
  controls,
  palette,
  canvasPreset,
  seed,
  text,
  onCanvasReady,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<AnimatedShape[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Generate shapes when controls change
  useEffect(() => {
    const baseShapes = generateComposition({
      width: canvasPreset.width,
      height: canvasPreset.height,
      controls,
      palette,
      seed,
      text,
    });

    // Use animation mode from controls
    shapesRef.current = addAnimationProperties(
      baseShapes,
      controls.chaos,
      controls.motion,
      seed,
      controls.animationMode,
      controls.flowAngle
    );

    // Full clear canvas when shapes regenerate
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = palette.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [controls, palette, seed, canvasPreset, text]);

  // Animation loop
  const animate = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate delta time
      const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;

      // Update shapes
      updateAnimatedShapes(
        shapesRef.current,
        canvas.width,
        canvas.height,
        deltaTime
      );

      // Clear with trail effect for motion blur (higher = more trail)
      ctx.fillStyle = palette.background;
      ctx.globalAlpha = 0.15 + (1 - controls.motion / 100) * 0.3; // Less trail at high motion
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;

      // Draw shapes by layer
      const anchors = shapesRef.current.filter((s) => s.role === "anchor");
      const accents = shapesRef.current.filter((s) => s.role === "accent");
      const textures = shapesRef.current.filter((s) => s.role === "texture");

      // Render in order: texture (back), accents, anchors (front)
      for (const shape of textures) {
        renderAnimatedShape(ctx, shape);
      }
      for (const shape of accents) {
        renderAnimatedShape(ctx, shape);
      }
      for (const shape of anchors) {
        renderAnimatedShape(ctx, shape);
      }

      // Continue animation
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    },
    [palette.background, isAnimating, controls.motion]
  );

  // Start/stop animation
  useEffect(() => {
    if (isAnimating) {
      // Initial clear
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = palette.background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isAnimating, palette.background]);

  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  // Calculate display size to fit container while maintaining aspect ratio
  const aspectRatio = canvasPreset.width / canvasPreset.height;
  const maxWidth = 800;
  const maxHeight = 800;

  let displayWidth = maxWidth;
  let displayHeight = maxWidth / aspectRatio;

  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = maxHeight * aspectRatio;
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasPreset.width}
        height={canvasPreset.height}
        className="rounded-lg shadow-2xl cursor-pointer"
        style={{
          width: displayWidth,
          height: displayHeight,
        }}
        onClick={() => setIsAnimating(!isAnimating)}
        title={isAnimating ? "Click to pause" : "Click to play"}
      />
      <div className="absolute bottom-4 right-4 text-xs text-white/50">
        {isAnimating ? "▶ Playing" : "⏸ Paused"} (click to toggle)
      </div>
    </div>
  );
}
