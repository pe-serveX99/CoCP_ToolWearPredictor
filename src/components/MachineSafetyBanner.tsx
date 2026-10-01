'use client';

import React from 'react';
import { Machine, PhysicsCalculationResult, Tool } from '../types/cnc';
import { AlertTriangle, ShieldCheck, Zap, AlertOctagon } from 'lucide-react';

interface MachineSafetyBannerProps {
  machine: Machine;
  tool: Tool;
  results: PhysicsCalculationResult;
}

export const MachineSafetyBanner: React.FC<MachineSafetyBannerProps> = ({
  machine,
  tool,
  results,
}) => {
  const { isRpmExceeded, isPowerExceeded, spindleRpm, cuttingPowerKw, spindleLoadPercent } = results;

  const hasIssues = isRpmExceeded || isPowerExceeded;

  return (
    <div
      className={`w-full rounded-xl border p-3.5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono ${
        hasIssues
          ? 'bg-red-950/40 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
          : spindleLoadPercent > 85
          ? 'bg-amber-950/40 border-amber-500/70'
          : 'bg-emerald-950/30 border-emerald-500/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            hasIssues
              ? 'bg-red-500/20 text-red-400'
              : spindleLoadPercent > 85
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {hasIssues ? (
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          ) : (
            <ShieldCheck className="w-5 h-5" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider uppercase text-slate-100">
              {hasIssues
                ? 'MACHINE SAFETY LIMIT VIOLATION'
                : spindleLoadPercent > 85
                ? 'HIGH SPINDLE LOAD WARNING'
                : 'PHYSICAL LIMITS WITHIN SAFE SPECIFICATION'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {machine.name}
            </span>
          </div>

          <div className="text-slate-400 mt-0.5">
            {isRpmExceeded ? (
              <span className="text-red-300 font-semibold">
                Spindle Speed ({spindleRpm.toLocaleString()} RPM) exceeds machine max limit ({machine.max_rpm.toLocaleString()} RPM)! Risk of bearing seizure or tool failure.
              </span>
            ) : isPowerExceeded ? (
              <span className="text-red-300 font-semibold">
                Cutting power requirement ({cuttingPowerKw} kW) exceeds motor rating ({machine.max_spindle_power} kW)!
              </span>
            ) : (
              <span>
                Operating spindle speed is safe. Spindle power demand: <strong>{cuttingPowerKw} kW</strong> ({spindleLoadPercent}% of {machine.max_spindle_power} kW limit).
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spindle Load Progress Meter */}
      <div className="flex items-center gap-3 flex-shrink-0 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
        <div className="w-full">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Spindle Load
            </span>
            <span
              className={`font-bold ${
                isPowerExceeded ? 'text-red-400' : spindleLoadPercent > 85 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {spindleLoadPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                isPowerExceeded
                  ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                  : spindleLoadPercent > 85
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, spindleLoadPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
