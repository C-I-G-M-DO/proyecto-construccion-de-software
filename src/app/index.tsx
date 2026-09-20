import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export default function IndexScreen() {
  const [destination, setDestination] = useState<'/home' | '/login' | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    AsyncStorage.getItem('token').then((token) => {
      if (active) setDestination(token ? '/home' : '/login');
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [attempt]);

  if (destination) return <Redirect href={destination} />;
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F7F7F7', gap: 16 }}>
    {failed ? <>
      <Text>No se pudo recuperar la sesión guardada.</Text>
      <Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={{ padding: 16 }}>
        <Text style={{ color: '#C00000' }}>Reintentar</Text>
      </Pressable>
    </> : <ActivityIndicator color="#C00000" size="large" />}
  </View>;
}
