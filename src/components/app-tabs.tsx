import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useSurtioTheme } from '@/hooks/use-surtio-theme';

export default function AppTabs() {
  const theme = useSurtioTheme();
  return (
    <NativeTabs tintColor={theme.primary}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'house',
            selected: 'house.fill',
          }}
          md="home"
        />

        <NativeTabs.Trigger.Label>
          Inicio
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'clock',
            selected: 'clock.fill',
          }}
          md="history"
        />

        <NativeTabs.Trigger.Label>
          Historial
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dispatch">
        <NativeTabs.Trigger.Icon sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }} md="local_shipping" />
        <NativeTabs.Trigger.Label>Despacho</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <NativeTabs.Trigger.Icon sf={{ default: 'bell', selected: 'bell.fill' }} md="notifications" />
        <NativeTabs.Trigger.Label>Alertas</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
