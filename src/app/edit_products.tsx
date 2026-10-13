import { CategoryPicker } from "@/components/product-category-controls";
import DatePicker from "@/components/ui/date-picker";
import { MEDIDAS, nombreMedida } from "@/constants/measures";
import type { ProductCategory } from "@/constants/product-categories";
import { useSurtioStyles, useSurtioTheme } from "@/hooks/use-surtio-theme";
import { saveProductCategory } from "@/services/product-categories";
import { productCategory } from "@/utils/product-categories";
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
import type { Precio } from "../types/products";

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
    actualizarStockMinimo,
  } = useProducts();

  const producto = productos.find((item) => item._id === params.id);

  const [category, setCategory] = useState<ProductCategory>(() =>
    productCategory(producto ?? { nombre: params.nombre ?? "" }),
  );

  const [precios, setPrecios] = useState(() => {
    let source: Precio[] = producto?.precios ?? [];

    if (!source.length) {
      try {
        const parsed = JSON.parse(params.precios ?? "[]");
        if (Array.isArray(parsed)) source = parsed;
      } catch {
        // Mantener el formulario vacío si los datos no son válidos.
      }
    }

    return source.map((price) => ({
      ...price,
      input: String(price.valor ?? ""),
    }));
  });

  const [stockMinimoInput, setStockMinimoInput] = useState(
    producto?.stockMinimo != null ? String(producto.stockMinimo) : "",
  );

  const [guardandoMinimo, setGuardandoMinimo] = useState(false);

  const [modal, setModal] = useState<"stock" | "delete" | null>(null);

  const [cantidadStock, setCantidadStock] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [password, setPassword] = useState("");
  const [tipoStock, setTipoStock] = useState<Precio["tipo"]>("unidad");
  const [guardandoStock, setGuardandoStock] = useState(false);

  const close = () => {
    if (guardandoStock) return;

    setModal(null);
    setPassword("");
    setCantidadStock("");
    setFechaVencimiento("");
  };

  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/home");

  // GUARDAR PRECIOS Y CATEGORÍA
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
      const preciosActualizados = precios.map(
        ({ input, equivalencia, ...price }) => ({
          ...price,
          valor: money(input),
          ...(price.tipo === "paquete" &&
          equivalencia !== undefined &&
          equivalencia !== null
            ? { equivalencia }
            : {}),
        }),
      );

      await actualizarPrecios(params.id, preciosActualizados);

      try {
        await saveProductCategory(params.id, category);

        setProductos((current) =>
          current.map((item) =>
            item._id === params.id ? { ...item, categoria: category } : item,
          ),
        );
      } catch {
        Alert.alert(
          "Precios actualizados",
          "Los precios se guardaron, pero no se pudo conservar la categoría en el dispositivo.",
        );
        return;
      }

      Alert.alert(
        "Cambios guardados",
        "Los precios y la categoría se guardaron correctamente.",
        [{ text: "OK", onPress: back }],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los precios. Intenta nuevamente.",
      );
    }
  }

  // GUARDAR STOCK MÍNIMO
  async function guardarStockMinimo() {
    if (guardandoMinimo) return;

    const texto = stockMinimoInput.trim();
    let minimo: number | null = null;

    // Un campo vacío desactiva la alerta de stock bajo.
    if (texto !== "") {
      minimo = money(texto);

      if (!Number.isFinite(minimo) || minimo < 0) {
        Alert.alert(
          "Stock mínimo inválido",
          "Introduce un número igual o mayor que cero, o deja el campo vacío para desactivar la alerta.",
        );
        return;
      }

      if (producto?.unidadStock === "unidad" && !Number.isInteger(minimo)) {
        Alert.alert(
          "Cantidad inválida",
          "Para productos por unidad, el stock mínimo debe ser un número entero.",
        );
        return;
      }
    }

    setGuardandoMinimo(true);

    try {
      await actualizarStockMinimo(params.id, minimo);

      Alert.alert(
        "Stock mínimo actualizado",
        minimo === null
          ? "Se desactivó la alerta de stock bajo para este producto."
          : `La alerta se activará cuando las existencias sean iguales o inferiores a ${minimo}.`,
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo guardar el stock mínimo.",
      );
    } finally {
      setGuardandoMinimo(false);
    }
  }

  // VALIDAR FECHA DE VENCIMIENTO
  function validarFechaVencimiento(fechaTexto: string): boolean {
    const fecha = fechaTexto.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      Alert.alert(
        "Fecha requerida",
        "Selecciona una fecha de vencimiento válida.",
      );
      return false;
    }

    const [anio, mes, dia] = fecha.split("-").map(Number);
    const fechaComprobada = new Date(anio, mes - 1, dia);

    const fechaValida =
      fechaComprobada.getFullYear() === anio &&
      fechaComprobada.getMonth() === mes - 1 &&
      fechaComprobada.getDate() === dia;

    if (!fechaValida) {
      Alert.alert("Fecha inválida", "Comprueba el día, el mes y el año.");
      return false;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaComprobada < hoy) {
      Alert.alert(
        "Fecha vencida",
        "La fecha del lote nuevo no puede estar en el pasado.",
      );
      return false;
    }

    return true;
  }

  // REPONER STOCK
  async function confirmarStock() {
    if (guardandoStock) return;

    const quantity = money(cantidadStock);

    if (!cantidadStock.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert("Cantidad inválida", "Escribe una cantidad mayor que cero.");
      return;
    }

    if (
      producto?.unidadStock === "unidad" &&
      !Number.isInteger(quantity) &&
      (tipoStock === "unidad" || tipoStock === "docena")
    ) {
      Alert.alert(
        "Cantidad inválida",
        "Para esta presentación, introduce una cantidad entera.",
      );
      return;
    }

    if (producto?.vence && !validarFechaVencimiento(fechaVencimiento)) {
      return;
    }

    setGuardandoStock(true);

    try {
      await reponerStock(
        params.id,
        quantity,
        tipoStock,
        undefined,
        producto?.vence ? fechaVencimiento.trim() : undefined,
      );

      setModal(null);
      setPassword("");
      setCantidadStock("");
      setFechaVencimiento("");

      Alert.alert(
        "Stock actualizado",
        producto?.vence
          ? "El inventario aumentó y se registró un lote nuevo con su fecha de vencimiento."
          : "El inventario se actualizó correctamente.",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el stock. Intenta nuevamente.",
      );
    } finally {
      setGuardandoStock(false);
    }
  }

  // ELIMINAR PRODUCTO
  async function confirmarEliminacion() {
    if (password !== "1234") {
      Alert.alert("Contraseña incorrecta");
      return;
    }

    try {
      await eliminarProducto(params.id);
      setModal(null);
      setPassword("");

      Alert.alert(
        "Producto eliminado",
        "El producto se eliminó correctamente.",
        [{ text: "OK", onPress: back }],
      );
    } catch {
      Alert.alert(
        "Error",
        "No se pudo eliminar el producto. Intenta nuevamente.",
      );
    }
  }

  const medidasDisponibles = MEDIDAS.filter((m) =>
    !producto?.unidadStock
      ? ["unidad", "libra", "paquete"].includes(m.tipo)
      : m.unidadStock === producto.unidadStock &&
        (m.tipo === producto.unidadStock ||
          producto.precios.some((p) => p.tipo === m.tipo)),
  );

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
            Consulta sus datos y ajusta los precios y el stock mínimo.
          </Text>

          {/* INFORMACIÓN DEL PRODUCTO */}
          <View style={s.card}>
            <Text style={s.label}>NOMBRE DEL PRODUCTO</Text>

            <Text selectable style={s.productName}>
              {producto?.nombre ?? params.nombre ?? "Producto"}
            </Text>

            <Text style={s.muted}>Nombre de referencia</Text>

            <CategoryPicker value={category} onChange={setCategory} />

            <Text style={s.muted}>
              La categoría se conserva en este dispositivo.
            </Text>
          </View>

          {/* PRECIOS */}
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

          {/* EXISTENCIAS Y STOCK MÍNIMO */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Existencias</Text>

            <Text selectable style={s.stock}>
              {producto?.stock ?? params.cantidad ?? "—"}{" "}
              {producto?.unidadStock === "libra" ? "lb" : "unid."}
            </Text>

            <Text style={s.muted}>Stock disponible</Text>

            {producto?.vence && (
              <Text style={s.muted}>
                Este producto controla vencimientos. Cada reposición creará un
                lote independiente.
              </Text>
            )}

            <View
              style={[s.stockMinimumSection, { borderTopColor: theme.border }]}
            >
              <Text style={s.sectionTitle}>Alerta de stock bajo</Text>

              <Text style={s.muted}>
                Configura el mínimo que deseas mantener. Se generará una alerta
                cuando el stock disponible sea igual o inferior a esa cantidad.
              </Text>

              <Text style={s.label}>
                STOCK MÍNIMO{" "}
                {producto?.unidadStock === "libra" ? "(LB)" : "(UNIDADES)"}
              </Text>

              <TextInput
                accessibilityLabel="Stock mínimo para alertas"
                value={stockMinimoInput}
                onChangeText={setStockMinimoInput}
                keyboardType="decimal-pad"
                placeholder="Ej. 10"
                placeholderTextColor="#887571"
                style={s.input}
              />

              <Text style={s.muted}>
                {stockMinimoInput.trim() === ""
                  ? "Sin mínimo configurado: no se generará esta alerta."
                  : `Mínimo indicado: ${stockMinimoInput} ${
                      producto?.unidadStock === "libra" ? "lb" : "unidades"
                    }`}
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={guardandoMinimo}
                onPress={() => void guardarStockMinimo()}
                style={[s.primary, guardandoMinimo && { opacity: 0.6 }]}
              >
                <Text style={s.primaryText}>
                  {guardandoMinimo
                    ? "Guardando mínimo..."
                    : "Guardar stock mínimo"}
                </Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setTipoStock(
                  producto?.unidadStock === "libra" ? "libra" : "unidad",
                );
                setCantidadStock("");
                setFechaVencimiento("");
                setModal("stock");
              }}
              style={s.secondary}
            >
              <Text style={s.link}>＋ Reponer stock</Text>
            </Pressable>
          </View>

          {/* GUARDAR PRECIOS Y CATEGORÍA */}
          <Pressable
            accessibilityRole="button"
            onPress={() => void guardarCambios()}
            style={s.primary}
          >
            <Text style={s.primaryText}>Guardar cambios</Text>
          </Pressable>

          {/* ELIMINAR */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setModal("delete")}
            style={s.secondary}
          >
            <Text style={s.link}>Eliminar de la lista</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DE REPOSICIÓN Y ELIMINACIÓN */}
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
                    ? "Indica la cantidad que vas a sumar al inventario."
                    : "Esta acción elimina el producto de la lista. Confirma con la contraseña del prototipo."}
                </Text>

                {modal === "stock" ? (
                  <>
                    <Text style={s.label}>PRESENTACIÓN</Text>

                    <View style={s.measureOptions}>
                      {medidasDisponibles.map(({ tipo }) => (
                        <Pressable
                          key={tipo}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: tipoStock === tipo,
                          }}
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
                            {nombreMedida(tipo)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Text style={s.label}>CANTIDAD A REPONER</Text>

                    <TextInput
                      accessibilityLabel="Cantidad a reponer"
                      value={cantidadStock}
                      onChangeText={setCantidadStock}
                      keyboardType="decimal-pad"
                      placeholder="Cantidad"
                      placeholderTextColor="#887571"
                      style={s.input}
                    />

                    {producto?.vence && (
                      <>
                        <DatePicker
                          label="Fecha de vencimiento del lote nuevo"
                          value={fechaVencimiento}
                          onChange={setFechaVencimiento}
                        />

                        <Text style={s.muted}>
                          {fechaVencimiento
                            ? `Vencimiento seleccionado: ${fechaVencimiento}. Esta fecha se guardará para el lote nuevo, sin cambiar los lotes anteriores.`
                            : "Selecciona la fecha de vencimiento utilizando el calendario."}
                        </Text>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={s.label}>CONTRASEÑA DE CONFIRMACIÓN</Text>

                    <TextInput
                      accessibilityLabel="Contraseña de confirmación"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholder="Contraseña"
                      placeholderTextColor="#887571"
                      style={s.input}
                    />
                  </>
                )}

                <Pressable
                  accessibilityRole="button"
                  disabled={guardandoStock}
                  onPress={() => {
                    if (modal === "stock") {
                      void confirmarStock();
                    } else {
                      void confirmarEliminacion();
                    }
                  }}
                  style={[s.primary, guardandoStock && { opacity: 0.6 }]}
                >
                  <Text style={s.primaryText}>
                    {guardandoStock ? "Guardando..." : "Confirmar"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={guardandoStock}
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
  screen: {
    flex: 1,
    backgroundColor: "#FCF9F8",
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  back: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  eyebrow: {
    color: "#796763",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1B1B1C",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5D3F3B",
    marginBottom: 8,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E2E1",
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1B1B1C",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5D3F3B",
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1B1B1C",
  },
  muted: {
    color: "#5D3F3B",
    fontSize: 13,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E2E1",
    borderRadius: 12,
    backgroundColor: "#FCF9F8",
  },
  currency: {
    color: "#5D3F3B",
    paddingLeft: 16,
    fontSize: 16,
  },
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
  stock: {
    color: "#1B1B1C",
    fontSize: 32,
    fontWeight: "700",
  },
  stockMinimumSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 10,
  },
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
  link: {
    color: RED,
    fontSize: 15,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(27,27,28,0.45)",
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    gap: 18,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
  measureOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    padding: 12,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#E5E2E1",
    borderRadius: 10,
  },
});
