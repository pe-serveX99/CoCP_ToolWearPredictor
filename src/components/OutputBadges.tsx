'use client';

import React from 'react';
import { PhysicsCalculationResult } from '../types/cnc';
import { Gauge, Clock, Zap, DollarSign, Activity, AlertOctagon, ShieldCheck, AlertTriangle } from 'lucide-react';

interface OutputBadgesProps {
  results: PhysicsCalculationResult;
}

export const OutputBadges: React.FC<OutputBadgesProps> = ({ results }) => {
  const {
    mrr,
    mrrMm3,
    toolLifeMinutes,
    spindleRpm,
    tableFeedVf,
    cuttingPowerKw,
    spindleLoadPercent,
    isRpmExceeded,
    isPowerExceeded,
    rpmLimit,
    powerLimit,
    costPerPart,
    machiningCost,
    toolingCost,
  } = results;

  // 1. Tool Life Color Status (Green > 45min, Yellow 18-45min, Red < 18min)
  const toolLifeStatus =
    toolLifeMinutes >= 45 ? 'safe' : toolLifeMinutes >= 18 ? 'warning' : 'critical';

  // 2. Spindle Load Color Status (Green < 75%, Yellow 75-90%, Red > 90% or exceeded)
  const spindleLoadStatus =
    isPowerExceeded || isRpmExceeded || spindleLoadPercent >= 90
      ? 'critical'
      : spindleLoadPercent >= 75
      ? 'warning'
      : 'safe';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Material Removal Rate (MRR) */}
      <div className="bg-gradient-to-br from-[#0c1a2d] via-[#091120] to-[#042f49] border border-cyan-500/50 rounded-2xl p-5 shadow-[0_8px_30px_rgba(6,182,212,0.15)] relative overflow-hidden group hover:border-cyan-400 transition-all flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-cyan-400">
              <Activity className="w-4 h-4" /> Material Removal Rate (MRR)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
              SPEED
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
              {mrr}
            </span>
            <span className="text-sm font-mono font-bold text-cyan-400">cm³/min</span>
          </div>
        </div>

        <div className="mt-4 text-xs font-mono text-slate-300 flex items-center justify-between border-t border-cyan-900/40 pt-2.5">
          <span className="text-slate-400">Volumetric Rate:</span>
          <span className="text-cyan-300 font-bold">{mrrMm3.toLocaleString()} mm³/min</span>
        </div>
      </div>

      {/* 2. Projected Tool Life (Taylor T) - Green/Yellow/Red */}
      <div
        className={`rounded-2xl p-5 border shadow-lg relative overflow-hidden flex flex-col justify-between transition-all ${
          toolLifeStatus === 'safe'
            ? 'bg-gradient-to-br from-[#062c1d] via-[#071714] to-[#064e3b] border-emerald-500/60 shadow-[0_8px_30px_rgba(16,185,129,0.2)]'
            : toolLifeStatus === 'warning'
            ? 'bg-gradient-to-br from-[#2f1f05] via-[#141208] to-[#78350f] border-amber-500/70 shadow-[0_8px_30px_rgba(245,158,11,0.2)]'
            : 'bg-gradient-to-br from-[#380b0b] via-[#1a0808] to-[#7f1d1d] border-red-500/80 shadow-[0_8px_30px_rgba(239,68,68,0.3)] animate-pulse'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span
              className={`flex items-center gap-1.5 uppercase font-bold tracking-wider ${
                toolLifeStatus === 'safe'
                  ? 'text-emerald-400'
                  : toolLifeStatus === 'warning'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              <Clock className="w-4 h-4" /> Projected Tool Life (T)
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                toolLifeStatus === 'safe'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : toolLifeStatus === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-red-500/30 text-red-200 border-red-500/50'
              }`}
            >
              {toolLifeStatus === 'safe' ? '● SAFE' : toolLifeStatus === 'warning' ? '▲ CAUTION' : '■ CRITICAL'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight ${
                toolLifeStatus === 'safe'
                  ? 'text-emerald-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.7)]'
                  : toolLifeStatus === 'warning'
                  ? 'text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.7)]'
                  : 'text-red-300 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]'
              }`}
            >
              {toolLifeMinutes.toFixed(1)}
            </span>
            <span className="text-sm font-mono font-bold text-slate-300">minutes</span>
          </div>
        </div>

        <div className="mt-4 text-xs font-mono text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <span className="text-slate-400">Wear Limit:</span>
          <span className="font-bold text-slate-200">ISO 3685 (VB = 0.30mm)</span>
        </div>
      </div>

      {/* 3. Spindle Kinematics & Power / Spindle Load - Green/Yellow/Red */}
      <div
        className={`rounded-2xl p-5 border shadow-lg relative overflow-hidden flex flex-col justify-between transition-all ${
          spindleLoadStatus === 'critical'
            ? 'bg-gradient-to-br from-[#3b0808] via-[#160a0a] to-[#7f1d1d] border-red-500/80 shadow-[0_8px_30px_rgba(239,68,68,0.25)]'
            : spindleLoadStatus === 'warning'
            ? 'bg-gradient-to-br from-[#2a1a06] via-[#141007] to-[#5a2a07] border-amber-500/60 shadow-[0_8px_30px_rgba(245,158,11,0.15)]'
            : 'bg-gradient-to-br from-[#0c182b] via-[#09101c] to-[#1e1b4b] border-blue-500/40 shadow-[0_8px_30px_rgba(59,130,246,0.15)]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-slate-200">
              <Gauge className="w-4 h-4 text-blue-400" /> Spindle Kinematics
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                spindleLoadStatus === 'critical'
                  ? 'bg-red-500/30 text-red-200 border-red-500/50'
                  : spindleLoadStatus === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {spindleLoadPercent}% LOAD
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight ${
                isRpmExceeded ? 'text-red-400' : 'text-white'
              }`}
            >
              {spindleRpm.toLocaleString()}
            </span>
            <span className="text-sm font-mono font-bold text-blue-400">RPM</span>
          </div>
        </div>

        <div className="mt-4 text-xs font-mono text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <span className="text-slate-400">Power & Table Feed:</span>
          <span className="font-bold text-slate-200">
            {cuttingPowerKw} kW • {tableFeedVf.toLocaleString()} mm/min
          </span>
        </div>
      </div>

      {/* 4. Total Cost per Part (Gilbert Economic Model) */}
      <div className="bg-gradient-to-br from-[#241705] via-[#100d08] to-[#451a03] border border-amber-500/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(245,158,11,0.15)] relative overflow-hidden group hover:border-amber-400 transition-all flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-amber-400">
              <DollarSign className="w-4 h-4" /> Cost / Part
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
              ECONOMIC
            </span>
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              ${costPerPart.toFixed(2)}
            </span>
            <span className="text-sm font-mono font-bold text-slate-400 ml-1">USD</span>
          </div>
        </div>

        <div className="mt-4 text-xs font-mono text-slate-300 flex items-center justify-between border-t border-amber-900/40 pt-2.5">
          <span className="text-slate-400">Machine Time: <strong className="text-slate-200">${machiningCost}</strong></span>
          <span className="text-slate-400">Tool Wear: <strong className="text-slate-200">${toolingCost}</strong></span>
        </div>
      </div>
    </div>
  );
};
