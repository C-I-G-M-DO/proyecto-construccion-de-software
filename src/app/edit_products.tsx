import { useSurtioStyles, useSurtioTheme } from "@/hooks/use-surtio-theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProducts } from "../context/product_context";
import { Precio } from "../types/products";

const RED = "#C00000";
const money = (value: string) => Number(value.replace(",", "."));

export default function EditProductScreen() {
  const theme = useSurtioTheme();
  const s = useSurtioStyles(baseStyles);
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    nombre: string;
    cantidad: string;
    precios: string;
  }>();
  const {
    productos,
    setProductos,
    reponerStock,
    eliminarProducto,
    actualizarPrecios,
  } = useProducts();
  const producto = productos.find((item) => item._id === params.id);
  const [precios, setPrecios] = useState(() => {
    let source: Precio[] = producto?.precios ?? [];
    if (!source.length) {
      try {
        const parsed = JSON.parse(params.precios ?? "[]");
        if (Array.isArray(parsed)) source = parsed;
      } catch {
        /* Keep an empty form when route data is invalid. */
      }
    }
    return source.map((price) => ({
      ...price,
      input: String(price.valor ?? ""),
    }));
  });
  const [modal, setModal] = useState<"stock" | "delete" | null>(null);
  const [cantidadStock, setCantidadStock] = useState("");
  const [password, setPassword] = useState("");
  const [tipoStock, setTipoStock] = useState<Precio["tipo"]>("unidad");
  const close = () => {
    setModal(null);
    setPassword("");
    setCantidadStock("");
  };
  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/home");

  async function guardarCambios() {
    if (
      precios.some(
        (price) =>
          !price.input.trim() ||
          !Number.isFinite(money(price.input)) ||
          money(price.input) < 0,
      )
    ) {
      Alert.alert(
        "Revisa los precios",
        "Escribe un precio válido igual o mayor que cero.",
      );
      return;
    }

    try {
      const preciosActualizados = precios.map(({ input, ...price }) => ({
        ...price,
        valor: money(input),
      }));

      await actualizarPrecios(params.id, preciosActualizados);

      Alert.alert(
        "Precios actualizados",
        "Los precios se guardaron correctamente.",
        [
          {
            text: "OK",
            onPress: back,
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudieron guardar los precios. Intenta nuevamente.",
      );
    }
  }

  async function confirmarStock() {
    const quantity = money(cantidadStock);

    if (!cantidadStock.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert("Cantidad inválida", "Escribe una cantidad mayor que cero.");
      return;
    }

    try {
      await reponerStock(params.id, quantity, tipoStock);

      close();

      Alert.alert(
        "Stock actualizado",
        "El inventario se actualizó correctamente.",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo actualizar el stock. Intenta nuevamente.",
      );
    }
  }

  async function confirmarEliminacion() {
    if (password !== "1234") {
      Alert.alert("Contraseña incorrecta");
      return;
    }

    try {
      await eliminarProducto(params.id);

      close();

      Alert.alert(
        "Producto eliminado",
        "El producto se eliminó correctamente.",
        [
          {
            text: "OK",
            onPress: back,
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo eliminar el producto. Intenta nuevamente.",
      );
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={s.content}
        >
          <Pressable onPress={back} accessibilityRole="button" style={s.back}>
            <Text style={s.link}>← Volver</Text>
          </Pressable>
          <Text style={s.eyebrow}>INVENTARIO / PRODUCTO</Text>
          <Text style={s.title}>Editar producto</Text>
          <Text style={s.subtitle}>
            Consulta sus datos y ajusta los precios.
          </Text>

          <View style={s.card}>
            <Text style={s.label}>NOMBRE DEL PRODUCTO</Text>
            <Text selectable style={s.productName}>
              {producto?.nombre ?? params.nombre ?? "Producto"}
            </Text>
            <Text style={s.muted}>Nombre de referencia</Text>
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Precios de venta</Text>
            <Text style={s.muted}>
              Precio por modalidad, en pesos dominicanos.
            </Text>
            {precios.map((price, index) => (
              <View key={`${price.tipo}-${index}`} style={{ gap: 8 }}>
                <Text style={s.label}>{price.tipo.toUpperCase()}</Text>
                <View style={s.inputRow}>
                  <Text style={s.currency}>RD$</Text>
                  <TextInput
                    accessibilityLabel={`Precio por ${price.tipo}`}
                    value={price.input}
                    keyboardType="decimal-pad"
                    onChangeText={(input) =>
                      setPrecios((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, input } : item,
                        ),
                      )
                    }
                    style={s.priceInput}
                    placeholder="0.00"
                    placeholderTextColor="#887571"
                  />
                </View>
              </View>
            ))}
            {precios.length === 0 && (
              <Text style={s.muted}>
                Este producto no tiene precios disponibles.
              </Text>
            )}
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Existencias</Text>
            <Text selectable style={s.stock}>
              {producto?.stock ?? params.cantidad ?? "—"}
            </Text>
            <Text style={s.muted}>Stock disponible</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setModal("stock")}
              style={s.secondary}
            >
              <Text style={s.link}>＋ Reponer stock</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={guardarCambios}
            style={s.primary}
          >
            <Text style={s.primaryText}>Guardar cambios</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setModal("delete")}
            style={s.secondary}
          >
            <Text style={s.link}>Eliminar de la lista</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modal !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <SafeAreaView style={s.overlay}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={s.modalScroll}
            >
              <View style={s.modalCard}>
                <Text style={s.sectionTitle}>
                  {modal === "stock" ? "Reponer stock" : "Eliminar de la lista"}
                </Text>
                <Text style={s.muted}>
                  {modal === "stock"
                    ? "Indica la cantidad que vas a sumar al inventario local."
                    : "Esta acción afecta únicamente la lista local. Confirma con la contraseña del prototipo."}
                </Text>
                {modal === "stock" ? (
                  <>
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      {(["unidad", "libra", "paquete"] as const).map((tipo) => (
                        <Pressable
                          key={tipo}
                          onPress={() => setTipoStock(tipo)}
                          style={[
                            s.chip,
                            tipoStock === tipo && {
                              backgroundColor: "#FFE9E5",
                              borderColor: RED,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: tipoStock === tipo ? RED : "#5D3F3B",
                            }}
                          >
                            {tipo}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      accessibilityLabel="Cantidad a reponer"
                      value={cantidadStock}
                      onChangeText={setCantidadStock}
                      keyboardType="decimal-pad"
                      placeholder="Cantidad"
                      placeholderTextColor="#887571"
                      style={s.input}
                    />
                  </>
                ) : (
                  <TextInput
                    accessibilityLabel="Contraseña de confirmación"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="Contraseña"
                    placeholderTextColor="#887571"
                    style={s.input}
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={
                    modal === "stock" ? confirmarStock : confirmarEliminacion
                  }
                  style={s.primary}
                >
                  <Text style={s.primaryText}>Confirmar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={close}
                  style={s.secondary}
                >
                  <Text style={s.link}>Cancelar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCF9F8" },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  eyebrow: {
    color: "#796763",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: { fontSize: 30, fontWeight: "700", color: "#1B1B1C" },
  subtitle: { fontSize: 15, lineHeight: 22, color: "#5D3F3B", marginBottom: 8 },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E2E1",
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: "#1B1B1C" },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5D3F3B",
    letterSpacing: 0.5,
  },
  productName: { fontSize: 22, fontWeight: "600", color: "#1B1B1C" },
  muted: { color: "#5D3F3B", fontSize: 13, lineHeight: 20 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E2E1",
    borderRadius: 12,
    backgroundColor: "#FCF9F8",
  },
  currency: { color: "#5D3F3B", paddingLeft: 16, fontSize: 16 },
  priceInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    padding: 14,
    color: "#1B1B1C",
    fontSize: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E2E1",
    borderRadius: 12,
    padding: 14,
    minHeight: 52,
    fontSize: 16,
    color: "#1B1B1C",
  },
  stock: { color: "#1B1B1C", fontSize: 32, fontWeight: "700" },
  primary: {
    backgroundColor: RED,
    borderRadius: 12,
    padding: 16,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  secondary: {
    borderWidth: 1,
    borderColor: "#E5E2E1",
    borderRadius: 12,
    padding: 16,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  link: { color: RED, fontSize: 15, fontWeight: "600" },
  notice: { padding: 16, backgroundColor: "#F0EDED", borderRadius: 12 },
  overlay: { flex: 1, backgroundColor: "rgba(27,27,28,0.45)" },
  modalScroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    gap: 18,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
  chip: {
    padding: 12,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#E5E2E1",
    borderRadius: 10,
  },
});
