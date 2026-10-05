import Ionicons from '@/components/ui/business-icon';
import { router, Slot, useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useResponsiveDimensions } from '@/hooks/use-responsive-dimensions';
import { BrandMark } from '@/components/business-ui';
import { readSessionProfile, type SessionProfile } from '@/hooks/session-profile';
import { useSurtioTheme } from '@/hooks/use-surtio-theme';
import { adminStyles as s } from '@/styles/admin.styles';

const NAVIGATION = [
  { label: 'Inicio', icon: 'home-outline', route: '/home' },
  { label: 'Historial', icon: 'receipt-outline', route: '/history' },
  { label: 'Alertas', icon: 'notifications-outline', route: '/alerts' },
  { label: 'Reportes', icon: 'bar-chart-outline', route: '/reports' },
  { label: 'Perfil', icon: 'person-circle-outline', route: '/profile' },
] as const;

export default function WebTabsLayout() {
  const t = useSurtioTheme(), pathname = usePathname(), { width } = useResponsiveDimensions();
  const [profile, setProfile] = useState<SessionProfile>({});
  const compact = width < 900;
  useFocusEffect(useCallback(() => {
    let active = true;
    void readSessionProfile().then(value => { if (active) setProfile(value); }).catch(() => {});
    return () => { active = false; };
  }, []));
  const links = NAVIGATION.map(item => {
    const active = pathname === item.route;
    return <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: active }} onPress={() => router.navigate(item.route)} style={[s.navItem, { backgroundColor: active ? t.button : 'transparent' }]}>
      <Ionicons name={item.icon} size={21} color={active ? '#FFFFFF' : t.secondary} />
      <Text style={{ color: active ? '#FFFFFF' : t.text, fontWeight: '600', fontSize: 15 }}>{item.label}</Text>
    </Pressable>;
  });
  return <View style={[s.screen, { backgroundColor: t.background }]}>
    {!compact && <View style={[s.sidebar, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={s.brand}><BrandMark size={48} /><View style={{ flex: 1, gap: 6 }}><Text style={{ color: t.text, fontSize: 23, fontWeight: '700' }}>Surtío</Text><Text numberOfLines={1} style={{ color: t.secondary }}>{profile.businessName || 'Mi negocio'}</Text></View></View>
      <View style={[s.navigation, { borderColor: t.border }]}>{links}</View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir mi perfil" onPress={() => router.navigate('/profile')} style={[s.account, { backgroundColor: t.muted }]}>
        <Ionicons name="person-circle-outline" size={32} color={t.primary} /><View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={{ color: t.text, fontWeight: '600' }}>{profile.name || 'Mi cuenta'}</Text><Text style={{ color: t.secondary, fontSize: 12 }}>Administración</Text></View>
      </Pressable>
    </View>}
    <View style={s.workspace}>
      <View style={[s.topbar, { backgroundColor: t.card, borderColor: t.border }]}>
        {compact ? <><View style={s.compactBrand}><BrandMark size={32} /><Text style={{ color: t.text, fontSize: 20, fontWeight: '700' }}>Surtío</Text></View><View style={s.compactNav}>{links}</View></> : <><Text style={{ color: t.secondary }}>Surtío / {NAVIGATION.find(item => item.route === pathname)?.label || 'Inicio'}</Text><Text numberOfLines={1} style={{ color: t.text, fontWeight: '600', maxWidth: '50%' }}>{profile.businessName || 'Administración del negocio'}</Text></>}
      </View>
      <View style={s.content}><Slot /></View>
    </View>
  </View>;
}
