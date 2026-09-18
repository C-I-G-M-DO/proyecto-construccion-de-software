import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function AppTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>
          Inicio
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          sf="house.fill"
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>
          Explorar
        </NativeTabs.Trigger.Label>

        <NativeTabs.Trigger.Icon
          sf="safari.fill"
          md="explore"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}