'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  MOCK_MACHINES,
  MOCK_TOOLS,
  MOCK_MATERIALS,
} from '../data/mock-cnc';
import { useCncData } from '../context/CncDataContext';
import {
  computeMachiningPhysics,
  generateSweetSpotCurve,
} from '../lib/physics';
import { ParameterSlider } from './ParameterSlider';
import { OutputBadges } from './OutputBadges';
import { WearCurveChart } from './WearCurveChart';
import { SweetSpotVisualizer } from './SweetSpotVisualizer';
import { MachineSafetyBanner } from './MachineSafetyBanner';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import {
  Cpu,
  Layers,
  Wrench,
  Sparkles,
  SlidersHorizontal,
  BookmarkCheck,
  TrendingUp,
  Activity,
  FileCode2,
  Settings,
  Shield,
  Clock,
  Compass,
  Zap,
  Database,
  RefreshCw,
} from 'lucide-react';

export const OptimizationDashboard: React.FC = () => {
  const { machines, tools, materials, isLive, refreshData } = useCncData();

  // 1. Core Selection State
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  // Active instances with fallbacks
  const currentMachineId = selectedMachineId || machines[0]?.id || MOCK_MACHINES[0].id;
  const currentToolId = selectedToolId || tools[0]?.id || MOCK_TOOLS[0].id;
  const currentMaterialId = selectedMaterialId || materials[0]?.id || MOCK_MATERIALS[0].id;

  const machine = useMemo(
    () => machines.find((m) => m.id === currentMachineId) || machines[0] || MOCK_MACHINES[0],
    [machines, currentMachineId]
  );
  const tool = useMemo(
    () => tools.find((t) => t.id === currentToolId) || tools[0] || MOCK_TOOLS[0],
    [tools, currentToolId]
  );
  const material = useMemo(
    () => materials.find((m) => m.id === currentMaterialId) || materials[0] || MOCK_MATERIALS[0],
    [materials, currentMaterialId]
  );

  // 2. Interactive Parameter Sliders State
  const defaultVc = Math.round((tool.recommended_vc_min + tool.recommended_vc_max) / 2);
  const defaultF = Number(((tool.recommended_feed_min + tool.recommended_feed_max) / 2).toFixed(3));
  const defaultAp = Number((tool.max_depth_of_cut * 0.5).toFixed(1));
  const defaultAe = Number((tool.diameter * 0.5).toFixed(1));

  const [vc, setVc] = useState<number>(defaultVc);
  const [feed, setFeed] = useState<number>(defaultF);
  const [ap, setAp] = useState<number>(defaultAp);
  const [ae, setAe] = useState<number>(defaultAe);

  // Sync parameters when tool changes
  useEffect(() => {
    const recVc = Math.round((tool.recommended_vc_min + tool.recommended_vc_max) / 2);
    const recF = Number(((tool.recommended_feed_min + tool.recommended_feed_max) / 2).toFixed(3));
    const recAp = Number((tool.max_depth_of_cut * 0.5).toFixed(1));
    const recAe = Number((tool.diameter * 0.5).toFixed(1));
    setVc(recVc);
    setFeed(recF);
    setAp(recAp);
    setAe(recAe);
  }, [tool.id]);

  // Current time in cut state for glowing marker
  const [currentTimeInCut, setCurrentTimeInCut] = useState<number>(15.0);

  // Active tab in chart area: wear_curve, sweet_spot, or dual view
  const [chartView, setChartView] = useState<'wear_curve' | 'sweet_spot' | 'dual'>('wear_curve');
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // Update parameters when tool changes via selection
  const handleToolChange = (newToolId: string) => {
    setSelectedToolId(newToolId);
    const newTool = tools.find((t) => t.id === newToolId) || tools[0] || MOCK_TOOLS[0];
    const recVc = Math.round((newTool.recommended_vc_min + newTool.recommended_vc_max) / 2);
    const recF = Number(((newTool.recommended_feed_min + newTool.recommended_feed_max) / 2).toFixed(3));
    const recAp = Number((newTool.max_depth_of_cut * 0.5).toFixed(1));
    const recAe = Number((newTool.diameter * 0.5).toFixed(1));
    setVc(recVc);
    setFeed(recF);
    setAp(recAp);
    setAe(recAe);
  };

  // 3. Compute Physics
  const physicsResults = useMemo(() => {
    return computeMachiningPhysics(vc, feed, ap, machine, tool, material, ae);
  }, [vc, feed, ap, machine, tool, material, ae]);

  // Adjust simulated time in cut if tool life is smaller
  useMemo(() => {
    if (currentTimeInCut > physicsResults.toolLifeMinutes * 1.15) {
      setCurrentTimeInCut(Math.max(1, Number((physicsResults.toolLifeMinutes * 0.5).toFixed(1))));
    }
  }, [physicsResults.toolLifeMinutes]);

  // 4. Compute Sweet Spot Sweep
  const sweetSpotCurveData = useMemo(() => {
    return generateSweetSpotCurve(
      feed,
      ap,
      machine,
      tool,
      material,
      physicsResults.sweetSpot.recommendedVc,
      ae,
      vc
    );
  }, [feed, ap, machine, tool, material, physicsResults.sweetSpot.recommendedVc, ae, vc]);

  // Presets Handlers
  const applyPreset = (type: 'balanced' | 'roughing' | 'finishing' | 'sweet_spot') => {
    if (type === 'sweet_spot') {
      setVc(physicsResults.sweetSpot.recommendedVc);
    } else if (type === 'roughing') {
      setVc(Math.round(tool.recommended_vc_min * 1.1));
      setFeed(Number(tool.recommended_feed_max.toFixed(3)));
      setAp(Number(tool.max_depth_of_cut.toFixed(1)));
    } else if (type === 'finishing') {
      setVc(Math.round(tool.recommended_vc_max * 0.95));
      setFeed(Number(tool.recommended_feed_min.toFixed(3)));
      setAp(Number((tool.max_depth_of_cut * 0.25).toFixed(1)));
    } else {
      setVc(Math.round((tool.recommended_vc_min + tool.recommended_vc_max) / 2));
      setFeed(Number(((tool.recommended_feed_min + tool.recommended_feed_max) / 2).toFixed(3)));
      setAp(Number((tool.max_depth_of_cut * 0.5).toFixed(1)));
    }
  };

  // Prepare searchable options for machines (50 items)
  const machineOptions: SelectOption[] = useMemo(() => {
    return machines.map((m) => ({
      id: m.id,
      title: m.name,
      subtitle: `${m.max_rpm?.toLocaleString() || 0} RPM • ${m.max_spindle_power} kW • ${m.spindle_taper || 'Spindle'}`,
      badge: m.type,
      badgeColor: m.type.includes('5-axis') ? 'blue' : 'cyan',
      category: m.type,
      details: m.location,
    }));
  }, [machines]);

  // Prepare searchable options for tools (150 items)
  const toolOptions: SelectOption[] = useMemo(() => {
    return tools.map((t) => ({
      id: t.id,
      title: t.name,
      subtitle: `Ø${t.diameter}mm • ${t.flute_count}F • ${t.coating} • $${t.cost}`,
      badge: `n=${t.taylor_n_value}`,
      badgeColor: t.material === 'ceramic' ? 'amber' : t.material === 'cbn' ? 'purple' : 'emerald',
      category: t.category,
      details: `Rec Vc: ${t.recommended_vc_min}-${t.recommended_vc_max} m/min • Max ap: ${t.max_depth_of_cut}mm`,
    }));
  }, [tools]);

  // Prepare searchable options for materials (25 items)
  const materialOptions: SelectOption[] = useMemo(() => {
    return materials.map((mat) => ({
      id: mat.id,
      title: mat.material_name,
      subtitle: `${mat.hardness_brinell} HB • ${mat.machinability_rating}% Machinability • C=${mat.taylor_c_value} m/min`,
      badge: `C=${mat.taylor_c_value}`,
      badgeColor: mat.category.includes('Titanium') ? 'cyan' : mat.category.includes('Nickel') ? 'amber' : 'emerald',
      category: mat.category,
      details: mat.description,
    }));
  }, [materials]);

  return (
    <div className="w-full">
      {/* 2-Column Responsive Layout: Left Sticky Sidebar + Expanded Center Canvas */}
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
        {/* ============================================================ */}
        {/* LEFT COLUMN: STICKY SETUP CONFIGURATION SIDEBAR (340px) */}
        {/* ============================================================ */}
        <aside className="w-full lg:w-84 xl:w-96 flex-shrink-0 lg:sticky lg:top-20 space-y-4">
          <div className="cnc-panel rounded-2xl p-5 shadow-2xl border border-cyan-500/30 space-y-5 bg-[#090e1a]/95 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-cyan-400 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Setup Configuration
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className={isLive ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                  {isLive ? 'SUPABASE' : 'STANDBY'}
                </span>
              </div>
            </div>

            {/* 1. Machine Searchable Select (50 Machines) */}
            <div className="space-y-1">
              <SearchableSelect
                label="Target CNC Machine"
                icon={<Cpu className="w-3.5 h-3.5 text-blue-400" />}
                options={machineOptions}
                selectedId={currentMachineId}
                onSelect={(id) => setSelectedMachineId(id)}
                placeholder="Search Haas, DMG, Mazak, Hermle..."
                filterCategories={['5-axis', '5-axis Mill-Turn', '3-axis VMC', '3-axis lathe']}
              />
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Spindle:</span>
                  <span className="text-cyan-300 font-bold">{machine.max_rpm.toLocaleString()} RPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Spindle Power:</span>
                  <span className="text-emerald-400 font-bold">{machine.max_spindle_power} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-300">{machine.location}</span>
                </div>
              </div>
            </div>

            {/* 2. Tool Searchable Select (150 Tools) */}
            <div className="space-y-1">
              <SearchableSelect
                label="Cutting Tool"
                icon={<Wrench className="w-3.5 h-3.5 text-cyan-400" />}
                options={toolOptions}
                selectedId={currentToolId}
                onSelect={handleToolChange}
                placeholder="Search diameter, flute, coating..."
                filterCategories={['end mill', 'face mill', 'insert', 'ball nose', 'drill']}
              />
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Taylor Exponent (n):</span>
                  <span className="text-amber-300 font-extrabold">{tool.taylor_n_value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Geometry:</span>
                  <span className="text-slate-200">Ø{tool.diameter}mm • {tool.flute_count} Flutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Tool Cost:</span>
                  <span className="text-amber-400 font-bold">${tool.cost?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 3. Workpiece Material Searchable Select (25 Materials) */}
            <div className="space-y-1">
              <SearchableSelect
                label="Workpiece Material"
                icon={<Layers className="w-3.5 h-3.5 text-amber-400" />}
                options={materialOptions}
                selectedId={currentMaterialId}
                onSelect={(id) => setSelectedMaterialId(id)}
                placeholder="Search Titanium, Inconel, 6061..."
                filterCategories={[
                  'Titanium Alloy',
                  'Aluminum Alloy',
                  'Alloy Steel',
                  'Stainless Steel',
                  'Nickel Superalloy',
                ]}
              />
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Taylor Constant (C):</span>
                  <span className="text-amber-300 font-extrabold">{material.taylor_c_value} m/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hardness / Machinability:</span>
                  <span className="text-slate-200">{material.hardness_brinell} HB ({material.machinability_rating}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cutting Resistance (kc1):</span>
                  <span className="text-cyan-300 font-bold">{material.specific_cutting_force_kc1} N/mm²</span>
                </div>
              </div>
            </div>

            {/* Quick Physics Modal Trigger */}
            <button
              onClick={() => setShowFormulaModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              View Physics Derivations
            </button>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER / RIGHT CANVAS: EXPANDED DETAILED RECHARTS & CONTROLS */}
        {/* ============================================================ */}
        <section className="flex-1 w-full min-w-0 space-y-5">
          {/* Top Machine Limit Banner */}
          <MachineSafetyBanner machine={machine} tool={tool} results={physicsResults} />

          {/* Primary High-Contrast Telemetry Badges with Rich Subtle Gradients */}
          <OutputBadges results={physicsResults} />

          {/* Main Visualizer Area: Recharts Tool Wear Curve or Sweet Spot */}
          <div className="cnc-panel rounded-2xl p-5 shadow-2xl relative border border-slate-800/80">
            {/* Visualizer Header with Tab Selection & Presets */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setChartView('wear_curve')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                    chartView === 'wear_curve'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Tool Wear Curve
                </button>
                <button
                  onClick={() => setChartView('sweet_spot')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                    chartView === 'sweet_spot'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Sweet Spot Visualizer
                </button>
                <button
                  onClick={() => setChartView('dual')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                    chartView === 'dual'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Dual Analysis
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-500 text-[11px] hidden sm:inline">Presets:</span>
                <button
                  onClick={() => applyPreset('finishing')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Finishing
                </button>
                <button
                  onClick={() => applyPreset('balanced')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Balanced
                </button>
                <button
                  onClick={() => applyPreset('roughing')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Roughing
                </button>
                <button
                  onClick={() => applyPreset('sweet_spot')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" /> Optimal
                </button>
              </div>
            </div>

            {/* Render Active Detailed Recharts Graph */}
            {chartView === 'wear_curve' && (
              <WearCurveChart
                data={physicsResults.wearCurve}
                toolLifeMinutes={physicsResults.toolLifeMinutes}
                currentTimeInCut={currentTimeInCut}
                onCurrentTimeChange={setCurrentTimeInCut}
                toolName={tool.name}
              />
            )}
            {chartView === 'sweet_spot' && (
              <SweetSpotVisualizer
                data={sweetSpotCurveData}
                currentVc={vc}
                currentMrr={physicsResults.mrr}
                onApplyOptimal={(bestVc) => setVc(bestVc)}
                machineName={machine.name}
                toolName={tool.name}
                materialName={material.material_name}
              />
            )}
            {chartView === 'dual' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="border border-slate-800/80 rounded-2xl p-3 bg-[#070b14]/70">
                  <WearCurveChart
                    data={physicsResults.wearCurve}
                    toolLifeMinutes={physicsResults.toolLifeMinutes}
                    currentTimeInCut={currentTimeInCut}
                    onCurrentTimeChange={setCurrentTimeInCut}
                    toolName={tool.name}
                  />
                </div>
                <div className="border border-slate-800/80 rounded-2xl p-3 bg-[#070b14]/70">
                  <SweetSpotVisualizer
                    data={sweetSpotCurveData}
                    currentVc={vc}
                    currentMrr={physicsResults.mrr}
                    onApplyOptimal={(bestVc) => setVc(bestVc)}
                    machineName={machine.name}
                    toolName={tool.name}
                    materialName={material.material_name}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Sliders: 2x2 Grid for Precision Parameter Tuning */}
          <div className="cnc-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-slate-200 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Cutting Parameter Controls (Live Sliders)
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                Adjust sliders to dynamically recompute Taylor Life & MRR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Slider 1: Cutting Speed (v_c) */}
              <ParameterSlider
                label="Cutting Speed"
                symbol="vc"
                value={vc}
                min={Math.max(10, Math.round(tool.recommended_vc_min * 0.4))}
                max={Math.round(tool.recommended_vc_max * 1.8)}
                step={1}
                unit="m/min"
                recommendedMin={tool.recommended_vc_min}
                recommendedMax={tool.recommended_vc_max}
                description="Governs cutting edge heat generation and Taylor tool life"
                onChange={(val) => setVc(val)}
              />

              {/* Slider 2: Feed per Tooth (f_z / f) */}
              <ParameterSlider
                label="Feed Rate per Tooth"
                symbol="fz / f"
                value={feed}
                min={Math.max(0.01, Number((tool.recommended_feed_min * 0.4).toFixed(3)))}
                max={Number((tool.recommended_feed_max * 2.0).toFixed(3))}
                step={0.005}
                unit="mm/tooth"
                recommendedMin={tool.recommended_feed_min}
                recommendedMax={tool.recommended_feed_max}
                description="Dictates chip load and table feed speed (vf)"
                onChange={(val) => setFeed(Number(val.toFixed(3)))}
              />

              {/* Slider 3: Axial Depth of Cut (a_p) */}
              <ParameterSlider
                label="Axial Depth of Cut"
                symbol="ap"
                value={ap}
                min={0.2}
                max={Number((tool.max_depth_of_cut * 1.5).toFixed(1))}
                step={0.1}
                unit="mm"
                recommendedMin={0.5}
                recommendedMax={tool.max_depth_of_cut}
                description="Vertical engagement depth per pass"
                onChange={(val) => setAp(Number(val.toFixed(1)))}
              />

              {/* Slider 4: Radial Width of Cut (a_e) */}
              <ParameterSlider
                label="Radial Width of Cut"
                symbol="ae"
                value={ae}
                min={0.5}
                max={tool.diameter}
                step={0.5}
                unit="mm"
                recommendedMin={1.0}
                recommendedMax={tool.diameter}
                description="Radial step-over engagement width"
                onChange={(val) => setAe(Number(val.toFixed(1)))}
              />
            </div>
          </div>

          {/* Sweet Spot Recommendation Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-[#0b101c] to-cyan-950/40 border border-amber-500/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Recommended Optimal Setting
                </span>
                <span className="text-xs text-slate-400">
                  Global Minimum Cost / Part
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-xl">
                {physicsResults.sweetSpot.reasoning}
              </p>
            </div>

            <div className="flex items-center gap-3 self-stretch md:self-auto justify-end flex-shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">OPTIMAL SPEED</div>
                <div className="text-2xl font-black text-amber-300">
                  {physicsResults.sweetSpot.recommendedVc} <span className="text-xs text-slate-400 font-normal">m/min</span>
                </div>
              </div>
              <button
                onClick={() => setVc(physicsResults.sweetSpot.recommendedVc)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <BookmarkCheck className="w-4 h-4" />
                Lock In Sweet Spot
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Physics Formulas Derivation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Mathematical Engineering Core & Physics Derivation
                </h3>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-cyan-400 font-bold text-sm">
                  1. Taylor's Extended Tool Life Equation
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-cyan-300 font-mono text-center text-sm">
                  v_c · T^n · (f / f_ref)^y · (a_p / a_p_ref)^x = C
                </div>
                <p className="text-slate-300 font-sans">
                  Solving dynamically for Tool Life <code className="text-amber-300">T (minutes)</code>:
                </p>
                <div className="p-2 bg-slate-900 rounded text-slate-300 font-mono">
                  T = [ C_eff / v_c ]^(1 / n)
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>• Selected Tool Material: <span className="text-slate-200">{tool.material.toUpperCase()}</span> (Taylor exponent n = <span className="text-amber-300 font-bold">{tool.taylor_n_value}</span>)</div>
                  <div>• Workpiece Material: <span className="text-slate-200">{material.material_name}</span> (Machining constant C = <span className="text-amber-300 font-bold">{material.taylor_c_value}</span> m/min)</div>
                  <div>• Active Speed v_c: <span className="text-cyan-300 font-bold">{vc} m/min</span> ➔ Resulting Taylor T: <span className="text-emerald-400 font-bold">{physicsResults.toolLifeMinutes.toFixed(1)} minutes</span></div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-cyan-400 font-bold text-sm">
                  2. Material Removal Rate (MRR)
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-cyan-300 font-mono text-center text-sm">
                  MRR = (a_p · a_e · v_f) / 1000 [cm³/min]
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>• Spindle RPM (N) = (v_c × 1000) / (π × D) = <span className="text-slate-200">{physicsResults.spindleRpm} RPM</span></div>
                  <div>• Table Feed (v_f) = N × f_z × z = <span className="text-slate-200">{physicsResults.tableFeedVf} mm/min</span></div>
                  <div>• Volumetric MRR = <span className="text-cyan-300 font-bold">{physicsResults.mrr} cm³/min</span> ({physicsResults.mrrMm3.toLocaleString()} mm³/min)</div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold text-sm">
                  3. Gilbert Economic Optimization (Cost vs Productivity Sweet Spot)
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-amber-300 font-mono text-center text-sm">
                  Total Cost / Part = (t_m × R_m) + (t_m / T) × [ C_tool + (t_tc × R_m) ]
                </div>
                <p className="text-slate-300 font-sans text-xs">
                  Balancing Machine Operating Cost (which decreases as v_c increases) against Tooling Cost (which surges exponentially as tool life T plummets at high v_c).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
