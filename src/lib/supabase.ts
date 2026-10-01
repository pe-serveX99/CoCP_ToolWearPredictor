import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Machine, Tool, WorkpieceMaterial, ActiveOperation } from '../types/cnc';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn('Supabase URL or Anon Key is missing from environment variables.');
    }
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export interface SupabaseFetchResult<T> {
  data: T[] | null;
  error: Error | null;
  isLive: boolean;
}

/**
 * Fetch all machines from Supabase
 */
export async function fetchMachines(): Promise<SupabaseFetchResult<Machine>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized'), isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching machines from Supabase:', error);
      return { data: null, error: new Error(error.message), isLive: false };
    }

    return { data: (data as Machine[]) || [], error: null, isLive: true };
  } catch (err) {
    console.error('Unexpected error fetching machines:', err);
    return { data: null, error: err as Error, isLive: false };
  }
}

/**
 * Fetch all tools from Supabase
 */
export async function fetchTools(): Promise<SupabaseFetchResult<Tool>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized'), isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tools from Supabase:', error);
      return { data: null, error: new Error(error.message), isLive: false };
    }

    return { data: (data as Tool[]) || [], error: null, isLive: true };
  } catch (err) {
    console.error('Unexpected error fetching tools:', err);
    return { data: null, error: err as Error, isLive: false };
  }
}

/**
 * Fetch all workpiece materials from Supabase
 */
export async function fetchMaterials(): Promise<SupabaseFetchResult<WorkpieceMaterial>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized'), isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching materials from Supabase:', error);
      return { data: null, error: new Error(error.message), isLive: false };
    }

    return { data: (data as WorkpieceMaterial[]) || [], error: null, isLive: true };
  } catch (err) {
    console.error('Unexpected error fetching materials:', err);
    return { data: null, error: err as Error, isLive: false };
  }
}

/**
 * Fetch active shop-floor operations from Supabase
 */
export async function fetchActiveOperations(): Promise<SupabaseFetchResult<ActiveOperation>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized'), isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('active_operations')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching operations from Supabase:', error);
      return { data: null, error: new Error(error.message), isLive: false };
    }

    return { data: (data as ActiveOperation[]) || [], error: null, isLive: true };
  } catch (err) {
    console.error('Unexpected error fetching operations:', err);
    return { data: null, error: err as Error, isLive: false };
  }
}
