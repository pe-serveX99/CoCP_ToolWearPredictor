-- ==============================================================================
-- CNC Tool Wear & Optimization Platform - Supabase PostgreSQL Schema Migration
-- Migration: 20261002000000_cnc_schema.sql
-- Description: Creates schema for Machines, Tools, Materials, and Active Operations
-- ==============================================================================

-- 1. MACHINES TABLE
CREATE TABLE IF NOT EXISTS public.machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('5-axis', '3-axis lathe', '3-axis VMC', '5-axis Mill-Turn')),
    max_rpm INTEGER NOT NULL CHECK (max_rpm > 0),
    max_spindle_power NUMERIC(8, 2) NOT NULL CHECK (max_spindle_power > 0),
    coolant_options TEXT[] NOT NULL DEFAULT '{}',
    spindle_taper TEXT,
    max_feed_rate INTEGER,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TOOLS TABLE
CREATE TABLE IF NOT EXISTS public.tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('end mill', 'face mill', 'insert', 'ball nose', 'drill')),
    material TEXT NOT NULL CHECK (material IN ('carbide', 'ceramic', 'cbn', 'hss', 'diamond')),
    diameter NUMERIC(8, 2) NOT NULL CHECK (diameter > 0),
    flute_count INTEGER NOT NULL CHECK (flute_count > 0),
    taylor_n_value NUMERIC(6, 4) NOT NULL CHECK (taylor_n_value > 0),
    cost NUMERIC(10, 2) NOT NULL CHECK (cost >= 0),
    coating TEXT NOT NULL,
    max_overhang_mm NUMERIC(8, 2) NOT NULL,
    max_depth_of_cut NUMERIC(8, 2) NOT NULL,
    recommended_vc_min NUMERIC(8, 2) NOT NULL,
    recommended_vc_max NUMERIC(8, 2) NOT NULL,
    recommended_feed_min NUMERIC(6, 4) NOT NULL,
    recommended_feed_max NUMERIC(6, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    material_name TEXT NOT NULL,
    category TEXT NOT NULL,
    hardness_brinell INTEGER NOT NULL CHECK (hardness_brinell > 0),
    machinability_rating NUMERIC(6, 2) NOT NULL CHECK (machinability_rating > 0),
    taylor_c_value NUMERIC(8, 2) NOT NULL CHECK (taylor_c_value > 0),
    specific_cutting_force_kc1 NUMERIC(8, 2) NOT NULL CHECK (specific_cutting_force_kc1 > 0),
    density NUMERIC(6, 3) NOT NULL CHECK (density > 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ACTIVE OPERATIONS TABLE
CREATE TABLE IF NOT EXISTS public.active_operations (
    id TEXT PRIMARY KEY,
    job_name TEXT NOT NULL,
    part_number TEXT NOT NULL,
    machine_id TEXT REFERENCES public.machines(id) ON DELETE SET NULL,
    tool_id TEXT REFERENCES public.tools(id) ON DELETE SET NULL,
    material_id TEXT REFERENCES public.materials(id) ON DELETE SET NULL,
    active_vc NUMERIC(8, 2) NOT NULL,
    active_f NUMERIC(6, 4) NOT NULL,
    active_ap NUMERIC(8, 2) NOT NULL,
    active_ae NUMERIC(8, 2),
    time_in_cut NUMERIC(8, 2) NOT NULL DEFAULT 0,
    current_wear_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    current_flank_wear_vb NUMERIC(6, 4) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('running', 'idle', 'warning', 'tool_change_needed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_machines_type ON public.machines(type);
CREATE INDEX IF NOT EXISTS idx_tools_category ON public.tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_material ON public.tools(material);
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_active_operations_status ON public.active_operations(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_operations ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted read access for client applications
CREATE POLICY "Allow public read access on machines" ON public.machines FOR SELECT USING (true);
CREATE POLICY "Allow public read access on tools" ON public.tools FOR SELECT USING (true);
CREATE POLICY "Allow public read access on materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Allow public read access on active_operations" ON public.active_operations FOR SELECT USING (true);

-- Allow insert/update/delete access for seed scripts and operators
CREATE POLICY "Allow full access on machines" ON public.machines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on tools" ON public.tools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on active_operations" ON public.active_operations FOR ALL USING (true) WITH CHECK (true);
