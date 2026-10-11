import { StatusBar } from 'expo-status-bar';
import { CartProvider } from '@/context/cart_context';
import { ProductProvider } from '@/context/product_context';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { NotificationProvider } from '@/context/notification-context';

SplashScreen.setOptions({ duration: 350, fade: true });

export default function RootLayout() {
  const pathname = usePathname();
  useEffect(() => { if (Platform.OS === 'web') document.getElementById('surtio-boot')?.remove(); }, []);
  const navigation = <><StatusBar style="auto" /><Stack screenOptions={{ headerShown: false, animation: 'fade' }}><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="(tabs)" /></Stack></>;
  // The public demo never mounts session, inventory or notification providers.
  if (Platform.OS === 'web' && ['/demo', '/demo-empresas'].includes(pathname.replace(/\/+$/, ''))) return navigation;
  return (
    <ProductProvider>
      <CartProvider>
        <NotificationProvider>
          {navigation}
        </NotificationProvider>
      </CartProvider>
    </ProductProvider>
  );
}
