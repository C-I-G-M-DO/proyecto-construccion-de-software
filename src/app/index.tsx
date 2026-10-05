import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StartupSplash } from '@/components/startup-splash';

export default function IndexScreen() {
  const { notification } = useLocalSearchParams<{ notification?: string }>();
  const [destination, setDestination] = useState<'/home' | '/login' | '/alerts' | null>(null);
  const [canNavigate, setCanNavigate] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    AsyncStorage.getItem('token').then((token) => {
      if (active) setDestination(token ? notification === 'expiry' ? '/alerts' : '/home' : '/login');
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [attempt, notification]);

  const finishStartup = useCallback(() => setCanNavigate(true), []);

  if (canNavigate && destination) return <Redirect href={destination} />;
  return <StartupSplash
    ready={destination !== null}
    failed={failed}
    onRetry={() => setAttempt(value => value + 1)}
    onFinish={finishStartup}
  />;
}
