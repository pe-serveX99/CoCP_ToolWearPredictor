export type MachineType = 
  | '5-axis'
  | '3-axis lathe'
  | '3-axis VMC'
  | '5-axis Mill-Turn';

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  max_rpm: number;
  max_spindle_power: number; // in kW
  coolant_options: string[];
  spindle_taper?: string;
  max_feed_rate?: number; // mm/min
  location?: string;
}

export type ToolCategory = 'end mill' | 'face mill' | 'insert' | 'ball nose' | 'drill';
export type ToolMaterial = 'carbide' | 'ceramic' | 'cbn' | 'hss' | 'diamond';

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  material: ToolMaterial;
  diameter: number; // mm
  flute_count: number;
  taylor_n_value: number; // e.g. 0.25 for Carbide, 0.125 for HSS, 0.40 for Ceramic
  cost: number; // USD
  coating: string; // e.g. AlTiN, TiAlN, TiCN, Uncoated
  max_overhang_mm: number;
  max_depth_of_cut: number; // mm (ap max)
  recommended_vc_min: number; // m/min
  recommended_vc_max: number; // m/min
  recommended_feed_min: number; // mm/tooth
  recommended_feed_max: number; // mm/tooth
}

export interface WorkpieceMaterial {
  id: string;
  material_name: string;
  category: string;
  hardness_brinell: number; // HB
  machinability_rating: number; // percentage (relative to B1112 steel = 100%)
  taylor_c_value: number; // Machining constant C in m/min
  specific_cutting_force_kc1: number; // N/mm²
  density: number; // g/cm³
  description?: string;
}

export type OperationStatus = 'running' | 'idle' | 'warning' | 'tool_change_needed';

export interface ActiveOperation {
  id: string;
  job_name: string;
  part_number: string;
  machine_id: string;
  tool_id: string;
  material_id: string;
  active_vc: number; // m/min
  active_f: number; // mm/rev or mm/tooth
  active_ap: number; // mm
  active_ae?: number; // mm (radial depth of cut)
  time_in_cut: number; // minutes elapsed in current cut
  current_wear_percentage: number; // 0 to 100%
  current_flank_wear_vb: number; // mm
  status: OperationStatus;
}

export interface WearCurvePoint {
  time: number; // minutes
  flankWear: number; // mm (VB)
  threshold: number; // failure threshold (typically 0.30 mm or 0.35 mm)
  phase: 'Break-in' | 'Steady-state' | 'Tertiary Failure';
}

export interface PhysicsCalculationResult {
  // Kinematic parameters
  spindleRpm: number;
  tableFeedVf: number; // mm/min
  chipLoadFz: number; // mm/tooth
  
  // Primary performance metrics
  mrr: number; // Material Removal Rate in cm³/min
  mrrMm3: number; // mm³/min
  toolLifeMinutes: number; // Taylor T in minutes
  
  // Power & Mechanics
  cuttingForceFc: number; // Newtons
  cuttingPowerKw: number; // kW
  spindleLoadPercent: number; // % of machine capacity
  
  // Machine limit warnings
  isRpmExceeded: boolean;
  isPowerExceeded: boolean;
  rpmLimit: number;
  powerLimit: number;
  
  // Cost analysis
  costPerPart: number; // USD
  machiningCost: number;
  toolingCost: number;
  
  // Wear curve data points for charting
  wearCurve: WearCurvePoint[];
  
  // Recommended sweet spot
  sweetSpot: {
    recommendedVc: number;
    recommendedFeed: number;
    recommendedAp: number;
    optimalMrr: number;
    optimalToolLife: number;
    minCostPerPart: number;
    reasoning: string;
  };
}

export interface SweetSpotPoint {
  vc: number;
  mrr: number; // X-axis (cm³/min)
  toolCostPerPart: number; // Y-axis: Tool Cost Per Part ($)
  machiningCost: number; // Machine Operating Cost Per Part ($)
  totalCostPerPart: number; // Total Part Cost ($)
  costPerPart: number; // Default mapped cost
  toolLife: number; // Taylor Tool Life in min
  isOptimal: boolean;
  isCurrent?: boolean;
}
