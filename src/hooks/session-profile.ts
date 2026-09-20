import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionProfile = { name?: string; phone?: string; businessName?: string };

export async function readSessionProfile(): Promise<SessionProfile> {
  const [cached, token] = await Promise.all([AsyncStorage.getItem('surtio.user'), AsyncStorage.getItem('token')]);
  let user: SessionProfile = {};
  if (cached) {
    try {
      const value = JSON.parse(cached);
      for (const field of ['name', 'phone', 'businessName'] as const) {
        if (typeof value?.[field] === 'string') user[field] = value[field];
      }
    } catch { /* A malformed cache must not prevent session restoration. */ }
  }
  if (!user.phone && token) {
    try {
      const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let bits = 0, buffer = 0, decoded = '';
      for (const char of encoded.replace(/=+$/, '')) {
        const value = alphabet.indexOf(char);
        if (value < 0) throw new Error('Invalid session payload');
        buffer = (buffer << 6) | value;
        bits += 6;
        if (bits >= 8) {
          bits -= 8;
          decoded += String.fromCharCode((buffer >> bits) & 255);
          buffer &= (1 << bits) - 1;
        }
      }
      const payload = JSON.parse(decoded);
      // Display-only fallback for sessions created before the profile cache existed.
      // Authorization continues to be verified exclusively by the backend.
      if (typeof payload.phone === 'string') user.phone = payload.phone;
    } catch { /* Leave the field absent if the token cannot be decoded. */ }
  }
  return user;
}
