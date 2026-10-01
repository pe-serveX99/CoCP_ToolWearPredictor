import { Machine, Tool, WorkpieceMaterial, PhysicsCalculationResult, WearCurvePoint, SweetSpotPoint } from '../types/cnc';

/**
 * Standard failure criterion for tool flank wear (ISO 3685)
 * VB = 0.30 mm for cemented carbide tools in finishing/semi-finishing
 */
export const FLANK_WEAR_THRESHOLD_MM = 0.30;

/**
 * Solves Taylor's Extended Tool Life Equation:
 * v_c * T^n * f^y * a_p^x = C
 * 
 * Rearranging for T (Tool Life in minutes):
 * T = ( C / (v_c * (f / f_ref)^y * (a_p / a_p_ref)^x) )^(1 / n)
 * 
 * @param vc - Cutting speed in m/min
 * @param f - Feed rate in mm/tooth or mm/rev
 * @param ap - Axial depth of cut in mm
 * @param tool - Selected tool with Taylor exponent n
 * @param material - Selected workpiece material with Taylor constant C
 */
export function calculateTaylorToolLife(
  vc: number,
  f: number,
  ap: number,
  tool: Tool,
  material: WorkpieceMaterial
): number {
  if (vc <= 0) return 9999;

  const n = tool.taylor_n_value;
  const C = material.taylor_c_value;

  // Reference baseline parameters for extended Taylor adjustment
  const fRef = (tool.recommended_feed_min + tool.recommended_feed_max) / 2 || 0.08;
  const apRef = Math.max(1.0, tool.max_depth_of_cut / 2 || 2.0);

  // Extended Taylor exponents (y for feed, x for depth of cut)
  const y = 0.18; // Feed sensitivity exponent
  const x = 0.10; // Depth of cut sensitivity exponent

  const feedFactor = Math.pow(Math.max(0.01, f) / fRef, y);
  const depthFactor = Math.pow(Math.max(0.1, ap) / apRef, x);

  // Effective machining constant under current feed & depth stress
  const effectiveC = C / (feedFactor * depthFactor);

  if (vc >= effectiveC * 1.5) {
    // Extreme thermal breakdown zone
    return Math.max(0.5, Math.pow(effectiveC / vc, 1 / n));
  }

  const toolLifeMinutes = Math.pow(effectiveC / vc, 1 / n);
  return Math.max(0.5, Number(toolLifeMinutes.toFixed(2)));
}

/**
 * Calculates Material Removal Rate (MRR)
 * 
 * Milling formulation:
 * MRR = (ap * ae * vf) / 1000  [cm³/min]
 * where vf = N * fz * z
 * 
 * Simplified turning/cutting formulation:
 * MRR = vc * f * ap [cm³/min or m³/min scaled]
 */
export function calculateMRR(
  vc: number,
  f: number,
  ap: number,
  tool: Tool,
  ae?: number
): { mrrCm3: number; mrrMm3: number; rpm: number; tableFeedVf: number } {
  const diameter = tool.diameter;
  const flutes = tool.flute_count;

  // Spindle speed: N = (vc * 1000) / (pi * D)
  const rpm = diameter > 0 ? (vc * 1000) / (Math.PI * diameter) : 0;

  // Table feed rate: vf = N * fz * z (mm/min)
  const tableFeedVf = rpm * f * flutes;

  // Radial engagement: default to 50% tool diameter if not specified
  const radialEngagementAe = ae !== undefined ? ae : diameter * 0.5;

  // Volumetric MRR in mm³/min = ap * ae * vf
  const mrrMm3 = ap * radialEngagementAe * tableFeedVf;

  // Volumetric MRR in cm³/min = mrrMm3 / 1000
  const mrrCm3 = mrrMm3 / 1000;

  return {
    mrrCm3: Number(mrrCm3.toFixed(2)),
    mrrMm3: Number(mrrMm3.toFixed(0)),
    rpm: Math.round(rpm),
    tableFeedVf: Math.round(tableFeedVf),
  };
}

