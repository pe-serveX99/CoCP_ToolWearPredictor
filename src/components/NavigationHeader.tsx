import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Cpu,
  Layers,
  Wrench,
  Clock,
  Radio,
  Sliders,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useCncData } from '../context/CncDataContext';

interface NavigationHeaderProps {
  activeTab: 'calculator' | 'catalog' | 'floor';
  onTabChange: (tab: 'calculator' | 'catalog' | 'floor') => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const { machines, isLive, isLoading, refreshData } = useCncData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-800/80 bg-[#090e1a]/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-[#080d18] rounded-[10px] flex items-center justify-center">
                <Sliders className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg tracking-wider text-slate-100 uppercase">
                  CNC <span className="text-cyan-400">OptiTool</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  v2.4 PRO
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 tracking-wide">
                Tool Wear Analytics & Parameter Optimization Platform
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 font-mono text-xs">
            <button
              onClick={() => onTabChange('calculator')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Optimization Calculator
            </button>
            <button
              onClick={() => onTabChange('catalog')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Tool & Machine Library
            </button>
            <button
              onClick={() => onTabChange('floor')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'floor'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Active Operations
            </button>
          </nav>

          {/* Right Status Indicators */}
          <div className="flex items-center gap-3 font-mono text-xs">
            {/* Supabase PostgreSQL Status Pill */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                isLive
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
              }`}
              title={
                isLive
                  ? 'Connected to live Supabase PostgreSQL tables'
                  : 'Connected to Supabase endpoint (awaiting table migration / seed)'
              }
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {isLive ? 'SUPABASE: LIVE' : 'SUPABASE: STANDBY'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isLive
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="hover:text-white transition-transform active:rotate-180 p-0.5"
                title="Sync with Supabase"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRefreshing || isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`}
                />
              </button>
            </div>

            {/* Telemetry pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
              <span className="text-[11px] text-slate-400">MACHINES:</span>
              <span className="text-[11px] font-bold text-cyan-300">{machines.length} ONLINE</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-200 font-semibold">{timeStr || 'LIVE'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
