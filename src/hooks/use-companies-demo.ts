import { useEffect, useRef, useState } from 'react';
import type { CompaniesDemoState, DemoStore } from '@/types/companies';
import { COMPANIES_DEMO_KEY, restoreCompaniesDemo } from '@/utils/companies-demo';

export function useCompaniesDemo(stores: DemoStore[]) {
  const [state, setState] = useState<CompaniesDemoState | null>(null), [warning, setWarning] = useState<string | null>(null);
  const current = useRef<CompaniesDemoState | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPANIES_DEMO_KEY), restored = restoreCompaniesDemo(raw, stores);
      current.current = restored ?? { version: 1, campaigns: [], interests: [] }; setState(current.current);
      if (raw && !restored) setWarning('Restablecimos las campañas de prueba porque la copia guardada no era válida.');
    } catch { current.current = { version: 1, campaigns: [], interests: [] }; setState(current.current); setWarning('Los cambios de prueba durarán mientras mantengas esta página abierta.'); }
  }, [stores]);
  const update = (change: (state: CompaniesDemoState) => CompaniesDemoState) => {
    if (!current.current) return;
    current.current = change(current.current); setState(current.current);
    try { localStorage.setItem(COMPANIES_DEMO_KEY, JSON.stringify(current.current)); }
    catch { setWarning('No pudimos guardar estos cambios en el navegador.'); }
  };
  return { state, update, warning };
}