/**
 * Calculates Spindle Cutting Power and Cutting Force
 * Power P = (Fc * vc) / (60 * 1000 * efficiency) [kW]
 * Cutting Force Fc = kc * ap * fz [N]
 */
export function calculateCuttingPower(
  mrrCm3: number,
  material: WorkpieceMaterial
): { cuttingForceFc: number; cuttingPowerKw: number } {
  // Specific cutting force kc1 in N/mm²
  const kc = material.specific_cutting_force_kc1;
  const machineEfficiency = 0.85;

  // Power in kW: P = (kc [N/mm²] * MRR [cm³/min] * 1000 [mm³/cm³]) / (60 * 10^6 * efficiency)
  const powerKw = (kc * mrrCm3 * 1000) / (60 * 1000000 * machineEfficiency);

  // Approximate tangential cutting force in Newtons
  const cuttingForceFc = (powerKw * 1000 * 60) / (Math.max(1, mrrCm3));

  return {
    cuttingPowerKw: Number(powerKw.toFixed(2)),
    cuttingForceFc: Math.round(cuttingForceFc),
  };
}

/**
 * Generates the 3-phase Flank Wear Curve VB(t) vs time
 * 
 * Phase I: Break-in / rapid initial wear (0 to ~10% T) -> VB reaches ~0.08 mm
 * Phase II: Steady-state linear wear (10% to ~85% T) -> VB reaches ~0.24 mm
 * Phase III: Tertiary accelerated wear (85% to 100%+ T) -> rapid thermal breakdown past 0.30 mm
 */
export function generateWearCurve(toolLifeMinutes: number): WearCurvePoint[] {
  const points: WearCurvePoint[] = [];
  const maxTime = Math.ceil(toolLifeMinutes * 1.15); // Show slightly past failure
  const steps = 30;
  const stepSize = Math.max(0.5, maxTime / steps);

  const t1 = toolLifeMinutes * 0.12; // End of break-in
  const vb1 = 0.08; // Flank wear after break-in

  const t2 = toolLifeMinutes * 0.85; // End of steady-state
  const vb2 = 0.24; // Flank wear before accelerated wear

  const t3 = toolLifeMinutes; // Failure criterion
  const vb3 = FLANK_WEAR_THRESHOLD_MM; // 0.30 mm

  for (let t = 0; t <= maxTime; t += stepSize) {
    const timeVal = Number(t.toFixed(1));
    let flankWear = 0;
    let phase: 'Break-in' | 'Steady-state' | 'Tertiary Failure' = 'Break-in';

    if (timeVal <= t1) {
      // Phase I: parabolic / logarithmic initial wear
      const ratio = t1 > 0 ? timeVal / t1 : 0;
      flankWear = vb1 * Math.sqrt(ratio);
      phase = 'Break-in';
    } else if (timeVal <= t2) {
      // Phase II: linear steady-state wear
      const slope = (vb2 - vb1) / (t2 - t1);
      flankWear = vb1 + slope * (timeVal - t1);
      phase = 'Steady-state';
    } else {
      // Phase III: exponential accelerated wear
      const progress = (timeVal - t2) / (t3 - t2);
      flankWear = vb2 + (vb3 - vb2) * Math.pow(progress, 1.8);
      phase = 'Tertiary Failure';
    }

    points.push({
      time: timeVal,
      flankWear: Number(flankWear.toFixed(3)),
      threshold: FLANK_WEAR_THRESHOLD_MM,
      phase,
    });
  }

  return points;
}

/**
 * Comprehensive physics calculation combining Taylor equation, MRR, machine limits, and wear curve
 */
