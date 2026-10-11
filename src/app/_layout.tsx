import { CartProvider } from "@/context/cart_context";
import { NotificationProvider } from "@/context/notification-context";
import { ProductProvider } from "@/context/product_context";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.setOptions({ duration: 350, fade: true });

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS === "web") {
      document.getElementById("surtio-boot")?.remove();
    }
  }, []);

  const navigation = (
    <>
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );

  // The public demo never mounts session, inventory or notification providers.
  if (
    Platform.OS === "web" &&
    ["/demo", "/demo-empresas"].includes(pathname.replace(/\/+$/, ""))
  ) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        {navigation}
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProductProvider>
        <CartProvider>
          <NotificationProvider>{navigation}</NotificationProvider>
        </CartProvider>
      </ProductProvider>
    </GestureHandlerRootView>
  );
}
