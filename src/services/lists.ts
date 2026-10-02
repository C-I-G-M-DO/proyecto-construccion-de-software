import AsyncStorage from '@react-native-async-storage/async-storage';

/** Read an authenticated collection using the existing backend routes. */
export async function fetchList<T>(resource: 'sales' | 'products', signal?: AbortSignal): Promise<T[]> {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) throw new Error('Falta configurar la dirección del backend.');
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Inicia sesión para consultar tus datos.');
  const response = await fetch(`${base}/api/${resource}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `No se pudieron consultar los datos (HTTP ${response.status}).`);
  if (!Array.isArray(data)) throw new Error('El servidor devolvió un formato inesperado.');
  return data;
}
