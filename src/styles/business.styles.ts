import { StyleSheet } from 'react-native';

export const businessStyles = StyleSheet.create({
  page: { width: '100%', maxWidth: 1260, alignSelf: 'center', padding: 24, paddingBottom: 40, gap: 24 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E2E1', borderRadius: 18, padding: 20, gap: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  title: { color: '#1B1B1C', fontSize: 28, fontWeight: '700' },
  heading: { color: '#1B1B1C', fontSize: 20, fontWeight: '700' },
  text: { color: '#1B1B1C', fontSize: 15, lineHeight: 22 },
  muted: { color: '#5D3F3B', fontSize: 14, lineHeight: 21 },
  label: { color: '#5D3F3B', fontSize: 13, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#E5E2E1', backgroundColor: '#FCF9F8', color: '#1B1B1C', borderRadius: 12, padding: 12, fontSize: 15 },
  button: { minHeight: 48, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#C00000', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  link: { color: '#C00000', fontWeight: '600', fontSize: 14 },
  chip: { minHeight: 44, borderRadius: 22, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#F0EDED' },
  metric: { flexGrow: 1, flexBasis: 220, minWidth: 0 },
  metricValue: { color: '#1B1B1C', fontSize: 30, fontWeight: '700' },
});
