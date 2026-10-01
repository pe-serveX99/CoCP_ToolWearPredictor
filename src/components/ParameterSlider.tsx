'use client';

import React from 'react';

interface ParameterSliderProps {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  recommendedMin?: number;
  recommendedMax?: number;
  description?: string;
  onChange: (value: number) => void;
  accentColor?: 'cyan' | 'amber' | 'emerald';
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  symbol,
  value,
  min,
  max,
  step,
  unit,
  recommendedMin,
  recommendedMax,
  description,
  onChange,
  accentColor = 'cyan',
}) => {
  const isOutOfRecommended =
    (recommendedMin !== undefined && value < recommendedMin) ||
    (recommendedMax !== undefined && value > recommendedMax);

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 hover:border-slate-700 transition-all shadow-md">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              {symbol}
            </span>
            <span className="text-xs font-semibold text-slate-200 tracking-wide">{label}</span>
          </div>
          {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) onChange(num);
            }}
            className="w-20 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-right text-sm font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <span className="text-[11px] font-mono text-slate-400 w-12">{unit}</span>
        </div>
      </div>

      {/* Slider Track with Custom Progress Fill */}
      <div className="relative my-2.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full relative z-10 cursor-pointer"
        />
        
        {/* Recommended Range Highlight Bar */}
        {recommendedMin !== undefined && recommendedMax !== undefined && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2.5 bg-emerald-500/20 border-x border-emerald-500/50 rounded-sm pointer-events-none"
            style={{
              left: `${Math.max(0, ((recommendedMin - min) / (max - min)) * 100)}%`,
              width: `${Math.min(100, ((recommendedMax - recommendedMin) / (max - min)) * 100)}%`,
            }}
            title={`Recommended bounds: ${recommendedMin} - ${recommendedMax} ${unit}`}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Min: {min} {unit}</span>
        {recommendedMin !== undefined && recommendedMax !== undefined && (
          <span className={`px-1.5 py-0.2 rounded ${isOutOfRecommended ? 'text-amber-400 font-semibold' : 'text-emerald-400'}`}>
            {isOutOfRecommended ? '⚠️ Out of catalog window' : '✓ In catalog spec'} ({recommendedMin} - {recommendedMax})
          </span>
        )}
        <span>Max: {max} {unit}</span>
      </div>
    </div>
  );
};