export function computeMachiningPhysics(
  vc: number,
  f: number,
  ap: number,
  machine: Machine,
  tool: Tool,
  material: WorkpieceMaterial,
  ae?: number
): PhysicsCalculationResult {
  // 1. Tool life
  const toolLifeMinutes = calculateTaylorToolLife(vc, f, ap, tool, material);

  // 2. Kinematics & MRR
  const { mrrCm3, mrrMm3, rpm, tableFeedVf } = calculateMRR(vc, f, ap, tool, ae);

  // 3. Power & cutting force
  const { cuttingForceFc, cuttingPowerKw } = calculateCuttingPower(mrrCm3, material);

  // 4. Machine limits verification
  const isRpmExceeded = rpm > machine.max_rpm;
  const isPowerExceeded = cuttingPowerKw > machine.max_spindle_power;
  const spindleLoadPercent = machine.max_spindle_power > 0 
    ? Math.round((cuttingPowerKw / machine.max_spindle_power) * 100) 
    : 0;

  // 5. Cost calculation per standard batch part (Gilbert Model)
  // Assuming a reference part requires removing 120 cm³ of stock
  const stockRemovalVolumeCm3 = 120;
  const machineHourlyRate = 95.0; // $95/hr machine rate
  const machineMinRate = machineHourlyRate / 60; // $/min
  const toolChangeTimeMin = 3.5; // Tool change index time

  const machiningTimeMin = mrrCm3 > 0 ? stockRemovalVolumeCm3 / mrrCm3 : 0;
  const machiningCost = machiningTimeMin * machineMinRate;
  
  // Tool cost per part: (machining time / tool life) * (tool cost + tool change labor)
  const toolCostRatio = toolLifeMinutes > 0 ? machiningTimeMin / toolLifeMinutes : 1;
  const toolingCost = toolCostRatio * (tool.cost + toolChangeTimeMin * machineMinRate);
  const totalCostPerPart = Number((machiningCost + toolingCost).toFixed(2));

  // 6. Wear curve
  const wearCurve = generateWearCurve(toolLifeMinutes);

  // 7. Sweet Spot Optimization Calculation
  const sweetSpot = findEconomicSweetSpot(f, ap, machine, tool, material, ae);

  return {
    spindleRpm: rpm,
    tableFeedVf,
    chipLoadFz: f,
    mrr: mrrCm3,
    mrrMm3,
    toolLifeMinutes,
    cuttingForceFc,
    cuttingPowerKw,
    spindleLoadPercent,
    isRpmExceeded,
    isPowerExceeded,
    rpmLimit: machine.max_rpm,
    powerLimit: machine.max_spindle_power,
    costPerPart: totalCostPerPart,
    machiningCost: Number(machiningCost.toFixed(2)),
    toolingCost: Number(toolingCost.toFixed(2)),
    wearCurve,
    sweetSpot,
  };
}

/**
 * Finds the economic sweet spot (Minimum Cost per Part) along cutting speed curve
 */
export function findEconomicSweetSpot(
  currentF: number,
  currentAp: number,
  machine: Machine,
  tool: Tool,
  material: WorkpieceMaterial,
  ae?: number
) {
  const vcMin = Math.max(15, tool.recommended_vc_min * 0.5);
  const vcMax = Math.min(tool.recommended_vc_max * 1.5, (machine.max_rpm * Math.PI * tool.diameter) / 1000);

  let bestVc = currentF;
  let minCost = Infinity;
  let optimalMrr = 0;
  let optimalToolLife = 0;

  const testSteps = 40;
  const step = (vcMax - vcMin) / testSteps;

  for (let testVc = vcMin; testVc <= vcMax; testVc += step) {
    const tLife = calculateTaylorToolLife(testVc, currentF, currentAp, tool, material);
    const { mrrCm3, rpm } = calculateMRR(testVc, currentF, currentAp, tool, ae);
    const { cuttingPowerKw } = calculateCuttingPower(mrrCm3, material);

    if (rpm > machine.max_rpm || cuttingPowerKw > machine.max_spindle_power) {
      continue;
    }

    const stockVol = 120;
    const machTime = mrrCm3 > 0 ? stockVol / mrrCm3 : 999;
    const machCost = machTime * (95 / 60);
    const toolCost = (machTime / tLife) * (tool.cost + 3.5 * (95 / 60));
    const totalCost = machCost + toolCost;

    // Minimum tool life threshold constraint (tool life shouldn't drop below 15 minutes in viable shop)
    if (tLife >= 15 && totalCost < minCost) {
      minCost = totalCost;
      bestVc = testVc;
      optimalMrr = mrrCm3;
      optimalToolLife = tLife;
    }
  }

  // Fallback if no valid found
  if (minCost === Infinity) {
    bestVc = (tool.recommended_vc_min + tool.recommended_vc_max) / 2;
    optimalToolLife = calculateTaylorToolLife(bestVc, currentF, currentAp, tool, material);
    optimalMrr = calculateMRR(bestVc, currentF, currentAp, tool, ae).mrrCm3;
    minCost = 45.0;
  }

  return {
    recommendedVc: Math.round(bestVc),
    recommendedFeed: currentF,
    recommendedAp: currentAp,
    optimalMrr: Number(optimalMrr.toFixed(2)),
    optimalToolLife: Number(optimalToolLife.toFixed(1)),
    minCostPerPart: Number(minCost.toFixed(2)),
    reasoning: `Optimized for minimum part cost ($${minCost.toFixed(2)}/part) with tool life > 15 min while respecting ${machine.name} max RPM (${machine.max_rpm}) and spindle power (${machine.max_spindle_power} kW).`,
  };
}

