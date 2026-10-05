import { StyleSheet } from 'react-native';

export const startupStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#30251D' },
  backdrop: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: 0.4 },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(30, 20, 14, 0.4)' },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  footer: { marginTop: 'auto', paddingHorizontal: 24, alignItems: 'center' },
  notice: {
    maxWidth: 420, alignItems: 'center', gap: 12, paddingVertical: 16,
    paddingHorizontal: 22, borderRadius: 20, backgroundColor: 'rgba(30, 20, 14, 0.8)',
  },
  text: { color: '#FFFFFF', textAlign: 'center', fontSize: 15 },
  retry: { minHeight: 44, paddingHorizontal: 22, justifyContent: 'center', borderRadius: 12, backgroundColor: '#B90000' },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
