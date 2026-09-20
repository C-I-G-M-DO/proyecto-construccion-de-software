import { StatusBar } from 'expo-status-bar';
import { CartProvider } from '@/context/cart_context';
import { ProductProvider } from '@/context/product_context';
import { Stack } from 'expo-router';

export default function RootLayout() {
 return (
  <ProductProvider>
    <CartProvider>
      <StatusBar style="auto" />
       <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
    </CartProvider>
  </ProductProvider>
);
}