'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Machine, Tool, WorkpieceMaterial, ActiveOperation } from '../types/cnc';
import {
  MOCK_MACHINES,
  MOCK_TOOLS,
  MOCK_MATERIALS,
  MOCK_ACTIVE_OPERATIONS,
} from '../data/mock-cnc';
import {
  fetchMachines,
  fetchTools,
  fetchMaterials,
  fetchActiveOperations,
} from '../lib/supabase';

interface CncDataContextType {
  machines: Machine[];
  tools: Tool[];
  materials: WorkpieceMaterial[];
  activeOperations: ActiveOperation[];
  isLoading: boolean;
  isLive: boolean; // True if data is actively populated from Supabase PostgreSQL
  error: string | null;
  refreshData: () => Promise<void>;
}

const CncDataContext = createContext<CncDataContextType>({
  machines: MOCK_MACHINES,
  tools: MOCK_TOOLS,
  materials: MOCK_MATERIALS,
  activeOperations: MOCK_ACTIVE_OPERATIONS,
  isLoading: true,
  isLive: false,
  error: null,
  refreshData: async () => {},
});

export const CncDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [machines, setMachines] = useState<Machine[]>(MOCK_MACHINES);
  const [tools, setTools] = useState<Tool[]>(MOCK_TOOLS);
  const [materials, setMaterials] = useState<WorkpieceMaterial[]>(MOCK_MATERIALS);
  const [activeOperations, setActiveOperations] = useState<ActiveOperation[]>(MOCK_ACTIVE_OPERATIONS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parallel fetch from Supabase
      const [mRes, tRes, matRes, opRes] = await Promise.all([
        fetchMachines(),
        fetchTools(),
        fetchMaterials(),
        fetchActiveOperations(),
      ]);

      let hasLiveData = false;

      if (mRes.isLive && mRes.data && mRes.data.length > 0) {
        setMachines(mRes.data);
        hasLiveData = true;
      } else {
        setMachines(MOCK_MACHINES);
      }

      if (tRes.isLive && tRes.data && tRes.data.length > 0) {
        setTools(tRes.data);
        hasLiveData = true;
      } else {
        setTools(MOCK_TOOLS);
      }

      if (matRes.isLive && matRes.data && matRes.data.length > 0) {
        setMaterials(matRes.data);
        hasLiveData = true;
      } else {
        setMaterials(MOCK_MATERIALS);
      }

      if (opRes.isLive && opRes.data && opRes.data.length > 0) {
        setActiveOperations(opRes.data);
        hasLiveData = true;
      } else {
        setActiveOperations(MOCK_ACTIVE_OPERATIONS);
      }

      setIsLive(hasLiveData);

      // Collect any error messages
      const errors = [mRes.error, tRes.error, matRes.error, opRes.error].filter(Boolean);
      if (errors.length > 0) {
        setError(errors[0]?.message || 'Some tables could not be loaded from Supabase.');
      } else if (!hasLiveData) {
        setError('Supabase tables are empty or awaiting SQL migration. Using verified local catalog fallback.');
      }
    } catch (err: any) {
      console.warn('Supabase fetch failed, falling back to local dataset:', err);
      setError(err?.message || 'Failed to connect to Supabase.');
      setIsLive(false);
      setMachines(MOCK_MACHINES);
      setTools(MOCK_TOOLS);
      setMaterials(MOCK_MATERIALS);
      setActiveOperations(MOCK_ACTIVE_OPERATIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <CncDataContext.Provider
      value={{
        machines,
        tools,
        materials,
        activeOperations,
        isLoading,
        isLive,
        error,
        refreshData: loadAllData,
      }}
    >
      {children}
    </CncDataContext.Provider>
  );
};

export const useCncData = () => useContext(CncDataContext);
