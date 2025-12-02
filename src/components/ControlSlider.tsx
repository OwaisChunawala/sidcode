"use client";

interface ControlSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function ControlSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: ControlSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <label className="text-neutral-300">{label}</label>
        <span className="text-neutral-500 tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
      />
    </div>
  );
}
