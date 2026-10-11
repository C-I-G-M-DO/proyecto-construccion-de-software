import { useEffect, useRef, useState } from 'react';
import type { DemoState } from '@/types/demo';
import { createDemoState, DEMO_STORAGE_KEY, restoreDemoState } from '@/utils/demo';

/** Browser-only sandbox with a separate key; never reads credentials or calls APIs. */
export function useDemo() {
  const [state, setState] = useState<DemoState | null>(null);
  const current = useRef<DemoState | null>(null);
  const install = (next: DemoState) => { current.current = next; setState(next); };
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY), restored = restoreDemoState(raw);
      install(restored ?? createDemoState());
      if (raw && !restored) setStorageWarning('Restablecimos los datos de ejemplo porque la copia guardada no era válida.');
    } catch { install(createDemoState()); setStorageWarning('Puedes probar la demo, pero este navegador no permite guardar tus cambios.'); }
  }, []);
  useEffect(() => {
    if (!state) return;
    try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); }
    catch { setStorageWarning('Tus cambios duran mientras mantengas esta página abierta.'); }
  }, [state]);
  const update = (change: (value: DemoState) => DemoState) => {
    if (!current.current) throw new Error('Espera mientras se prepara la demo.');
    install(change(current.current));
  };
  return { state, update, storageWarning };
}
