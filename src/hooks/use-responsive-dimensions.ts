import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/** Static HTML and the first browser render must select the same layout. */
export function useResponsiveDimensions() {
  const dimensions = useWindowDimensions();
  const [hydrated, setHydrated] = useState(Platform.OS !== 'web');
  useEffect(() => setHydrated(true), []);
  return hydrated ? dimensions : { ...dimensions, width: 1024, height: 768 };
}
