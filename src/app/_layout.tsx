import { StatusBar } from 'expo-status-bar';
import { CartProvider } from '@/context/cart_context';
import { ProductProvider } from '@/context/product_context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { NotificationProvider } from '@/context/notification-context';

SplashScreen.setOptions({ duration: 350, fade: true });

export default function RootLayout() {
  useEffect(() => { if (Platform.OS === 'web') document.getElementById('surtio-boot')?.remove(); }, []);
  return (
    <ProductProvider>
      <CartProvider>
        <NotificationProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </NotificationProvider>
      </CartProvider>
    </ProductProvider>
  );
}
