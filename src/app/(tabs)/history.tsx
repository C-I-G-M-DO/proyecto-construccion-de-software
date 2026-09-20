import { useSurtioTheme, useSurtioStyles } from '@/hooks/use-surtio-theme';
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Platform,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const theme = useSurtioTheme();
  const insets = useSafeAreaInsets();
  const requestRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [ventaAbierta, setVentaAbierta] = useState<string | null>(null);

  // 🔍 BUSCADOR
  const [search, setSearch] = useState("");

  const background = theme.background;
  const text = theme.text;
  const card = theme.card;
  const border = theme.border;
  const primary = theme.primary;

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  if (!API_URL) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env');
  };

  const obtenerVentas = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem("token");
      if (controller.signal.aborted) return;
      if (!token) throw new Error("Inicia sesión para consultar tus ventas.");
      const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || `No se pudo cargar el historial (HTTP ${res.status}).`);
      if (!Array.isArray(data)) throw new Error("El servidor devolvió un historial con formato inesperado.");
      if (!controller.signal.aborted) setVentas(data);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "No se pudo cargar el historial.");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [API_URL]);

  useFocusEffect(useCallback(() => {
    setVentas([]);
    void obtenerVentas();
    return () => requestRef.current?.abort();
  }, [obtenerVentas]));

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

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        width: '100%',
        maxWidth: 1080,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 16,
        paddingBottom: 32,
      }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      alwaysBounceVertical
      refreshing={loading}
      onRefresh={() => void obtenerVentas()}
      ListHeaderComponent={<View>
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

      <Text style={{ color: theme.secondary, fontSize: 15, lineHeight: 22, marginBottom: 20 }}>Consulta las ventas de tu negocio</Text>
      {!error && !loading && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <View style={{ flexGrow: 1, flexBasis: 140, backgroundColor: card, borderWidth: 1, borderColor: border, padding: 18, borderRadius: 16, gap: 8 }}>
          <Text style={{ color: theme.secondary, fontSize: 13 }}>Ventas registradas</Text>
          <Text style={{ color: text, fontSize: 26, fontWeight: '700' }}>{ventas.length}</Text>
        </View>
        <View style={{ flexGrow: 1, flexBasis: 180, backgroundColor: card, borderWidth: 1, borderColor: border, padding: 18, borderRadius: 16, gap: 8 }}>
          <Text style={{ color: theme.secondary, fontSize: 13 }}>Total registrado</Text>
          <Text style={{ color: text, fontSize: 26, fontWeight: '700' }}>RD$ {ventas.reduce((sum, sale) => sum + sale.subtotal, 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </View>}
      {/* 🔍 BUSCADOR */}
      <TextInput
        placeholder="Buscar orden #..."
        placeholderTextColor="#796763"
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

      {error && <View style={{ paddingVertical: 16, gap: 12 }}>
        <Text selectable style={{ color: text }}>{error}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => void obtenerVentas()} style={{ paddingVertical: 12 }}>
          <Text style={{ color: primary, fontWeight: '700' }}>Reintentar</Text>
        </TouchableOpacity>
      </View>}
      </View>}
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
            {loading ? "Cargando ventas…" : error ? "" : search.trim() ? "No hay órdenes con ese número" : "Todavía no hay ventas"}
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
                  flexWrap: "wrap",
                  gap: 12,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexGrow: 1, flexBasis: 180 }}>
                  {/* 🔥 BLOQUE ORDEN */}
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: theme.tint,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: primary,
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
                  RD$ {item.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        {(prod.cantidad * prod.precio).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
  );
}
