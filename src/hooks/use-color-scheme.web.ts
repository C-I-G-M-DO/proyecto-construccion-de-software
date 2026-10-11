import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-color-scheme: dark)';
const serverSnapshot = () => 'light' as const;
const snapshot = () => window.matchMedia(QUERY).matches ? 'dark' as const : 'light' as const;
function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Stable server markup and consistent updates when the system theme changes. */
export function useColorScheme() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
