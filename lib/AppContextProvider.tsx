'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { VoltraContext, ActivityType } from './context';
import { defaultContext } from './context';

interface AppContextValue {
  ctx: VoltraContext;
  setCtx: (ctx: VoltraContext) => void;
  save: (ctx: VoltraContext) => Promise<void>;
  saveWithActivity: (ctx: VoltraContext, activity: { type: ActivityType; description: string; metadata?: Record<string, unknown> }) => Promise<void>;
  logActivity: (type: ActivityType, description: string, metadata?: Record<string, unknown>) => void;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtxState] = useState<VoltraContext>(defaultContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch context from Redis - only once on initial load
  const fetchContext = useCallback(async () => {
    // If already fetched and not explicitly refreshing, use cached data
    if (hasFetched && !isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/context');
      const data = await res.json();

      if (data.success && data.context) {
        setCtxState(data.context);
        localStorage.setItem('voltra-context', JSON.stringify(data.context));
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('voltra-context');
        if (saved) {
          setCtxState(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error('Failed to fetch context:', err);
      const saved = localStorage.getItem('voltra-context');
      if (saved) {
        try {
          setCtxState(JSON.parse(saved));
        } catch {
          // ignore parse error
        }
      }
      setError('Using local data - Redis unavailable');
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [hasFetched, isLoading]);

  // Force refresh from Redis (used after updates)
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/context');
      const data = await res.json();

      if (data.success && data.context) {
        setCtxState(data.context);
        localStorage.setItem('voltra-context', JSON.stringify(data.context));
      }
    } catch (err) {
      console.error('Failed to refresh context:', err);
      setError('Failed to refresh from Redis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (!hasFetched) {
      fetchContext();
    }
  }, [fetchContext, hasFetched]);

  // Save context to Redis
  const save = useCallback(async (newCtx: VoltraContext) => {
    const updatedCtx = { ...newCtx, lastUpdated: new Date().toISOString() };

    // Optimistically update local state
    setCtxState(updatedCtx);
    localStorage.setItem('voltra-context', JSON.stringify(updatedCtx));

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: updatedCtx }),
      });

      const data = await res.json();

      if (!data.success) {
        setError('Failed to save to Redis - saved locally');
      }
    } catch (err) {
      console.error('Failed to save context:', err);
      setError('Failed to save to Redis - saved locally');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const setCtx = useCallback((newCtx: VoltraContext) => {
    setCtxState(newCtx);
  }, []);

  // Helper to create an activity log entry
  const createActivityEntry = useCallback((
    type: ActivityType,
    description: string,
    metadata?: Record<string, unknown>
  ) => ({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    type,
    description,
    metadata,
  }), []);

  // Log activity without saving (for batching)
  const logActivity = useCallback((
    type: ActivityType,
    description: string,
    metadata?: Record<string, unknown>
  ) => {
    setCtxState(prev => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), createActivityEntry(type, description, metadata)],
    }));
  }, [createActivityEntry]);

  // Save context with an activity log entry
  const saveWithActivity = useCallback(async (
    newCtx: VoltraContext,
    activity: { type: ActivityType; description: string; metadata?: Record<string, unknown> }
  ) => {
    const entry = createActivityEntry(activity.type, activity.description, activity.metadata);
    const ctxWithActivity = {
      ...newCtx,
      activityLog: [...(newCtx.activityLog || []), entry],
    };
    await save(ctxWithActivity);
  }, [save, createActivityEntry]);

  return (
    <AppContext.Provider
      value={{
        ctx,
        setCtx,
        save,
        saveWithActivity,
        logActivity,
        isLoading,
        isSaving,
        error,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}
