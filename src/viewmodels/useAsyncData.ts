// Small helper used by the ViewModels: runs an async loader and exposes
// loading / error / success state plus a retry function.

import { useCallback, useEffect, useRef, useState } from 'react';
import { toUserMessage } from '@/services/productService';

export type LoadStatus = 'loading' | 'success' | 'error';

export interface AsyncData<T> {
  status: LoadStatus;
  data: T | null;
  error: string | null;
  refreshing: boolean;
  reload: () => void;
  refresh: () => void;
}

export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[]): AsyncData<T> {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const id = ++requestId.current;
      if (mode === 'refresh') setRefreshing(true);
      else setStatus('loading');
      try {
        const result = await loader();
        if (id !== requestId.current) return; // a newer request replaced this one
        setData(result);
        setError(null);
        setStatus('success');
      } catch (e) {
        if (id !== requestId.current) return;
        setError(toUserMessage(e));
        setStatus('error');
      } finally {
        if (id === requestId.current) setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    load('initial');
    return () => {
      requestId.current++; // ignore results that arrive after the screen closes
    };
  }, [load]);

  return {
    status,
    data,
    error,
    refreshing,
    reload: () => load('initial'),
    refresh: () => load('refresh'),
  };
}
