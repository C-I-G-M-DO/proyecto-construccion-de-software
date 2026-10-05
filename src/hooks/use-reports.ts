import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { fetchDailyReports, fetchReport, ReportSessionError } from '@/services/reports';
import type { Reporte, ReportPeriod } from '@/types/reports';
import { dateKey } from '@/utils/dates';

export function useReports() {
  const [today, setToday] = useState<Reporte | null>(null);
  const [daily, setDaily] = useState<Reporte[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ report: Reporte; period: ReportPeriod } | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const bootRequest = useRef<AbortController | null>(null), rangeRequest = useRef<AbortController | null>(null);
  const handleError = (error: unknown) => {
    if (error instanceof ReportSessionError) router.replace('/login');
    return error instanceof Error ? error.message : 'No pudimos cargar el reporte.';
  };
  const reload = useCallback(async () => {
    bootRequest.current?.abort();
    const controller = new AbortController(); bootRequest.current = controller;
    setLoading(true); setError(null);
    const key = dateKey();
    const results = await Promise.allSettled([fetchReport({ desde: key, hasta: key }, controller.signal), fetchDailyReports(controller.signal)]);
    if (controller.signal.aborted) return;
    const [summary, history] = results;
    setToday(summary.status === 'fulfilled' ? summary.value : null);
    setDaily(history.status === 'fulfilled' ? history.value : []);
    if (summary.status === 'rejected') setError(handleError(summary.reason));
    if (history.status === 'rejected') setError(handleError(history.reason));
    setLoading(false);
  }, []);
  const clearRange = () => { rangeRequest.current?.abort(); setResult(null); setRangeError(null); setRangeLoading(false); };
  const generate = async (period: ReportPeriod) => {
    rangeRequest.current?.abort();
    const controller = new AbortController(); rangeRequest.current = controller;
    setRangeLoading(true); setRangeError(null); setResult(null);
    try {
      const report = await fetchReport(period, controller.signal);
      if (!controller.signal.aborted) setResult({ report, period });
    } catch (error) { if (!controller.signal.aborted) setRangeError(handleError(error)); }
    finally { if (!controller.signal.aborted) setRangeLoading(false); }
  };
  useFocusEffect(useCallback(() => {
    setToday(null); setDaily([]); clearRange(); void reload();
    return () => { bootRequest.current?.abort(); rangeRequest.current?.abort(); };
  }, [reload]));
  return { today, daily, error, loading, reload, result, rangeError, rangeLoading, generate, clearRange };
}
