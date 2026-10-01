import { Machine, Tool, WorkpieceMaterial, ActiveOperation, MachineType, ToolCategory, ToolMaterial } from '../types/cnc';

// ==========================================
// 1. GENERATE 50 DISTINCT CNC MACHINES
// ==========================================
const MACHINE_BRANDS = [
  { brand: 'DMG MORI', series: ['DMU', 'CMX', 'NTX', 'NVX', 'Lasertec'] },
  { brand: 'Mazak', series: ['Integrex', 'Variaxis', 'VCN', 'Quick Turn', 'Syncrex'] },
  { brand: 'Haas', series: ['VF', 'UMC', 'EC', 'ST', 'Super-Speed'] },
  { brand: 'Okuma', series: ['Multus', 'Genos', 'MU', 'LB', 'MB'] },
  { brand: 'Makino', series: ['DA', 'D200Z', 'a51nx', 'F5', 'T1'] },
  { brand: 'Hermle', series: ['C 42 U', 'C 250', 'C 650', 'C 32 U'] },
  { brand: 'Grob', series: ['G350', 'G550', 'G750'] },
  { brand: 'Matsuura', series: ['MAM72', 'MX-330', 'H.Plus', 'V.Plus'] },
];

function generateMachines(): Machine[] {
  const machines: Machine[] = [];
  const types: MachineType[] = ['5-axis', '5-axis Mill-Turn', '3-axis VMC', '3-axis lathe'];
  const tapers = ['HSK-A63', 'HSK-A100', 'Capto C6', 'Capto C8', 'BT40 Big Plus', 'BT50', 'CAT40', 'CAT50'];
  const coolants = [
    'High-Pressure Through-Spindle (80 bar)',
    'Through-Spindle Coolant (70 bar)',
    'Dual Flood Manifold (20 bar)',
    'Air Blast through Spindle',
    'Cryogenic Super-Critical CO2',
    'Minimum Quantity Lubrication (MQL)',
    'Shower Coolant Ring',
    'Programmable Coolant Nozzle (P-COOL)',
  ];

  let idCounter = 1;

  // Curated flagship 5-axis machines
  const flagships = [
    { name: 'DMG MORI DMU 50 (3rd Gen)', type: '5-axis' as MachineType, rpm: 20000, power: 35, taper: 'HSK-A63', bay: 'Bay 1 - Aerospace' },
    { name: 'Mazak Integrex i-200H S', type: '5-axis Mill-Turn' as MachineType, rpm: 12000, power: 26, taper: 'Capto C6', bay: 'Bay 2 - Turn-Mill Cell' },
    { name: 'Haas VF-4SS Super-Speed', type: '3-axis VMC' as MachineType, rpm: 12000, power: 22.4, taper: 'CAT40', bay: 'Bay 3 - Production Mill' },
    { name: 'Hermle C 42 U Dynamic', type: '5-axis' as MachineType, rpm: 24000, power: 42, taper: 'HSK-A63', bay: 'Bay 1 - Aerospace' },
    { name: 'Okuma MU-5000V Laser EX', type: '5-axis' as MachineType, rpm: 15000, power: 30, taper: 'CAT40 Big Plus', bay: 'Bay 4 - 5-Axis Precision' },
    { name: 'Makino a51nx Horizontal', type: '3-axis VMC' as MachineType, rpm: 14000, power: 33, taper: 'BT40', bay: 'Bay 5 - Heavy Production' },
    { name: 'Grob G350 Universal', type: '5-axis' as MachineType, rpm: 18000, power: 38, taper: 'HSK-A63', bay: 'Bay 4 - 5-Axis Precision' },
    { name: 'Matsuura MAM72-35V 32-Pallet', type: '5-axis' as MachineType, rpm: 20000, power: 37, taper: 'BT40', bay: 'Bay 6 - Lights Out Cell' },
  ];

  for (const f of flagships) {
    machines.push({
      id: `M${String(idCounter++).padStart(2, '0')}`,
      name: f.name,
      type: f.type,
      max_rpm: f.rpm,
      max_spindle_power: f.power,
      spindle_taper: f.taper,
      max_feed_rate: Math.round(f.rpm * 2.2),
      coolant_options: [coolants[0], coolants[1], coolants[3], coolants[5]],
      location: f.bay,
    });
  }

  // Generate remainder up to 50
  while (machines.length < 50) {
    const brandObj = MACHINE_BRANDS[machines.length % MACHINE_BRANDS.length];
    const series = brandObj.series[machines.length % brandObj.series.length];
    const modelNum = (machines.length * 7 + 120) % 900 + 100;
    const type = types[machines.length % types.length];
    
    let rpm = 10000;
    let power = 20;
    if (type === '5-axis') {
      rpm = [15000, 18000, 20000, 24000, 30000][machines.length % 5];
      power = [25, 30, 35, 42, 50][machines.length % 5];
    } else if (type === '5-axis Mill-Turn') {
      rpm = [10000, 12000, 15000][machines.length % 3];
      power = [22, 28, 37][machines.length % 3];
    } else {
      rpm = [8000, 10000, 12000, 15000][machines.length % 4];
      power = [15, 18.5, 22.4, 26][machines.length % 4];
    }

    const taper = tapers[machines.length % tapers.length];
    const bayNum = (machines.length % 8) + 1;

    machines.push({
      id: `M${String(idCounter++).padStart(2, '0')}`,
      name: `${brandObj.brand} ${series}-${modelNum} ${type === '5-axis' ? '5X' : ''}`.trim(),
      type,
      max_rpm: rpm,
      max_spindle_power: power,
      spindle_taper: taper,
      max_feed_rate: Math.round(rpm * 1.8),
      coolant_options: [
        coolants[machines.length % coolants.length],
        coolants[(machines.length + 2) % coolants.length],
        coolants[(machines.length + 4) % coolants.length],
      ],
      location: `Bay ${bayNum} - ${type.toUpperCase()}`,
    });
  }

  return machines;
}

