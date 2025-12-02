"use client";

import { useState, useCallback, useRef } from "react";
import { Controls as ControlsType, Palette, CanvasPreset } from "@/lib/types";
import { palettes, canvasPresets } from "@/lib/palettes";
import { Canvas } from "@/components/Canvas";
import { Controls } from "@/components/Controls";

const defaultControls: ControlsType = {
  structure: 50,
  density: 60,
  scale: 50,
  chaos: 30,
  motion: 60,
  paletteVariation: 30,
  pathShape: "circle",
  animationMode: "full",
  flowAngle: 0,
};

export default function Home() {
  const [controls, setControls] = useState<ControlsType>(defaultControls);
  const [palette, setPalette] = useState<Palette>(palettes[0]);
  const [canvasPreset, setCanvasPreset] = useState<CanvasPreset>(canvasPresets[0]);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));
  const [text, setText] = useState("HELLO");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleRandomize = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1000000));
  }, []);

  const handleExport = useCallback(() => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = `generative-${seed}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }, [seed]);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">Generative Studio</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Simple shapes, infinite compositions
          </p>
        </header>

        <div className="flex gap-8 items-start flex-wrap lg:flex-nowrap">
          {/* Canvas area */}
          <div className="flex-1 flex justify-center items-center min-h-[500px] bg-neutral-950 rounded-xl p-8">
            <Canvas
              controls={controls}
              palette={palette}
              canvasPreset={canvasPreset}
              seed={seed}
              text={text}
              onCanvasReady={handleCanvasReady}
            />
          </div>

          {/* Controls panel */}
          <Controls
            controls={controls}
            onControlsChange={setControls}
            palette={palette}
            onPaletteChange={setPalette}
            canvasPreset={canvasPreset}
            onCanvasPresetChange={setCanvasPreset}
            seed={seed}
            onSeedChange={setSeed}
            text={text}
            onTextChange={setText}
            onRandomize={handleRandomize}
            onExport={handleExport}
          />
        </div>
      </div>
    </main>
  );
}
