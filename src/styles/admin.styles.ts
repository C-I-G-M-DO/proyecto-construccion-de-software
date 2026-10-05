import { StyleSheet } from 'react-native';

export const adminStyles = StyleSheet.create({
  screen: { flex: 1, flexDirection: 'row', minHeight: 0 },
  sidebar: { width: 250, borderRightWidth: 1, paddingBottom: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12, minHeight: 96 },
  navigation: { flex: 1, padding: 12, paddingTop: 20, borderTopWidth: 1, gap: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 48, borderRadius: 12 },
  account: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, borderRadius: 12, padding: 14, gap: 10 },
  workspace: { flex: 1, minWidth: 0, minHeight: 0 },
  topbar: { minHeight: 76, paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  compactBrand: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  compactNav: { width: '100%', flexShrink: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  content: { flex: 1, minHeight: 0 },
});
