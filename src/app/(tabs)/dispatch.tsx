import { nombreMedida } from "@/constants/measures";
import { useProducts } from "@/context/product_context";
import { useSurtioTheme } from "@/hooks/use-surtio-theme";
import {
  despacharOrden,
  eliminarOrden,
  obtenerOrdenesPendientes,
} from "@/services/orders";
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

import { Swipeable } from "react-native-gesture-handler";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const METODOS: {
  value: MetodoPago;
  label: string;
}[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "mixto", label: "Mixto" },
];

export default function DispatchScreen() {
  const t = useSurtioTheme();
  const insets = useSafeAreaInsets();
  const { obtenerProductos } = useProducts();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [seleccionada, setSeleccionada] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  // =========================================================
  // ELIMINAR ORDEN PENDIENTE
  // =========================================================

  const confirmarEliminacion = useCallback(
    (orden: Orden) => {
      if (deletingId || sending) {
        return;
      }

      const mensaje =
        `¿Quieres eliminar la orden #${orden.numeroOrden}?\n\n` +
        "Esta acción eliminará el pedido pendiente. " +
        "No registrará una venta ni descontará inventario.";

      const ejecutar = async () => {
        if (deletingId || sending) {
          return;
        }

        setDeletingId(orden._id);

        try {
          await eliminarOrden(orden._id);

          // Retirarla inmediatamente de la lista.
          setOrdenes((actuales) =>
            actuales.filter((item) => item._id !== orden._id),
          );

          // Si estaba abierta en el modal, cerrarlo.
          setSeleccionada((actual) =>
            actual?._id === orden._id ? null : actual,
          );

          setError(null);

          if (Platform.OS === "web") {
            window.alert(
              `La orden #${orden.numeroOrden} fue eliminada correctamente.`,
            );
          } else {
            Alert.alert(
              "Orden eliminada",
              `La orden #${orden.numeroOrden} fue eliminada correctamente.`,
            );
          }

          // Sincronizar con el servidor.
          await cargar();
        } catch (cause) {
          const detalle =
            cause instanceof Error ? cause.message : "Inténtalo nuevamente.";

          if (Platform.OS === "web") {
            window.alert(`No se pudo eliminar la orden.\n\n${detalle}`);
          } else {
            Alert.alert("No se pudo eliminar", detalle);
          }

          // Consultar el estado real de la orden.
          void cargar();
        } finally {
          setDeletingId(null);
        }
      };

      if (Platform.OS === "web") {
        if (window.confirm(mensaje)) {
          void ejecutar();
        }
      } else {
        Alert.alert("Eliminar orden", mensaje, [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              void ejecutar();
            },
          },
        ]);
      }
    },
    [cargar, deletingId, sending],
  );

  // =========================================================
  // DESPACHAR ORDEN
  // =========================================================

  const confirmar = () => {
    if (!seleccionada || sending || deletingId) {
      return;
    }

    const orden = seleccionada;

    const mensaje =
      `Se registrará la venta de la orden #${orden.numeroOrden}.\n\n` +
      "Inventario: se descontará al confirmar.\n" +
      `Método de pago: ${
        METODOS.find((item) => item.value === metodoPago)?.label
      }.`;

    const ejecutar = async () => {
      setSending(true);

      try {
        const resultado = await despacharOrden(orden._id, {
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

  // =========================================================
  // ACCIÓN QUE APARECE AL DESLIZAR HACIA LA IZQUIERDA
  // =========================================================

  const renderRightActions = (orden: Orden) => {
    const eliminando = deletingId === orden._id;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Eliminar orden ${orden.numeroOrden}`}
        disabled={!!deletingId || sending}
        onPress={() => confirmarEliminacion(orden)}
        style={{
          backgroundColor: "#DC2626",
          borderRadius: 14,
          marginBottom: 2,
          marginLeft: 10,
          width: 104,
          alignItems: "center",
          justifyContent: "center",
          opacity: deletingId || sending ? 0.6 : 1,
        }}
      >
        {eliminando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text
              style={{
                fontSize: 23,
                color: "#FFFFFF",
              }}
            >
              🗑
            </Text>

            <Text
              style={{
                color: "#FFFFFF",
                fontWeight: "800",
                marginTop: 5,
              }}
            >
              Eliminar
            </Text>
          </>
        )}
      </Pressable>
    );
  };

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
        style={{ flex: 1 }}
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
          <View style={{ gap: 10, marginBottom: 12 }}>
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
              segundos. Desliza una orden hacia la izquierda para eliminarla.
            </Text>

            {error && (
              <View style={card}>
                <Text style={{ color: t.text }}>{error}</Text>

                <Pressable
                  onPress={() => void cargar()}
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
                <Text style={{ color: t.secondary }}>
                  No hay órdenes pendientes.
                </Text>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Swipeable
            key={item._id}
            renderRightActions={() => renderRightActions(item)}
            overshootRight={false}
            enabled={!deletingId && !sending}
          >
            <Pressable
              accessibilityRole="button"
              disabled={!!deletingId || sending}
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

              <Text style={{ color: t.secondary }}>
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

              <Text style={{ color: t.secondary }}>
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

              <Text
                style={{
                  color: t.secondary,
                  fontSize: 12,
                }}
              >
                Desliza a la izquierda para eliminar
              </Text>
            </Pressable>
          </Swipeable>
        )}
      />

      {/* =====================================================
          DETALLES Y DESPACHO
      ====================================================== */}

      <Modal
        visible={!!seleccionada}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!sending && !deletingId) {
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

            <Text style={{ color: t.secondary }}>
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

                <Text style={{ color: t.text }}>
                  {seleccionada.clienteNombre}
                </Text>

                {seleccionada.telefonoCliente && (
                  <Text style={{ color: t.secondary }}>
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
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 12 }}
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

                  <Text style={{ color: t.secondary }}>
                    {item.cantidad} × {nombreMedida(item.tipo)} ·{" "}
                    {money(item.precio)}
                  </Text>

                  <Text style={{ color: t.text }}>{money(item.total)}</Text>
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

            <View style={{ gap: 8 }}>
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
                      disabled={sending || !!deletingId}
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
              disabled={sending || !!deletingId}
              onPress={confirmar}
              style={{
                backgroundColor: t.button,
                opacity: sending || deletingId ? 0.6 : 1,
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

            {/* ELIMINAR DESDE LOS DETALLES */}

            <Pressable
              disabled={sending || !!deletingId}
              onPress={() => {
                if (seleccionada) {
                  confirmarEliminacion(seleccionada);
                }
              }}
              style={{
                minHeight: 46,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#DC2626",
                alignItems: "center",
                justifyContent: "center",
                opacity: sending || deletingId ? 0.6 : 1,
              }}
            >
              {deletingId === seleccionada?._id ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <Text
                  style={{
                    color: "#DC2626",
                    fontWeight: "800",
                  }}
                >
                  🗑 Eliminar pedido pendiente
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={sending || !!deletingId}
              onPress={() => setSeleccionada(null)}
              style={{
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: t.primary }}>Cerrar</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