// ==========================================
// 2. GENERATE 150 DIVERSE CUTTING TOOLS
// ==========================================
function generateTools(): Tool[] {
  const tools: Tool[] = [];
  const categories: ToolCategory[] = ['end mill', 'face mill', 'insert', 'ball nose', 'drill'];
  const coatings = [
    'AlTiN (Nano-composite)',
    'TiAlN Multi-layer',
    'DLC (Diamond-Like Carbon)',
    'CVD TiCN + Al2O3',
    'PVD AlCrN High Temp',
    'TiSiN Heat Resistant',
    'ZrN Low-Friction',
    'TiN Gold Flash',
    'Diamond CVD Crystalline',
    'Uncoated Mirror Lapped',
  ];

  let idCounter = 1;

  // 10 foundational benchmark tools
  const foundationalTools: Tool[] = [
    {
      id: 'T001',
      name: '12mm 4-Flute Solid Carbide AlTiN End Mill',
      category: 'end mill',
      material: 'carbide',
      diameter: 12,
      flute_count: 4,
      taylor_n_value: 0.26,
      cost: 78.0,
      coating: 'AlTiN (Nano-composite)',
      max_overhang_mm: 45,
      max_depth_of_cut: 6.0,
      recommended_vc_min: 50,
      recommended_vc_max: 180,
      recommended_feed_min: 0.04,
      recommended_feed_max: 0.12,
    },
    {
      id: 'T002',
      name: '16mm 5-Flute Unequal Pitch Carbide Rougher',
      category: 'end mill',
      material: 'carbide',
      diameter: 16,
      flute_count: 5,
      taylor_n_value: 0.28,
      cost: 115.0,
      coating: 'TiAlN Multi-layer',
      max_overhang_mm: 60,
      max_depth_of_cut: 8.0,
      recommended_vc_min: 60,
      recommended_vc_max: 210,
      recommended_feed_min: 0.05,
      recommended_feed_max: 0.15,
    },
    {
      id: 'T003',
      name: '10mm 3-Flute Mirror Polished Aluminum Mill',
      category: 'end mill',
      material: 'carbide',
      diameter: 10,
      flute_count: 3,
      taylor_n_value: 0.34,
      cost: 62.0,
      coating: 'DLC (Diamond-Like Carbon)',
      max_overhang_mm: 35,
      max_depth_of_cut: 10.0,
      recommended_vc_min: 250,
      recommended_vc_max: 750,
      recommended_feed_min: 0.06,
      recommended_feed_max: 0.20,
    },
    {
      id: 'T004',
      name: '50mm 5-Tooth Indexable Octagonal Face Mill',
      category: 'face mill',
      material: 'carbide',
      diameter: 50,
      flute_count: 5,
      taylor_n_value: 0.25,
      cost: 245.0,
      coating: 'CVD TiCN + Al2O3',
      max_overhang_mm: 80,
      max_depth_of_cut: 4.5,
      recommended_vc_min: 80,
      recommended_vc_max: 260,
      recommended_feed_min: 0.10,
      recommended_feed_max: 0.35,
    },
    {
      id: 'T005',
      name: '63mm 6-Tooth High Feed Face Mill',
      category: 'face mill',
      material: 'carbide',
      diameter: 63,
      flute_count: 6,
      taylor_n_value: 0.25,
      cost: 320.0,
      coating: 'PVD AlCrN High Temp',
      max_overhang_mm: 90,
      max_depth_of_cut: 2.0,
      recommended_vc_min: 90,
      recommended_vc_max: 300,
      recommended_feed_min: 0.40,
      recommended_feed_max: 1.20,
    },
    {
      id: 'T006',
      name: '8mm 2-Flute Micro-Grain Solid Carbide Slotter',
      category: 'end mill',
      material: 'carbide',
      diameter: 8,
      flute_count: 2,
      taylor_n_value: 0.24,
      cost: 48.0,
      coating: 'AlTiN Micro',
      max_overhang_mm: 28,
      max_depth_of_cut: 4.0,
      recommended_vc_min: 40,
      recommended_vc_max: 160,
      recommended_feed_min: 0.03,
      recommended_feed_max: 0.09,
    },
    {
      id: 'T007',
      name: '12mm 4-Flute Silicon Nitride Ceramic Mill',
      category: 'end mill',
      material: 'ceramic',
      diameter: 12,
      flute_count: 4,
      taylor_n_value: 0.42,
      cost: 195.0,
      coating: 'Uncoated High Purity Si3N4',
      max_overhang_mm: 40,
      max_depth_of_cut: 3.0,
      recommended_vc_min: 200,
      recommended_vc_max: 650,
      recommended_feed_min: 0.02,
      recommended_feed_max: 0.08,
    },
    {
      id: 'T008',
      name: '16mm Solid CBN-Tipped Hard Turning Insert',
      category: 'insert',
      material: 'cbn',
      diameter: 16,
      flute_count: 2,
      taylor_n_value: 0.48,
      cost: 340.0,
      coating: 'TiN Gold Flash',
      max_overhang_mm: 35,
      max_depth_of_cut: 1.5,
      recommended_vc_min: 150,
      recommended_vc_max: 450,
      recommended_feed_min: 0.04,
      recommended_feed_max: 0.14,
    },
    {
      id: 'T009',
      name: '10mm 4-Flute Cobalt HSS Heavy Rougher',
      category: 'end mill',
      material: 'hss',
      diameter: 10,
      flute_count: 4,
      taylor_n_value: 0.125,
      cost: 32.0,
      coating: 'TiN PVD',
      max_overhang_mm: 45,
      max_depth_of_cut: 5.0,
      recommended_vc_min: 20,
      recommended_vc_max: 60,
      recommended_feed_min: 0.03,
      recommended_feed_max: 0.10,
    },
    {
      id: 'T010',
      name: '12mm 2-Flute Solid Carbide Ball Nose End Mill',
      category: 'ball nose',
      material: 'carbide',
      diameter: 12,
      flute_count: 2,
      taylor_n_value: 0.27,
      cost: 92.0,
      coating: 'TiSiN Heat Resistant',
      max_overhang_mm: 50,
      max_depth_of_cut: 3.5,
      recommended_vc_min: 60,
      recommended_vc_max: 220,
      recommended_feed_min: 0.04,
      recommended_feed_max: 0.11,
    },
  ];

  tools.push(...foundationalTools);
  idCounter = foundationalTools.length + 1;

  // Generate remaining tools systematically across sizes & families
  const diameters = [2, 3, 4, 6, 8, 10, 12, 14, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
  const fluteOptions = [1, 2, 3, 4, 5, 6, 8];

  while (tools.length < 150) {
    const cat = categories[tools.length % categories.length];
    const diam = diameters[tools.length % diameters.length];
    const coating = coatings[tools.length % coatings.length];
    let mat: ToolMaterial = 'carbide';
    let nVal = 0.26;
    let baseCost = 45;

    if (cat === 'face mill') {
      mat = 'carbide';
      nVal = 0.25;
      baseCost = 180 + diam * 2;
    } else if (tools.length % 9 === 0) {
      mat = 'ceramic';
      nVal = 0.42;
      baseCost = 160 + diam * 3;
    } else if (tools.length % 11 === 0) {
      mat = 'cbn';
      nVal = 0.47;
      baseCost = 280 + diam * 4;
    } else if (tools.length % 13 === 0) {
      mat = 'hss';
      nVal = 0.125;
      baseCost = 25 + diam;
    } else if (tools.length % 15 === 0) {
      mat = 'diamond';
      nVal = 0.38;
      baseCost = 220 + diam * 5;
    } else {
      mat = 'carbide';
      nVal = 0.25 + (tools.length % 5) * 0.015;
      baseCost = 45 + diam * 3.5;
    }

    let flutes = 4;
    if (cat === 'ball nose') flutes = [2, 3, 4][tools.length % 3];
    else if (cat === 'drill') flutes = 2;
    else if (cat === 'face mill') flutes = Math.max(4, Math.min(8, Math.round(diam / 10)));
    else flutes = fluteOptions[tools.length % fluteOptions.length];

    const maxAp = cat === 'face mill' ? Math.max(1.5, Number((diam * 0.08).toFixed(1))) : Math.max(1.0, Number((diam * 0.6).toFixed(1)));
    const overhang = Math.round(diam * 3.5);

    let vcMin = 50;
    let vcMax = 200;
    if (mat === 'ceramic') { vcMin = 180; vcMax = 600; }
    else if (mat === 'cbn') { vcMin = 140; vcMax = 450; }
    else if (mat === 'hss') { vcMin = 18; vcMax = 65; }
    else if (mat === 'diamond') { vcMin = 300; vcMax = 950; }
    else if (coating.includes('DLC') || coating.includes('Mirror')) { vcMin = 200; vcMax = 700; }

    const feedMin = Number((0.02 + (diam / 100) * 0.2).toFixed(3));
    const feedMax = Number((feedMin * 2.8).toFixed(3));

    const toolName = `${diam}mm ${flutes}-Flute ${mat.toUpperCase()} ${
      cat === 'ball nose' ? 'Ball Nose' :
      cat === 'face mill' ? 'Face Mill' :
      cat === 'drill' ? 'Carbide Drill' :
      cat === 'insert' ? 'Indexable Insert Mill' :
      'End Mill'
    }`;

    tools.push({
      id: `T${String(idCounter++).padStart(3, '0')}`,
      name: toolName,
      category: cat,
      material: mat,
      diameter: diam,
      flute_count: flutes,
      taylor_n_value: Number(nVal.toFixed(3)),
      cost: Number(baseCost.toFixed(1)),
      coating,
      max_overhang_mm: overhang,
      max_depth_of_cut: maxAp,
      recommended_vc_min: vcMin,
      recommended_vc_max: vcMax,
      recommended_feed_min: feedMin,
      recommended_feed_max: feedMax,
    });
  }

  return tools;
}

// ==========================================
// 3. GENERATE 25 WORKPIECE MATERIALS
// ==========================================
export const MOCK_MATERIALS: WorkpieceMaterial[] = [
  // Titanium Alloys
  {
    id: 'MAT01',
    material_name: 'Titanium Ti-6Al-4V (Grade 5 - Annealed)',
    category: 'Titanium Alloy',
    hardness_brinell: 334,
    machinability_rating: 22,
    taylor_c_value: 95,
    specific_cutting_force_kc1: 2150,
    density: 4.43,
    description: 'Alpha-beta aerospace alloy with very low thermal conductivity and severe tool notch wear.',
  },
  {
    id: 'MAT02',
    material_name: 'Titanium Grade 2 (Commercially Pure)',
    category: 'Titanium Alloy',
    hardness_brinell: 145,
    machinability_rating: 38,
    taylor_c_value: 140,
    specific_cutting_force_kc1: 1650,
    density: 4.51,
    description: 'High corrosion resistance, gummy machining characteristics, prone to edge galling.',
  },
  {
    id: 'MAT03',
    material_name: 'Titanium Ti-5553 (High Strength Deep Hardening)',
    category: 'Titanium Alloy',
    hardness_brinell: 390,
    machinability_rating: 15,
    taylor_c_value: 70,
    specific_cutting_force_kc1: 2450,
    density: 4.65,
    description: 'Landing gear near-beta titanium with intense cutting forces and rapid thermal flank wear.',
  },

  // Aluminum Alloys
  {
    id: 'MAT04',
    material_name: 'Aluminum 6061-T6 (Extruded/Plate)',
    category: 'Aluminum Alloy',
    hardness_brinell: 95,
    machinability_rating: 270,
    taylor_c_value: 650,
    specific_cutting_force_kc1: 750,
    density: 2.70,
    description: 'Universal aerospace structural aluminum. Excellent machinability, requires high shear angle flutes.',
  },
  {
    id: 'MAT05',
    material_name: 'Aluminum 7075-T6 (High Strength Zinc-Alloy)',
    category: 'Aluminum Alloy',
    hardness_brinell: 150,
    machinability_rating: 230,
    taylor_c_value: 580,
    specific_cutting_force_kc1: 890,
    density: 2.81,
    description: 'High yield strength aerospace alloy. Forms crisp chips, ideal for high-speed aggressive pocketing.',
  },
  {
    id: 'MAT06',
    material_name: 'Aluminum 2024-T3 (High Fatigue Resistant)',
    category: 'Aluminum Alloy',
    hardness_brinell: 120,
    machinability_rating: 240,
    taylor_c_value: 600,
    specific_cutting_force_kc1: 820,
    density: 2.78,
    description: 'Aircraft fuselage skin and wing rib alloy with good chip breaking characteristics.',
  },
  {
    id: 'MAT07',
    material_name: 'Cast Aluminum A380 (High Silicon Die Cast)',
    category: 'Aluminum Alloy',
    hardness_brinell: 80,
    machinability_rating: 180,
    taylor_c_value: 480,
    specific_cutting_force_kc1: 950,
    density: 2.74,
    description: 'Contains abrasive silicon particles causing accelerated abrasive flank wear without DLC or PCD tooling.',
  },

  // Alloy Steels & Tool Steels
  {
    id: 'MAT08',
    material_name: 'AISI 4140 Chromoly Steel (Pre-hardened 32 HRC)',
    category: 'Alloy Steel',
    hardness_brinell: 285,
    machinability_rating: 65,
    taylor_c_value: 210,
    specific_cutting_force_kc1: 1950,
    density: 7.85,
    description: 'Tough medium-carbon chromoly steel commonly used in shafts, gears, and structural tooling.',
  },
  {
    id: 'MAT09',
    material_name: 'AISI 4340 Nickel-Chromoly High Strength Steel',
    category: 'Alloy Steel',
    hardness_brinell: 340,
    machinability_rating: 50,
    taylor_c_value: 170,
    specific_cutting_force_kc1: 2200,
    density: 7.85,
    description: 'Heavy duty aircraft structural steel with outstanding impact resistance and high thermal stress.',
  },
  {
    id: 'MAT10',
    material_name: 'AISI 1018 Mild Low-Carbon Steel',
    category: 'Carbon Steel',
    hardness_brinell: 126,
    machinability_rating: 78,
    taylor_c_value: 260,
    specific_cutting_force_kc1: 1550,
    density: 7.87,
    description: 'Ductile general shop steel prone to built-up edge at low cutting speeds; needs sharp shearing.',
  },
  {
    id: 'MAT11',
    material_name: 'D2 Cold Work Tool Steel (High Carbon/Chromium)',
    category: 'Tool Steel',
    hardness_brinell: 255,
    machinability_rating: 35,
    taylor_c_value: 125,
    specific_cutting_force_kc1: 2300,
    density: 7.70,
    description: 'Abrasive tool steel packed with chromium carbides. High wear on cutting edges.',
  },
  {
    id: 'MAT12',
    material_name: 'H13 Hot Work Die Steel (Annealed)',
    category: 'Tool Steel',
    hardness_brinell: 210,
    machinability_rating: 52,
    taylor_c_value: 180,
    specific_cutting_force_kc1: 1850,
    density: 7.80,
    description: 'Standard extrusion and injection mold die steel with good polishability and moderate cutting loads.',
  },
  {
    id: 'MAT13',
    material_name: 'Hardened Tool Steel (58-62 HRC Hard Milling)',
    category: 'Hardened Steel',
    hardness_brinell: 600,
    machinability_rating: 18,
    taylor_c_value: 80,
    specific_cutting_force_kc1: 3400,
    density: 7.82,
    description: 'Requires solid CBN or specialized TiSiN micro-grain carbide tooling under dry high-speed air blast.',
  },

  // Stainless Steels
  {
    id: 'MAT14',
    material_name: '304 Austenitic Stainless Steel',
    category: 'Stainless Steel',
    hardness_brinell: 180,
    machinability_rating: 45,
    taylor_c_value: 150,
    specific_cutting_force_kc1: 2050,
    density: 8.00,
    description: 'Severe work hardening behavior. Feed rate must never dwell or drop below chip thickness threshold.',
  },
  {
    id: 'MAT15',
    material_name: '316L Marine/Medical Austenitic Stainless',
    category: 'Stainless Steel',
    hardness_brinell: 195,
    machinability_rating: 40,
    taylor_c_value: 140,
    specific_cutting_force_kc1: 2150,
    density: 8.00,
    description: 'Molybdenum added for pitting resistance; gummy cutting action with continuous ribbon chips.',
  },
  {
    id: 'MAT16',
    material_name: '17-4 PH Precipitation Hardened Stainless (Condition H900)',
    category: 'Stainless Steel',
    hardness_brinell: 375,
    machinability_rating: 38,
    taylor_c_value: 130,
    specific_cutting_force_kc1: 2350,
    density: 7.75,
    description: 'High tensile strength martensitic stainless steel with moderate abrasive wear.',
  },
  {
    id: 'MAT17',
    material_name: 'Duplex 2205 (Austenitic-Ferritic Stainless)',
    category: 'Stainless Steel',
    hardness_brinell: 290,
    machinability_rating: 32,
    taylor_c_value: 115,
    specific_cutting_force_kc1: 2400,
    density: 7.82,
    description: 'Very high yield strength with severe work hardening and demanding notch wear on tool corners.',
  },

  // Nickel & Cobalt Superalloys
  {
    id: 'MAT18',
    material_name: 'Inconel 718 (Nickel Superalloy - Aged)',
    category: 'Nickel Superalloy',
    hardness_brinell: 363,
    machinability_rating: 12,
    taylor_c_value: 55,
    specific_cutting_force_kc1: 2850,
    density: 8.19,
    description: 'Extreme thermal resistance, retains hardness at 700°C; requires rigid setup and positive rake inserts.',
  },
  {
    id: 'MAT19',
    material_name: 'Inconel 625 (High Molybdenum-Columbium)',
    category: 'Nickel Superalloy',
    hardness_brinell: 220,
    machinability_rating: 16,
    taylor_c_value: 65,
    specific_cutting_force_kc1: 2650,
    density: 8.44,
    description: 'Chemical & marine exhaust alloy, intense strain hardening, requires heavy uninterrupted chip load.',
  },
  {
    id: 'MAT20',
    material_name: 'Hastelloy C-276 (Corrosion Master Alloy)',
    category: 'Nickel Superalloy',
    hardness_brinell: 215,
    machinability_rating: 14,
    taylor_c_value: 60,
    specific_cutting_force_kc1: 2750,
    density: 8.89,
    description: 'Severe work hardening rate, high tool pressure, requires high-pressure through-spindle coolant.',
  },
  {
    id: 'MAT21',
    material_name: 'Waspaloy (High-Temperature Turbine Disc Alloy)',
    category: 'Nickel Superalloy',
    hardness_brinell: 380,
    machinability_rating: 10,
    taylor_c_value: 45,
    specific_cutting_force_kc1: 3100,
    density: 8.20,
    description: 'Gas turbine disc alloy with extreme abrasive carbide content and rapid catastrophic tool cratering.',
  },
  {
    id: 'MAT22',
    material_name: 'Monel 400 (Nickel-Copper Solid Solution)',
    category: 'Nickel Alloy',
    hardness_brinell: 140,
    machinability_rating: 25,
    taylor_c_value: 110,
    specific_cutting_force_kc1: 1900,
    density: 8.80,
    description: 'High resistance to marine salt and acids, produces tough continuous chips requiring chipbreakers.',
  },

  // Copper, Brass & Engineering Polymers
  {
    id: 'MAT23',
    material_name: 'Brass C360 (Free-Cutting Brass - 100% Benchmark)',
    category: 'Copper Alloy',
    hardness_brinell: 130,
    machinability_rating: 100,
    taylor_c_value: 450,
    specific_cutting_force_kc1: 700,
    density: 8.50,
    description: 'The global standard benchmark for 100% machinability rating. Tiny broken chips with minimal edge friction.',
  },
  {
    id: 'MAT24',
    material_name: 'Oxygen-Free Copper C101 (Pure High Conductivity)',
    category: 'Copper Alloy',
    hardness_brinell: 85,
    machinability_rating: 20,
    taylor_c_value: 160,
    specific_cutting_force_kc1: 1100,
    density: 8.94,
    description: 'Extremely gummy pure copper, tends to smear and weld to cutting edge without high lubricity coolant.',
  },
  {
    id: 'MAT25',
    material_name: 'PEEK 30% Carbon-Fiber Reinforced Polymer',
    category: 'Engineering Composite',
    hardness_brinell: 90,
    machinability_rating: 140,
    taylor_c_value: 350,
    specific_cutting_force_kc1: 450,
    density: 1.44,
    description: 'High-performance polymer with abrasive carbon strands. Requires diamond coated or razor-sharp carbide tools.',
  },
];

// Export generated 50 machines and 150 tools
export const MOCK_MACHINES: Machine[] = generateMachines();
export const MOCK_TOOLS: Tool[] = generateTools();

// ==========================================
// 4. ACTIVE OPERATIONS SIMULATION
// ==========================================
export const MOCK_ACTIVE_OPERATIONS: ActiveOperation[] = [
  {
    id: 'OP-101',
    job_name: 'Aero-Turbine Blisk Cavity Profiling',
    part_number: 'TB-6602-TI',
    machine_id: 'M01',
    tool_id: 'T001',
    material_id: 'MAT01',
    active_vc: 75,
    active_f: 0.08,
    active_ap: 3.5,
    active_ae: 6.0,
    time_in_cut: 42.5,
    current_wear_percentage: 54,
    current_flank_wear_vb: 0.19,
    status: 'running',
  },
  {
    id: 'OP-102',
    job_name: 'Avionics Chassis High-Speed Pocketing',
    part_number: 'AV-4100-AL',
    machine_id: 'M03',
    tool_id: 'T003',
    material_id: 'MAT04',
    active_vc: 420,
    active_f: 0.14,
    active_ap: 5.0,
    active_ae: 8.0,
    time_in_cut: 12.0,
    current_wear_percentage: 16,
    current_flank_wear_vb: 0.06,
    status: 'running',
  },
  {
    id: 'OP-103',
    job_name: 'Transmission Drive Flange Spline Milling',
    part_number: 'DF-901-STL',
    machine_id: 'M02',
    tool_id: 'T002',
    material_id: 'MAT08',
    active_vc: 165,
    active_f: 0.11,
    active_ap: 4.0,
    active_ae: 12.0,
    time_in_cut: 68.0,
    current_wear_percentage: 88,
    current_flank_wear_vb: 0.31,
    status: 'warning',
  },
  {
    id: 'OP-104',
    job_name: 'Orthopedic Femoral Hip Joint Surfacing',
    part_number: 'MED-774-TI',
    machine_id: 'M04',
    tool_id: 'T010',
    material_id: 'MAT01',
    active_vc: 85,
    active_f: 0.06,
    active_ap: 1.5,
    active_ae: 3.0,
    time_in_cut: 24.0,
    current_wear_percentage: 36,
    current_flank_wear_vb: 0.13,
    status: 'running',
  },
  {
    id: 'OP-105',
    job_name: 'Turbine Exhaust Manifold Flange Milling',
    part_number: 'EXH-718-INC',
    machine_id: 'M05',
    tool_id: 'T007',
    material_id: 'MAT18',
    active_vc: 240,
    active_f: 0.04,
    active_ap: 1.2,
    active_ae: 8.0,
    time_in_cut: 18.0,
    current_wear_percentage: 42,
    current_flank_wear_vb: 0.15,
    status: 'running',
  },
  {
    id: 'OP-106',
    job_name: 'Rocket Propellant Valve Body Contouring',
    part_number: 'RPV-2205-DUP',
    machine_id: 'M06',
    tool_id: 'T004',
    material_id: 'MAT17',
    active_vc: 110,
    active_f: 0.12,
    active_ap: 3.0,
    active_ae: 25.0,
    time_in_cut: 55.0,
    current_wear_percentage: 76,
    current_flank_wear_vb: 0.27,
    status: 'running',
  },
];
