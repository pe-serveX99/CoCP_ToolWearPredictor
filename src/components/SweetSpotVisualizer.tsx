'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { SweetSpotPoint } from '../types/cnc';
import {
  Sparkles,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  Gauge,
  Zap,
  Target,
  ArrowRight,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface SweetSpotVisualizerProps {
  data: SweetSpotPoint[];
  currentVc: number;
  currentMrr: number;
  onApplyOptimal: (vc: number) => void;
  machineName: string;
  toolName: string;
  materialName: string;
}

export const SweetSpotVisualizer: React.FC<SweetSpotVisualizerProps> = ({
  data,
  currentVc,
  currentMrr,
  onApplyOptimal,
  machineName,
  toolName,
  materialName,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [costMode, setCostMode] = useState<'tool' | 'total'>('tool');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Calculate the exact lowest point (Global Minimum Cost Sweet Spot)
  const lowestPoint = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data.reduce((minPt, pt) => {
      const metric = costMode === 'tool' ? pt.toolCostPerPart : pt.totalCostPerPart;
      const minMetric = costMode === 'tool' ? minPt.toolCostPerPart : minPt.totalCostPerPart;
      return metric < minMetric ? pt : minPt;
    }, data[0]);
  }, [data, costMode]);

  // Current operating point on the curve
  const currentPoint = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data.reduce((closest, pt) => {
      return Math.abs(pt.vc - currentVc) < Math.abs(closest.vc - currentVc) ? pt : closest;
    }, data[0]);
  }, [data, currentVc]);

  // Cost difference calculation
  const potentialSavings = useMemo(() => {
    if (!lowestPoint || !currentPoint) return 0;
    const currentCost = costMode === 'tool' ? currentPoint.toolCostPerPart : currentPoint.totalCostPerPart;
    const optimalCost = costMode === 'tool' ? lowestPoint.toolCostPerPart : lowestPoint.totalCostPerPart;
    return Math.max(0, Number((currentCost - optimalCost).toFixed(2)));
  }, [lowestPoint, currentPoint, costMode]);

  if (!isMounted) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
        <div className="text-slate-500 font-mono text-xs">Computing Productivity vs. Tool Cost Gilbert Matrix...</div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload as SweetSpotPoint;
      const isLowest = lowestPoint && pt.vc === lowestPoint.vc;
      const isCur = currentPoint && pt.vc === currentPoint.vc;

      return (
        <div className="bg-[#090e1a]/95 border border-amber-500/60 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1.5 mb-2">
            <span className="text-amber-400 font-bold">Cutting Speed (vc):</span>
            <span className="text-white font-extrabold text-sm">{pt.vc} m/min</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">MRR (Productivity):</span>
              <span className="text-cyan-300 font-bold">{pt.mrr} cm³/min</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Tool Cost / Part:</span>
              <span className="text-emerald-400 font-extrabold">${pt.toolCostPerPart.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Total Part Cost:</span>
              <span className="text-amber-300 font-semibold">${pt.totalCostPerPart.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Taylor Tool Life (T):</span>
              <span className="text-slate-200">{pt.toolLife} min</span>
            </div>

            {isLowest && (
              <div className="mt-2 text-center py-1 bg-amber-500/20 text-amber-300 font-bold rounded-lg border border-amber-500/50">
                ★ GLOBAL MINIMUM COST SWEET SPOT
              </div>
            )}
            {isCur && !isLowest && (
              <div className="mt-2 text-center py-1 bg-cyan-500/20 text-cyan-300 font-bold rounded-lg border border-cyan-500/50">
                ▲ CURRENT OPERATING SETTING
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const chartKey = costMode === 'tool' ? 'toolCostPerPart' : 'totalCostPerPart';

  return (
    <div className="w-full space-y-4">
      {/* Visualizer Top Bar & Prominent Recommended Optimal Setting Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-amber-950/40 via-[#0b101c] to-emerald-950/30 p-3.5 rounded-2xl border border-amber-500/40 shadow-lg">
        {/* Recommended Optimal Setting Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider font-mono">
                Recommended Optimal Setting
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Lowest Point on Cost Curve
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1 font-mono">
              <span className="text-xl sm:text-2xl font-black text-white">
                {lowestPoint?.vc || currentVc} <span className="text-xs font-normal text-slate-400">m/min</span>
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-cyan-300 font-bold text-sm">
                MRR: {lowestPoint?.mrr || currentMrr} cm³/min
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-emerald-400 font-bold text-sm">
                ${costMode === 'tool' ? lowestPoint?.toolCostPerPart : lowestPoint?.totalCostPerPart}/part
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Metric Mode Toggle */}
        <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end font-mono text-xs">
          {/* Y-axis metric toggle: Tool Cost vs Total Cost */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setCostMode('tool')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                costMode === 'tool'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tool Cost / Part
            </button>
            <button
              onClick={() => setCostMode('total')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                costMode === 'total'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Total Cost
            </button>
          </div>

          {/* Apply button */}
          {lowestPoint && (
            <button
              onClick={() => onApplyOptimal(lowestPoint.vc)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Setting
            </button>
          )}
        </div>
      </div>

      {/* Main Recharts Scatter Plot */}
      <div className="h-80 w-full bg-[#070b14] rounded-2xl p-3 border border-slate-800 shadow-inner relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 5, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#172033" vertical={false} />

            <XAxis
              dataKey="mrr"
              type="number"
              stroke="#64748b"
              fontSize={11}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickLine={false}
              label={{
                value: 'Material Removal Rate MRR (cm³/min) • Productivity',
                position: 'insideBottom',
                offset: -4,
                fill: '#64748b',
                fontSize: 11,
              }}
            />

            <YAxis
              dataKey={chartKey}
              type="number"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `$${val}`}
              domain={['dataMin * 0.9', 'dataMax * 1.05']}
              label={{
                value: costMode === 'tool' ? 'Tool Cost Per Part ($ / part)' : 'Total Cost Per Part ($ / part)',
                angle: -90,
                position: 'insideLeft',
                offset: 15,
                fill: '#64748b',
                fontSize: 11,
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Smooth interpolation line representing the economic curve */}
            <Line
              type="monotone"
              dataKey={chartKey}
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
            />

            {/* Optimal Sweet Spot Lowest Point Reference Line */}
            {lowestPoint && (
              <ReferenceLine
                x={lowestPoint.mrr}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `OPTIMAL MRR: ${lowestPoint.mrr}`,
                  position: 'insideTopLeft',
                  fill: '#34d399',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
            )}

            {/* Current Operating Setting Reference Line */}
            {currentPoint && currentPoint.vc !== lowestPoint?.vc && (
              <ReferenceLine
                x={currentPoint.mrr}
                stroke="#06b6d4"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `CURRENT: ${currentPoint.mrr}`,
                  position: 'insideTopRight',
                  fill: '#22d3ee',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
            )}

            {/* Glowing Reference Dot for Lowest Point */}
            {lowestPoint && (
              <ReferenceDot
                x={lowestPoint.mrr}
                y={lowestPoint[chartKey]}
                r={9}
                fill="#fbbf24"
                stroke="#ffffff"
                strokeWidth={2.5}
                className="drop-shadow-[0_0_15px_rgba(251,191,36,1)]"
              />
            )}

            {/* Glowing Reference Dot for Current Operating Point */}
            {currentPoint && currentPoint.vc !== lowestPoint?.vc && (
              <ReferenceDot
                x={currentPoint.mrr}
                y={currentPoint[chartKey]}
                r={6}
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth={2}
                className="drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]"
              />
            )}

            {/* Scatter points for all discrete velocity iterations */}
            <Scatter data={data}>
              {data.map((entry, index) => {
                const isOpt = lowestPoint && entry.vc === lowestPoint.vc;
                const isCur = currentPoint && entry.vc === currentPoint.vc;
                return (
                  <Cell
                    key={`sweet-cell-${index}`}
                    fill={isOpt ? '#fbbf24' : isCur ? '#06b6d4' : '#f59e0b'}
                    stroke={isOpt ? '#ffffff' : isCur ? '#ffffff' : '#78350f'}
                    strokeWidth={isOpt ? 2.5 : isCur ? 2 : 1}
                    r={isOpt ? 8 : isCur ? 6 : 4}
                  />
                );
              })}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Engineering Insights & Economic Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {/* Card 1: Economic Sweet Spot Summary */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400">MINIMUM TOOL COST</div>
              <div className="font-bold text-emerald-300 text-sm">
                ${lowestPoint?.toolCostPerPart.toFixed(2)} / part
              </div>
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            LOWEST
          </span>
        </div>

        {/* Card 2: Productivity at Minimum */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400">SWEET SPOT SPEED (vc)</div>
              <div className="font-bold text-cyan-300 text-sm">
                {lowestPoint?.vc} m/min ({lowestPoint?.mrr} cm³/min)
              </div>
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
            BALANCED
          </span>
        </div>

        {/* Card 3: Potential Cost Savings vs Current Setting */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">SAVINGS VS CURRENT</div>
              <div className="font-bold text-amber-300 text-sm">
                {potentialSavings > 0 ? `Save $${potentialSavings.toFixed(2)}/part` : 'Running at Optimal!'}
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              potentialSavings > 0
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {potentialSavings > 0 ? 'OPPORTUNITY' : 'OPTIMAL'}
          </span>
        </div>
      </div>
    </div>
  );
};
