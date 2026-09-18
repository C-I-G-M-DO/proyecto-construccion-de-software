import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeColor } from "../../hooks/use-theme-color";

type Venta = {
  _id: string;
  numeroOrden: number;
  subtotal: number;
  metodoPago?: string;
  createdAt: string;

  items: {
    nombre: string;
    cantidad: number;
    precio: number;
    tipo: string;
  }[];
};

export default function HistoryScreen() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [ventaAbierta, setVentaAbierta] = useState<string | null>(null);

  // 🔍 BUSCADOR
  const [search, setSearch] = useState("");

  const background = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const card = useThemeColor({}, "card");
  const border = useThemeColor({}, "border");
  const primary = useThemeColor({}, "primary");

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  if (!API_URL) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env');
  };

  useEffect(() => {
    obtenerVentas();
  }, []);

  const obtenerVentas = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${API_URL}/sales`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(data);
        return;
      }

      setVentas(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 FILTRAR POR NUMERO DE ORDEN
  const ventasFiltradas = ventas.filter((venta) =>
    venta.numeroOrden?.toString().includes(search.trim()),
  );

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);

    return d.toLocaleString([], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tituloVenta = (venta: Venta) => {
    if (!venta.items || venta.items.length === 0) {
      return "Venta";
    }

    const primero = venta.items[0].nombre;
    const restantes = venta.items.length - 1;

    if (restantes <= 0) return primero;

    return `${primero} +${restantes}`;
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: background,
        padding: 20,
      }}
    >
      {/* TITULO */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: text,
          marginBottom: 15,
        }}
      >
        Historial
      </Text>

      {/* 🔍 BUSCADOR */}
      <TextInput
        placeholder="Buscar orden #..."
        placeholderTextColor={border}
        value={search}
        onChangeText={setSearch}
        keyboardType="numeric"
        style={{
          backgroundColor: card,
          borderWidth: 1,
          borderColor: border,
          color: text,
          padding: 14,
          borderRadius: 14,
          marginBottom: 15,
          fontSize: 16,
        }}
      />

      <FlatList
        data={ventasFiltradas}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text
            style={{
              color: text,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No hay ventas
          </Text>
        }
        renderItem={({ item }) => {
          const abierto = ventaAbierta === item._id;

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setVentaAbierta(abierto ? null : item._id)}
              style={{
                backgroundColor: card,
                borderWidth: 1,
                borderColor: border,
                borderRadius: 16,
                padding: 15,
                marginBottom: 12,
              }}
            >
              {/* HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  {/* 🔥 BLOQUE ORDEN */}
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 13,
                        letterSpacing: 0.5,
                      }}
                    >
                      ORDEN #{item.numeroOrden}
                    </Text>
                  </View>

                  {/* TITULO */}
                  <Text
                    style={{
                      color: text,
                      fontWeight: "bold",
                      fontSize: 18,
                      marginTop: 3,
                    }}
                  >
                    {tituloVenta(item)}
                  </Text>

                  <Text
                    style={{
                      color: text,
                      opacity: 0.7,
                      marginTop: 4,
                    }}
                  >
                    {item.items.length} artículo(s)
                  </Text>
                </View>

                {/* TOTAL */}
                <Text
                  style={{
                    color: primary,
                    fontWeight: "bold",
                    fontSize: 20,
                  }}
                >
                  RD${item.subtotal}
                </Text>
              </View>

              {/* FECHA */}
              <Text
                style={{
                  color: text,
                  opacity: 0.65,
                  marginTop: 8,
                }}
              >
                {formatearFecha(item.createdAt)}
              </Text>

              {/* PAGO */}
              <Text
                style={{
                  color: text,
                  opacity: 0.75,
                  marginTop: 4,
                }}
              >
                Pago: {item.metodoPago || "efectivo"}
              </Text>

              {/* BOTON */}
              <Text
                style={{
                  color: primary,
                  marginTop: 10,
                  fontWeight: "600",
                }}
              >
                {abierto ? "Ocultar detalles" : "Ver detalles"}
              </Text>

              {/* DETALLES */}
              {abierto && (
                <View style={{ marginTop: 10 }}>
                  {item.items.map((prod, index) => (
                    <View
                      key={index}
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: border,
                        paddingTop: 10,
                        marginTop: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: text,
                          fontWeight: "600",
                        }}
                      >
                        {prod.nombre}
                      </Text>

                      <Text
                        style={{
                          color: text,
                          marginTop: 3,
                        }}
                      >
                        {prod.cantidad} x RD$
                        {prod.precio} ({prod.tipo})
                      </Text>

                      <Text
                        style={{
                          color: primary,
                          marginTop: 3,
                          fontWeight: "600",
                        }}
                      >
                        RD$
                        {prod.cantidad * prod.precio}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
