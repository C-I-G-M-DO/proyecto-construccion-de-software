import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useCart } from "../context/cart_context";
import { useProducts } from "../context/product_context";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env');
}

export default function CartScreen() {
  const router = useRouter();

  const { carrito, eliminarDelCarrito, total, vaciarCarrito } = useCart();

  const { obtenerProductos } = useProducts();

  const [loading, setLoading] = useState(false);

  const background = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const card = useThemeColor({}, "card");
  const border = useThemeColor({}, "border");
  const primary = useThemeColor({}, "primary");

  // 🔥 REALIZAR VENTA
  const realizarVenta = async () => {
    if (loading) return;

    if (carrito.length === 0) {
      Alert.alert("Carrito vacío");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Sesión expirada");
        return;
      }

      const response = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: carrito,
          subtotal: total,
          metodoPago: "efectivo",
        }),
      });

      const textResponse = await response.text();

      let data: any = {};
      try {
        data = textResponse ? JSON.parse(textResponse) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        Alert.alert("Error", data.message || "No se pudo realizar la venta");
        return;
      }

      //  limpiar carrito
      vaciarCarrito();

      //  actualizar inventario
      await obtenerProductos();

      Alert.alert("Éxito", "Venta realizada");

      router.replace("/history");
    } catch (error) {
      console.log("ERROR VENTA:", error);
      Alert.alert("Error", "No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: background,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: text,
          marginBottom: 10,
        }}
      >
        Carrito
      </Text>

      <FlatList
        data={carrito}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text
            style={{
              color: text,
              marginTop: 30,
              textAlign: "center",
            }}
          >
            No hay productos en el carrito
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              marginTop: 10,
              backgroundColor: card,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: border,
            }}
          >
            <Text
              style={{
                color: text,
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {item.nombre}
            </Text>

            <Text style={{ color: text }}>
              {item.cantidad} x ${item.precio} ({item.tipo})
            </Text>

            <Text
              style={{
                color: text,
                fontWeight: "bold",
                marginTop: 5,
              }}
            >
              Total: ${item.total}
            </Text>

            <TouchableOpacity
              onPress={() => eliminarDelCarrito(item.id)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "red" }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text
        style={{
          fontSize: 22,
          marginTop: 10,
          fontWeight: "bold",
          color: text,
        }}
      >
        Total: ${total}
      </Text>

      <TouchableOpacity
        disabled={loading}
        onPress={realizarVenta}
        style={{
          backgroundColor: loading ? "#999" : primary,
          padding: 16,
          borderRadius: 14,
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          {loading ? "Procesando..." : `Vender ($${total})`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
