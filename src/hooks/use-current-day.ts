import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export function useCurrentDay() {
  const [day, setDay] = useState<Date | null>(() => Platform.OS === 'web' ? null : new Date());
  useFocusEffect(useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      const now = new Date();
      setDay(now);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(update, midnight.getTime() - now.getTime() + 100);
    };
    update();
    return () => clearTimeout(timer);
  }, []));
  return day;
}
