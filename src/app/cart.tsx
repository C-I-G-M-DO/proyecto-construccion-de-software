import { useThemeColor } from "@/hooks/use-theme-color";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

import { useCart } from "../context/cart_context";
import { useProducts } from "../context/product_context";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("Falta EXPO_PUBLIC_API_URL en el archivo .env");
}

export default function CartScreen() {
  const router = useRouter();

  const {
    carrito,
    agregarAlCarrito,
    disminuirDelCarrito,
    eliminarDelCarrito,
    total,
    vaciarCarrito,
  } = useCart();

  const { obtenerProductos } = useProducts();

  const [loading, setLoading] = useState(false);

  const background = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const card = useThemeColor({}, "card");
  const border = useThemeColor({}, "border");
  const primary = useThemeColor({}, "primary");

  // ============================================================
  // REALIZAR VENTA
  // ============================================================
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

      // Limpiar carrito
      vaciarCarrito();

      // Actualizar inventario desde MongoDB
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
        contentContainerStyle={{
          paddingBottom: 20,
        }}
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
            {/* NOMBRE */}
            <Text
              style={{
                color: text,
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {item.nombre}
            </Text>

            {/* TIPO Y PRECIO */}
            <Text
              style={{
                color: text,
                marginTop: 4,
              }}
            >
              ${item.precio} ({item.tipo})
            </Text>

            {/* CONTROLES DE CANTIDAD */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              {/* MENOS */}
              <TouchableOpacity
                onPress={() => disminuirDelCarrito(item)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: text,
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  −
                </Text>
              </TouchableOpacity>

              {/* CANTIDAD */}
              <Text
                style={{
                  color: text,
                  fontSize: 20,
                  fontWeight: "bold",
                  marginHorizontal: 20,
                  minWidth: 30,
                  textAlign: "center",
                }}
              >
                {item.cantidad}
              </Text>

              {/* MÁS */}
              <TouchableOpacity
                onPress={() => agregarAlCarrito(item)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>

            {/* TOTAL DEL ITEM */}
            <Text
              style={{
                color: text,
                fontWeight: "bold",
                marginTop: 10,
                fontSize: 16,
              }}
            >
              Total: ${item.total}
            </Text>

            {/* ELIMINAR */}
            <TouchableOpacity
              onPress={() => eliminarDelCarrito(item.id)}
              style={{
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  color: "red",
                  fontWeight: "600",
                }}
              >
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* TOTAL GENERAL */}
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

      {/* REALIZAR VENTA */}
      <TouchableOpacity
        disabled={loading || carrito.length === 0}
        onPress={realizarVenta}
        style={{
          backgroundColor: loading || carrito.length === 0 ? "#999" : primary,
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