/**
 * Generates sweep points for Productivity vs Cost Scatter/Curve Plot
 * X-axis: Material Removal Rate (MRR in cm³/min)
 * Y-axis: Tool Cost Per Part ($) or Total Cost Per Part ($)
 */
export function generateSweetSpotCurve(
  currentF: number,
  currentAp: number,
  machine: Machine,
  tool: Tool,
  material: WorkpieceMaterial,
  optimalVc: number,
  ae?: number,
  currentActiveVc?: number
): SweetSpotPoint[] {
  const points: SweetSpotPoint[] = [];
  const vcMin = Math.max(20, Math.round(tool.recommended_vc_min * 0.45));
  const vcMax = Math.min(Math.round(tool.recommended_vc_max * 1.6), Math.round((machine.max_rpm * Math.PI * tool.diameter) / 1000));

  const steps = 30;
  const step = Math.max(2, (vcMax - vcMin) / steps);

  for (let vc = vcMin; vc <= vcMax; vc += step) {
    const tLife = calculateTaylorToolLife(vc, currentF, currentAp, tool, material);
    const { mrrCm3, rpm } = calculateMRR(vc, currentF, currentAp, tool, ae);
    const { cuttingPowerKw } = calculateCuttingPower(mrrCm3, material);

    if (rpm > machine.max_rpm * 1.05 || cuttingPowerKw > machine.max_spindle_power * 1.1) {
      continue;
    }

    const stockVol = 120; // 120 cm³ reference pocket cut
    const machTime = mrrCm3 > 0 ? stockVol / mrrCm3 : 999;
    const machineRatePerMin = 95 / 60; // $95/hr shop rate
    const toolChangeCost = 3.5 * machineRatePerMin; // 3.5 min tool change labor

    const machCost = machTime * machineRatePerMin;
    const toolCost = (machTime / tLife) * (tool.cost + toolChangeCost);
    const totalCost = machCost + toolCost;

    points.push({
      vc: Math.round(vc),
      mrr: Number(mrrCm3.toFixed(1)),
      toolCostPerPart: Number(toolCost.toFixed(2)),
      machiningCost: Number(machCost.toFixed(2)),
      totalCostPerPart: Number(totalCost.toFixed(2)),
      costPerPart: Number(totalCost.toFixed(2)),
      toolLife: Number(tLife.toFixed(1)),
      isOptimal: false,
      isCurrent: currentActiveVc !== undefined ? Math.abs(vc - currentActiveVc) < step * 0.6 : false,
    });
  }

  // Sort by MRR (X-axis)
  points.sort((a, b) => a.mrr - b.mrr);

  // Find exact lowest cost point
  if (points.length > 0) {
    let minCost = Infinity;
    let minIdx = 0;
    points.forEach((p, idx) => {
      // Find lowest total cost (sweet spot)
      if (p.totalCostPerPart < minCost && p.toolLife >= 12) {
        minCost = p.totalCostPerPart;
        minIdx = idx;
      }
    });
    points[minIdx].isOptimal = true;
  }

  return points;
}
