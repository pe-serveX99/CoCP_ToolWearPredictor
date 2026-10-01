'use client';

import React, { useState } from 'react';
import { NavigationHeader } from '../components/NavigationHeader';
import { OptimizationDashboard } from '../components/OptimizationDashboard';
import { CncDataProvider, useCncData } from '../context/CncDataContext';
import {
  Wrench,
  Cpu,
  Layers,
  Sparkles,
  Search,
  SlidersHorizontal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'catalog' | 'floor'>('calculator');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'carbide' | 'ceramic' | 'insert' | 'hss'>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { machines, tools, materials, activeOperations, isLive, error, refreshData } = useCncData();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredTools = tools.filter((t) => {
    const matchesFilter = catalogFilter === 'all' || t.material === catalogFilter;
    const matchesSearch =
      t.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      t.coating.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070b14] bg-grid-pattern text-slate-100 flex flex-col font-sans">
      {/* Top Telemetry & Navigation Bar */}
      <NavigationHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Supabase Connection Status Banner */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-mono transition-all ${
            isLive
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Database className={`w-4 h-4 ${isLive ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              {isLive ? (
                <span>
                  <strong className="text-emerald-300 font-bold">Supabase PostgreSQL Connected:</strong> Serving {machines.length} machines, {tools.length} cutting tools, {materials.length} alloys, and {activeOperations.length} active jobs from live database.
                </span>
              ) : (
                <span>
                  <strong className="text-amber-300 font-bold">Supabase Standby:</strong> Connected to endpoint. Run the schema migration in your Supabase SQL Editor and execute <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300">pnpm seed</code> to sync live tables.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLive && (
              <a
                href="https://supabase.com/dashboard/project/norumfnvgxfniofyxtoj/sql/new"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-bold transition-colors"
              >
                SQL Editor <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Subheader / Mode Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                PHASE 1: ACTIVE
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                {activeTab === 'calculator' && 'CNC Parameter Optimization & Tool Wear Dashboard'}
                {activeTab === 'catalog' && 'Master Tool & Machine Library (Catalog)'}
                {activeTab === 'floor' && 'Active Operations Real-Time Shop Floor Monitor'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {activeTab === 'calculator' &&
                "Calculates Taylor Extended Tool Life (T) & Volumetric MRR with dynamic 3-phase Flank Wear Recharts visualization."}
              {activeTab === 'catalog' &&
                `Master catalog of ${tools.length} cutting tools, ${machines.length} multi-axis CNC machines, and ${materials.length} workpiece materials with engineering Taylor constants.`}
              {activeTab === 'floor' &&
                `Simulated telemetry tracking ${activeOperations.length} active shop-floor cutting operations with wear percentage and cycle times.`}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Physics Core:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-bold">
              Taylor v_c · T^n = C
            </span>
          </div>
        </div>

        {/* Tab 1: Parameter Optimization Dashboard (Primary User Focus) */}
        {activeTab === 'calculator' && <OptimizationDashboard />}

        {/* Tab 2: Master Tool & Machine Library */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="cnc-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tool by name, coating, or category..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                {(['all', 'carbide', 'ceramic', 'insert', 'hss'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCatalogFilter(filter)}
                    className={`px-3 py-1 rounded-lg uppercase text-[11px] font-bold transition-all ${
                      catalogFilter === filter
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((t) => (
                <div
                  key={t.id}
                  className="cnc-panel rounded-xl p-4 space-y-3 hover:border-cyan-500/60 transition-all font-mono text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold uppercase">
                        {t.id} • {t.category}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm mt-1">{t.name}</h3>
                    </div>
                    <span className="text-amber-300 font-bold text-sm">${t.cost?.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <div>Diameter: <strong className="text-slate-200">Ø{t.diameter} mm</strong></div>
                    <div>Flutes: <strong className="text-slate-200">{t.flute_count} Flutes</strong></div>
                    <div>Taylor Exponent n: <strong className="text-amber-300 font-bold">{t.taylor_n_value}</strong></div>
                    <div>Max ap: <strong className="text-slate-200">{t.max_depth_of_cut} mm</strong></div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800/80 text-[11px] text-slate-300">
                    <span className="text-slate-400">Recommended Speed:</span> {t.recommended_vc_min} - {t.recommended_vc_max} m/min
                  </div>
                </div>
              ))}
            </div>

            {/* Machines Overview */}
            <div className="mt-8 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" /> Connected Machine Centers ({machines.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {machines.map((m) => (
                  <div key={m.id} className="cnc-panel rounded-xl p-4 space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-100">{m.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {m.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div>Max Spindle: <strong className="text-cyan-300">{m.max_rpm?.toLocaleString() || 0} RPM</strong></div>
                      <div>Spindle Power: <strong className="text-emerald-300">{m.max_spindle_power} kW</strong></div>
                      <div>Taper: <strong className="text-slate-200">{m.spindle_taper}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Floor Operations Monitor Preview */}
        {activeTab === 'floor' && (
          <div className="space-y-4">
            <div className="cnc-panel rounded-2xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200 flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-emerald-400" /> Real-time Shop Floor Active Cuts ({activeOperations.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOperations.map((op) => (
                  <div key={op.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 font-mono text-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{op.job_name}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase text-[10px] font-bold">
                        {op.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-2">
                      <div>Part No: <span className="text-slate-200">{op.part_number}</span></div>
                      <div>Elapsed Cut: <span className="text-slate-200">{op.time_in_cut} min</span></div>
                      <div>Cutting Speed: <span className="text-cyan-300">{op.active_vc} m/min</span></div>
                      <div>Feed: <span className="text-cyan-300">{op.active_f} mm/tooth</span></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Flank Wear (VB): {op.current_flank_wear_vb} mm</span>
                        <span className="text-amber-400 font-bold">{op.current_wear_percentage}% Life Used</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-500"
                          style={{ width: `${op.current_wear_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-900 bg-[#060910] py-6 px-4 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-400">CNC OptiTool Platform</span>
            <span>•</span>
            <span>ISO 3685 Standard Flank Wear Evaluation</span>
            <span>•</span>
            <span>Taylor Tool Life Physics Engine</span>
            <span>•</span>
            <span>Supabase PostgreSQL Backend</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Designed for 5-axis Machining Centers, Lathes, and Mill-Turn Multi-Tasking Systems
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <CncDataProvider>
      <DashboardContent />
    </CncDataProvider>
  );
}
