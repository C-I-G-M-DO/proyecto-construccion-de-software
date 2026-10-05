import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reporte, ReportPeriod } from '@/types/reports';

export class ReportSessionError extends Error {}

async function getReportData(path: string, signal?: AbortSignal) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  const token = await AsyncStorage.getItem('token');
  if (!base || !token) throw new Error('No se pudo consultar el reporte.');
  const response = await fetch(`${base}/api/reports${path}`, { headers: { Authorization: `Bearer ${token}` }, signal });
  if (response.status === 401) {
    await AsyncStorage.multiRemove(['token', 'nombreColmado', 'surtio.user']);
    throw new ReportSessionError('Tu sesión venció. Inicia sesión nuevamente.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new Error('No pudimos cargar este reporte. Inténtalo de nuevo.');
  return data;
}

export async function fetchReport(period: ReportPeriod, signal?: AbortSignal): Promise<Reporte> {
  const data = await getReportData(`?desde=${encodeURIComponent(period.desde)}&hasta=${encodeURIComponent(period.hasta)}`, signal);
  const report = data.reporte ?? data;
  if (typeof report !== 'object' || !report || Array.isArray(report)) throw new Error('No pudimos leer el reporte.');
  return report;
}

export async function fetchDailyReports(signal?: AbortSignal): Promise<Reporte[]> {
  const data = await getReportData('/daily', signal);
  const reports = data.reportes ?? data;
  if (!Array.isArray(reports)) throw new Error('No pudimos leer los reportes diarios.');
  return reports.filter(value => value && typeof value === 'object').sort((a, b) => String(b.fecha ?? '').localeCompare(String(a.fecha ?? '')));
}
