import { nombreMedida } from "@/constants/measures";
import { useProducts } from "@/context/product_context";
import { useSurtioTheme } from "@/hooks/use-surtio-theme";
import { despacharOrden, obtenerOrdenesPendientes } from "@/services/orders";
import type { MetodoPago, Orden } from "@/types/orders";
import { formatMoney as money } from "@/utils/currency";

import { useFocusEffect } from "expo-router";

import { useCallback, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const METODOS: {
  value: MetodoPago;
  label: string;
}[] = [
  {
    value: "efectivo",
    label: "Efectivo",
  },
  {
    value: "tarjeta",
    label: "Tarjeta",
  },
  {
    value: "transferencia",
    label: "Transferencia",
  },
  {
    value: "mixto",
    label: "Mixto",
  },
];

export default function DispatchScreen() {
  const t = useSurtioTheme();

  const insets = useSafeAreaInsets();

  const { obtenerProductos } = useProducts();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);

  const [seleccionada, setSeleccionada] = useState<Orden | null>(null);

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");

  const controller = useRef<AbortController | null>(null);

  const cargar = useCallback(async (silent = false) => {
    if (silent && controller.current && !controller.current.signal.aborted) {
      return;
    }

    controller.current?.abort();

    const request = new AbortController();

    controller.current = request;

    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await obtenerOrdenesPendientes(request.signal);

      if (!request.signal.aborted) {
        setOrdenes(data);
        setError(null);
      }
    } catch (cause) {
      if (!request.signal.aborted) {
        setOrdenes([]);

        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar las órdenes.",
        );
      }
    } finally {
      if (!request.signal.aborted) {
        setLoading(false);
      }

      if (controller.current === request) {
        controller.current = null;
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();

      const timer = setInterval(() => {
        if (AppState.currentState === "active") {
          void cargar(true);
        }
      }, 10000);

      return () => {
        clearInterval(timer);
        controller.current?.abort();
      };
    }, [cargar]),
  );

  const confirmar = () => {
    if (!seleccionada || sending) {
      return;
    }

    const mensaje =
      `Se registrará la venta de la orden #${seleccionada.numeroOrden}.\n\n` +
      `Inventario: se descontará al confirmar.\n` +
      `Método de pago: ${
        METODOS.find((item) => item.value === metodoPago)?.label
      }.`;

    const ejecutar = async () => {
      setSending(true);

      try {
        const resultado = await despacharOrden(seleccionada._id, {
          clienteId: seleccionada.clienteId || null,

          puntosCanjeados: seleccionada.puntosCanjeados || 0,

          metodoPago,
        });

        setSeleccionada(null);

        setMetodoPago("efectivo");

        await Promise.all([cargar(), obtenerProductos()]);

        let mensajeFinal = "La venta quedó registrada correctamente.";

        if (resultado.fidelidad) {
          mensajeFinal +=
            `\n\nCliente: ${resultado.fidelidad.nombre}` +
            `\nPuntos canjeados: ${resultado.fidelidad.puntosCanjeados}` +
            `\nPuntos ganados: ${resultado.fidelidad.puntosGanados}` +
            `\nPuntos disponibles: ${resultado.fidelidad.puntosDisponibles}`;
        }

        if (Platform.OS === "web") {
          window.alert(mensajeFinal);
        } else {
          Alert.alert("Orden despachada", mensajeFinal);
        }
      } catch (cause) {
        const detalle =
          cause instanceof Error ? cause.message : "Inténtalo nuevamente.";

        if (Platform.OS === "web") {
          window.alert(`No se pudo despachar.\n\n${detalle}`);
        } else {
          Alert.alert("No se pudo despachar", detalle);
        }

        // Volvemos a consultar por si
        // otro empleado ya despachó la orden.
        void cargar();
      } finally {
        setSending(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(mensaje)) {
        void ejecutar();
      }
    } else {
      Alert.alert("Confirmar despacho", mensaje, [
        {
          text: "Volver",
          style: "cancel",
        },
        {
          text: "Despachar",
          onPress: () => {
            void ejecutar();
          },
        },
      ]);
    }
  };

  const card = {
    backgroundColor: t.card,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 9,
  } as const;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: t.background,
      }}
      edges={["left", "right"]}
    >
      <FlatList
        data={ordenes}
        keyExtractor={(item) => item._id}
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 28,
          gap: 12,
          width: "100%",
          maxWidth: 760,
          alignSelf: "center",
          flexGrow: 1,
        }}
        refreshing={loading}
        onRefresh={() => {
          void cargar();
        }}
        ListHeaderComponent={
          <View
            style={{
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: t.text,
                fontSize: 28,
                fontWeight: "800",
              }}
            >
              Despacho
            </Text>

            <Text
              style={{
                color: t.secondary,
                lineHeight: 21,
              }}
            >
              Órdenes pendientes de preparar. La lista se actualiza cada 10
              segundos.
            </Text>

            {error && (
              <View style={card}>
                <Text
                  style={{
                    color: t.text,
                  }}
                >
                  {error}
                </Text>

                <Pressable
                  onPress={() => {
                    void cargar();
                  }}
                  style={{
                    minHeight: 44,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: t.primary,
                      fontWeight: "700",
                    }}
                  >
                    Reintentar
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View
              style={[
                card,
                {
                  alignItems: "center",
                  marginTop: 24,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={t.primary} />
              ) : (
                <Text
                  style={{
                    color: t.secondary,
                  }}
                >
                  No hay órdenes pendientes.
                </Text>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSeleccionada(item);

              setMetodoPago("efectivo");
            }}
            style={card}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text
                style={{
                  color: t.text,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                Orden #{item.numeroOrden}
              </Text>

              <Text
                style={{
                  color: t.primary,
                  fontWeight: "700",
                }}
              >
                Pendiente
              </Text>
            </View>

            <Text
              style={{
                color: t.secondary,
              }}
            >
              {new Date(item.createdAt).toLocaleString("es-DO")}

              {item.createdByName ? ` · ${item.createdByName}` : ""}
            </Text>

            {item.clienteNombre && (
              <Text
                style={{
                  color: t.text,
                  fontWeight: "600",
                }}
              >
                👤 {item.clienteNombre}
                {item.telefonoCliente ? ` · ${item.telefonoCliente}` : ""}
              </Text>
            )}

            <Text
              style={{
                color: t.secondary,
              }}
            >
              {item.items?.length ?? 0} productos · Toca para ver detalles
            </Text>

            <Text
              style={{
                color: t.text,
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              {money(item.subtotal)}
            </Text>
          </Pressable>
        )}
      />

      <Modal
        visible={!!seleccionada}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!sending) {
            setSeleccionada(null);
          }
        }}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={[
              card,
              {
                width: "100%",
                maxWidth: 560,
                maxHeight: "92%",
                alignSelf: "center",
                gap: 16,
              },
            ]}
          >
            <Text
              style={{
                color: t.text,
                fontSize: 22,
                fontWeight: "800",
              }}
            >
              Orden #{seleccionada?.numeroOrden}
            </Text>

            <Text
              style={{
                color: t.secondary,
              }}
            >
              {seleccionada &&
                new Date(seleccionada.createdAt).toLocaleString("es-DO")}

              {seleccionada?.createdByName
                ? ` · ${seleccionada.createdByName}`
                : ""}
            </Text>

            {seleccionada?.clienteNombre && (
              <View
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: t.background,
                  borderWidth: 1,
                  borderColor: t.border,
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    color: t.text,
                    fontWeight: "800",
                    fontSize: 16,
                  }}
                >
                  Cliente
                </Text>

                <Text
                  style={{
                    color: t.text,
                  }}
                >
                  {seleccionada.clienteNombre}
                </Text>

                {seleccionada.telefonoCliente && (
                  <Text
                    style={{
                      color: t.secondary,
                    }}
                  >
                    📱 {seleccionada.telefonoCliente}
                  </Text>
                )}

                {(seleccionada.puntosCanjeados ?? 0) > 0 && (
                  <Text
                    style={{
                      color: t.primary,
                      fontWeight: "700",
                    }}
                  >
                    ⭐ Puntos a canjear: {seleccionada.puntosCanjeados}
                  </Text>
                )}
              </View>
            )}

            <ScrollView
              style={{
                flexGrow: 0,
              }}
              contentContainerStyle={{
                gap: 12,
              }}
            >
              {seleccionada?.items?.map((item, index) => (
                <View
                  key={`${item.productoId}-${item.tipo}-${index}`}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: t.border,
                    gap: 3,
                  }}
                >
                  <Text
                    style={{
                      color: t.text,
                      fontWeight: "700",
                    }}
                  >
                    {item.nombre}
                  </Text>

                  <Text
                    style={{
                      color: t.secondary,
                    }}
                  >
                    {item.cantidad} × {nombreMedida(item.tipo)} ·{" "}
                    {money(item.precio)}
                  </Text>

                  <Text
                    style={{
                      color: t.text,
                    }}
                  >
                    {money(item.total)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <Text
              style={{
                color: t.text,
                fontSize: 20,
                fontWeight: "800",
              }}
            >
              Subtotal {money(seleccionada?.subtotal ?? 0)}
            </Text>

            {/* MÉTODO DE PAGO */}

            <View
              style={{
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: t.text,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                Método de pago
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {METODOS.map((metodo) => {
                  const activo = metodoPago === metodo.value;

                  return (
                    <Pressable
                      key={metodo.value}
                      disabled={sending}
                      onPress={() => setMetodoPago(metodo.value)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 11,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: activo ? t.primary : t.border,
                        backgroundColor: activo ? t.primary : t.background,
                      }}
                    >
                      <Text
                        style={{
                          color: activo ? "#FFFFFF" : t.text,
                          fontWeight: "700",
                        }}
                      >
                        {metodo.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              disabled={sending}
              onPress={confirmar}
              style={{
                backgroundColor: t.button,
                opacity: sending ? 0.6 : 1,
                minHeight: 52,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                }}
              >
                {sending ? "Procesando…" : "Confirmar despacho y venta"}
              </Text>
            </Pressable>

            <Pressable
              disabled={sending}
              onPress={() => setSeleccionada(null)}
              style={{
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: t.primary,
                }}
              >
                Cerrar
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
