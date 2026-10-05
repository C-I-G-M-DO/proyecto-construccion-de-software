import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { fetchList } from '@/services/lists';

export function useFocusedList<T>(resource: 'sales' | 'products') {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError(null);
    try {
      const values = await fetchList<T>(resource, controller.signal);
      if (!controller.signal.aborted) setData(values);
    } catch {
      if (!controller.signal.aborted) setError(resource === 'sales' ? 'No pudimos cargar las ventas. Inténtalo de nuevo.' : 'No pudimos cargar los productos. Inténtalo de nuevo.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [resource]);
  useFocusEffect(useCallback(() => {
    setData([]);
    void reload();
    return () => request.current?.abort();
  }, [reload]));
  return { data, loading, error, reload };
}
