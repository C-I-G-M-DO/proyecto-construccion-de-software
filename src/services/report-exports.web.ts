import type { Reporte, ReportPeriod } from '@/types/reports';
import { reportHtml, reportRows } from '@/utils/report-content';
import { formatDate } from '@/utils/dates';

export async function exportExcel(report: Reporte, period: ReportPeriod) {
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.aoa_to_sheet([
    ['SURTÍO', 'Reporte de ventas'], ['Período', `${formatDate(period.desde)} - ${formatDate(period.hasta)}`], [], ...reportRows(report),
  ]);
  sheet['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Reporte');
  XLSX.writeFile(workbook, `reporte_surtio_${period.desde}_${period.hasta}.xlsx`);
}

let printFrame: HTMLIFrameElement | null = null;
/** Isolate the report: Expo Print on web prints the current page instead of the supplied HTML. */
export function exportPDF(report: Reporte, period: ReportPeriod): Promise<void> {
  printFrame?.remove();
  const frame = document.createElement('iframe');
  printFrame = frame;
  frame.title = 'Reporte de ventas para imprimir';
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:1000px;border:0;';
  return new Promise((resolve, reject) => {
    frame.onload = () => {
      const target = frame.contentWindow;
      if (!target) { frame.remove(); reject(new Error('No se pudo abrir el reporte.')); return; }
      target.addEventListener('afterprint', () => { frame.remove(); if (printFrame === frame) printFrame = null; }, { once: true });
      try { target.focus(); target.print(); resolve(); } catch (error) { frame.remove(); reject(error); }
    };
    frame.srcdoc = reportHtml(report, period);
    document.body.appendChild(frame);
  });
}
