"use client";

import { Controls as ControlsType, Palette, CanvasPreset, PathShapeType, AnimationMode } from "@/lib/types";
import { palettes, canvasPresets } from "@/lib/palettes";
import { ControlSlider } from "./ControlSlider";

interface ControlsProps {
  controls: ControlsType;
  onControlsChange: (controls: ControlsType) => void;
  palette: Palette;
  onPaletteChange: (palette: Palette) => void;
  canvasPreset: CanvasPreset;
  onCanvasPresetChange: (preset: CanvasPreset) => void;
  seed: number;
  onSeedChange: (seed: number) => void;
  text: string;
  onTextChange: (text: string) => void;
  onRandomize: () => void;
  onExport: () => void;
}

export function Controls({
  controls,
  onControlsChange,
  palette,
  onPaletteChange,
  canvasPreset,
  onCanvasPresetChange,
  seed,
  onSeedChange,
  text,
  onTextChange,
  onRandomize,
  onExport,
}: ControlsProps) {
  const updateControl = (key: keyof ControlsType, value: number) => {
    onControlsChange({ ...controls, [key]: value });
  };

  return (
    <div className="w-80 bg-neutral-900 p-6 rounded-xl space-y-6 h-fit">
      <h2 className="text-lg font-medium text-white">Controls</h2>

      {/* Text input */}
      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Text Path</label>
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value.toUpperCase())}
          placeholder="Type text..."
          maxLength={12}
          className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 uppercase tracking-wider font-medium"
        />
      </div>

      {/* Shape selector */}
      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Shape Type</label>
        <div className="grid grid-cols-5 gap-1">
          {(["circle", "semicircle", "triangle", "rectangle", "line"] as PathShapeType[]).map((shape) => (
            <button
              key={shape}
              onClick={() => onControlsChange({ ...controls, pathShape: shape })}
              className={`p-2 rounded-lg text-xs transition-colors ${
                controls.pathShape === shape
                  ? "bg-white text-black"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
              title={shape}
            >
              {shape === "circle" && "●"}
              {shape === "semicircle" && "◗"}
              {shape === "triangle" && "▲"}
              {shape === "rectangle" && "■"}
              {shape === "line" && "━"}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        <ControlSlider
          label="Structure"
          value={controls.structure}
          onChange={(v) => updateControl("structure", v)}
        />
        <ControlSlider
          label="Density"
          value={controls.density}
          onChange={(v) => updateControl("density", v)}
        />
        <ControlSlider
          label="Scale"
          value={controls.scale}
          onChange={(v) => updateControl("scale", v)}
        />
        <ControlSlider
          label="Chaos"
          value={controls.chaos}
          onChange={(v) => updateControl("chaos", v)}
        />
        <ControlSlider
          label="Motion"
          value={controls.motion}
          onChange={(v) => updateControl("motion", v)}
        />
      </div>

      {/* Animation Mode */}
      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Animation Mode</label>
        <div className="grid grid-cols-4 gap-1">
          {(["full", "stationary", "drift", "pulse"] as AnimationMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onControlsChange({ ...controls, animationMode: mode })}
              className={`p-2 rounded-lg text-xs transition-colors capitalize ${
                controls.animationMode === mode
                  ? "bg-white text-black"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
              title={
                mode === "full" ? "Wobble + drift + pulse" :
                mode === "stationary" ? "Wobble in place" :
                mode === "drift" ? "Directional movement" :
                "Size pulsing only"
              }
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Flow Direction - only show when drift mode is active */}
      {controls.animationMode === "drift" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-300">Flow Direction</label>
            <span className="text-xs text-neutral-500">{controls.flowAngle}°</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Visual angle indicator */}
            <div className="w-10 h-10 rounded-full border border-neutral-700 flex items-center justify-center relative">
              <div
                className="absolute w-4 h-0.5 bg-white origin-left"
                style={{
                  transform: `rotate(${controls.flowAngle}deg)`,
                  left: '50%',
                  top: '50%',
                  marginTop: '-1px'
                }}
              />
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={controls.flowAngle}
              onChange={(e) => onControlsChange({ ...controls, flowAngle: Number(e.target.value) })}
              className="flex-1 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      )}

      {/* Palette selector */}
      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Palette</label>
        <select
          value={palette.name}
          onChange={(e) => {
            const newPalette = palettes.find((p) => p.name === e.target.value);
            if (newPalette) onPaletteChange(newPalette);
          }}
          className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {palettes.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <ControlSlider
          label="Variation"
          value={controls.paletteVariation}
          onChange={(v) => updateControl("paletteVariation", v)}
        />
      </div>

      {/* Canvas size selector */}
      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Canvas Size</label>
        <select
          value={canvasPreset.name}
          onChange={(e) => {
            const newPreset = canvasPresets.find((p) => p.name === e.target.value);
            if (newPreset) onCanvasPresetChange(newPreset);
          }}
          className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {canvasPresets.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} ({p.ratio})
            </option>
          ))}
        </select>
      </div>

      {/* Seed control */}
      <div className="space-y-2">
        <label className="text-sm text-neutral-300">Seed</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={seed}
            onChange={(e) => onSeedChange(Number(e.target.value))}
            className="flex-1 bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 tabular-nums"
          />
          <button
            onClick={onRandomize}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
            title="Generate new seed"
          >
            Shuffle
          </button>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(String(seed))}
          className="w-full px-3 py-1.5 text-neutral-400 hover:text-white text-xs transition-colors"
        >
          Copy seed to clipboard
        </button>
      </div>

      {/* Export */}
      <button
        onClick={onExport}
        className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
      >
        Export PNG
      </button>
    </div>
  );
}
