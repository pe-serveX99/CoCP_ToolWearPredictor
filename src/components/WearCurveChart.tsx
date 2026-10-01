'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  Area,
} from 'recharts';
import { WearCurvePoint } from '../types/cnc';
import { FLANK_WEAR_THRESHOLD_MM } from '../lib/physics';
import { AlertTriangle, Clock, Zap, Target, Gauge } from 'lucide-react';

interface WearCurveChartProps {
  data: WearCurvePoint[];
  toolLifeMinutes: number;
  currentTimeInCut: number;
  onCurrentTimeChange?: (time: number) => void;
  toolName: string;
}

export const WearCurveChart: React.FC<WearCurveChartProps> = ({
  data,
  toolLifeMinutes,
  currentTimeInCut,
  onCurrentTimeChange,
  toolName,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
        <div className="text-slate-500 font-mono text-xs">Loading Precision Recharts Telemetry Engine...</div>
      </div>
    );
  }

  // Calculate flank wear at exact current time in cut
  const currentWearEstimate = (() => {
    const t1 = toolLifeMinutes * 0.12;
    const t2 = toolLifeMinutes * 0.85;
    const t = Math.min(toolLifeMinutes * 1.15, Math.max(0, currentTimeInCut));

    if (t <= t1) {
      const ratio = t1 > 0 ? t / t1 : 0;
      return 0.08 * Math.sqrt(ratio);
    } else if (t <= t2) {
      return 0.08 + ((0.24 - 0.08) / (t2 - t1)) * (t - t1);
    } else {
      const progress = (t - t2) / (toolLifeMinutes - t2);
      return 0.24 + (0.30 - 0.24) * Math.pow(progress, 1.8);
    }
  })();

  const isCurrentTimeCritical = currentWearEstimate >= FLANK_WEAR_THRESHOLD_MM;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as WearCurvePoint;
      const percentLife = ((point.time / toolLifeMinutes) * 100).toFixed(0);
      const isPastThreshold = point.flankWear >= point.threshold;

      return (
        <div className="bg-[#090e1a]/95 border border-cyan-500/50 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1.5 mb-2">
            <span className="text-slate-400">Simulation Time:</span>
            <span className="text-cyan-300 font-bold text-sm">{point.time.toFixed(1)} min</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Flank Wear (VB):</span>
              <span className={`font-bold ${isPastThreshold ? 'text-red-400 font-extrabold' : 'text-cyan-300'}`}>
                {point.flankWear.toFixed(3)} mm
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Critical Limit:</span>
              <span className="text-red-400 font-bold">{point.threshold.toFixed(2)} mm</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Wear Stage:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                  point.phase === 'Break-in'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : point.phase === 'Steady-state'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                }`}
              >
                {point.phase}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-800/80">
              <span className="text-slate-400">Tool Life Consumed:</span>
              <span className="text-slate-200 font-bold">{percentLife}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-3">
      {/* Chart Header & Phase Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)] animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wide text-white uppercase font-mono flex items-center gap-1.5">
            Tool Wear Curve • Flank Wear (VB) vs Time
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> I: Break-in
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> II: Steady-State
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> III: Failure Zone
          </span>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="h-80 w-full bg-[#070b14] rounded-2xl p-3 border border-slate-800 shadow-inner relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="wearAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#172033" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `${val}m`}
              label={{
                value: 'Cutting Duration t (Minutes)',
                position: 'insideBottom',
                offset: -4,
                fill: '#64748b',
                fontSize: 11,
              }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[0, 0.40]}
              tickLine={false}
              tickFormatter={(val) => `${val.toFixed(2)}`}
              label={{
                value: 'Flank Wear VB (mm)',
                angle: -90,
                position: 'insideLeft',
                offset: 15,
                fill: '#64748b',
                fontSize: 11,
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* BRIGHT RED CRITICAL FAILURE LIMIT LINE (ISO 3685) */}
            <ReferenceLine
              y={FLANK_WEAR_THRESHOLD_MM}
              stroke="#ef4444"
              strokeDasharray="6 4"
              strokeWidth={2.5}
              label={{
                value: 'CRITICAL FAILURE LIMIT: VB = 0.30 mm',
                position: 'top',
                fill: '#f87171',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />

            {/* TAYLOR TOOL LIFE VERTICAL REFERENCE */}
            <ReferenceLine
              x={toolLifeMinutes}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Taylor T = ${toolLifeMinutes.toFixed(1)}m`,
                position: 'insideTopLeft',
                fill: '#fbbf24',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />

            {/* GLOWING VISUAL MARKER: EXACT CURRENT TIME-IN-CUT */}
            <ReferenceLine
              x={currentTimeInCut}
              stroke="#22d3ee"
              strokeWidth={2}
              strokeDasharray="2 2"
              label={{
                value: `CURRENT: ${currentTimeInCut.toFixed(1)}m`,
                position: 'insideTopRight',
                fill: '#22d3ee',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            />

            {/* Glowing Pointer Dot at Current Time-In-Cut */}
            <ReferenceDot
              x={currentTimeInCut}
              y={Number(currentWearEstimate.toFixed(3))}
              r={7}
              fill="#22d3ee"
              stroke="#ffffff"
              strokeWidth={2.5}
              className="drop-shadow-[0_0_12px_rgba(34,211,238,1)] animate-ping"
            />
            <ReferenceDot
              x={currentTimeInCut}
              y={Number(currentWearEstimate.toFixed(3))}
              r={5}
              fill="#ffffff"
              stroke="#0891b2"
              strokeWidth={2}
            />

            {/* Shaded Area Under Curve */}
            <Area
              type="monotone"
              dataKey="flankWear"
              stroke="#06b6d4"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#wearAreaGradient)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Operator Interactive Scrub Bar for Current Time In Cut */}
      <div className="bg-[#0b101c] p-3 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-300 font-bold">Simulated Current Time-in-Cut: </span>
            <span className="text-cyan-300 font-extrabold text-sm">{currentTimeInCut.toFixed(1)} min</span>
            <span className="text-slate-500 ml-2">
              (Est. VB: <strong className={isCurrentTimeCritical ? 'text-red-400' : 'text-emerald-400'}>{currentWearEstimate.toFixed(3)} mm</strong>)
            </span>
          </div>
        </div>

        {onCurrentTimeChange && (
          <div className="flex items-center gap-3 min-w-[200px]">
            <input
              type="range"
              min={0}
              max={Math.ceil(toolLifeMinutes * 1.15)}
              step={0.5}
              value={currentTimeInCut}
              onChange={(e) => onCurrentTimeChange(parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 w-12 text-right">Scrub</span>
          </div>
        )}
      </div>
    </div>
  );
};
