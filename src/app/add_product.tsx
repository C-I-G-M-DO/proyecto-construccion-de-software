import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryPicker } from "@/components/product-category-controls";
import DatePicker from "@/components/ui/date-picker";
import { MEDIDAS, nombreMedida, type UnidadStock } from "@/constants/measures";
import type { ProductCategory } from "@/constants/product-categories";
import { useSurtioTheme } from "@/hooks/use-surtio-theme";
import { saveProductCategory } from "@/services/product-categories";
import type { NuevoProductoPayload, Precio } from "@/types/products";
import { initialLots } from "@/utils/expiry";

type ProductImage = {
  public_id: string;
  url: string;
};

const number = (value: string) => Number(value.replace(",", "."));

const PALABRAS_IGNORADAS = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "el",
  "en",
  "la",
  "las",
  "los",
  "para",
  "por",
  "sin",
  "un",
  "una",
  "unos",
  "unas",
]);

const PALABRAS_PRESENTACION = new Set([
  "unidad",
  "unidades",
  "unidads",
  "ud",
  "uds",
  "pieza",
  "piezas",
  "pz",
  "pzs",
  "paquete",
  "paquetes",
  "pack",
  "packs",
  "caja",
  "cajas",
  "docena",
  "docenas",
  "media",
  "libra",
  "libras",
  "lb",
  "lbs",
  "cuarta",
  "cuartas",
  "onza",
  "onzas",
  "oz",
  "ml",
  "mililitro",
  "mililitros",
  "l",
  "litro",
  "litros",
  "cl",
  "cc",
  "kg",
  "kilo",
  "kilos",
  "kilogramo",
  "kilogramos",
  "gramo",
  "gramos",
  "gr",
  "g",
]);

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}.\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function esCantidadONumero(palabra: string): boolean {
  const valor = palabra.replace(",", ".");

  if (/^\d+(?:\.\d+)?$/.test(valor)) {
    return true;
  }

  if (/^\d+(?:\.\d+)?(?:ml|l|cl|cc|kg|g|gr|lb|lbs|oz)$/.test(valor)) {
    return true;
  }

  return false;
}

function palabrasImportantes(texto: string): string[] {
  const normalizado = normalizarTexto(texto);

  if (!normalizado) {
    return [];
  }

  const palabras = normalizado.split(" ");

  return palabras.filter((palabra, index) => {
    if (!palabra) {
      return false;
    }

    if (index === 0 && /^\d+$/.test(palabra)) {
      return false;
    }

    if (esCantidadONumero(palabra)) {
      return false;
    }

    if (PALABRAS_IGNORADAS.has(palabra)) {
      return false;
    }

    if (PALABRAS_PRESENTACION.has(palabra)) {
      return false;
    }

    if (/^\d+$/.test(palabra)) {
      return false;
    }

    return true;
  });
}

function obtenerNombreImagen(publicId: string): string {
  return (
    publicId
      .split("/")
      .pop()
      ?.replace(/\.[^/.]+$/, "") || ""
  );
}

function puntuacionImagen(
  nombreProducto: string,
  nombreImagen: string,
): number {
  const producto = palabrasImportantes(nombreProducto);
  const imagen = palabrasImportantes(nombreImagen);

  if (!producto.length || !imagen.length) {
    return 0;
  }

  const productoNormalizado = producto.join(" ");
  const imagenNormalizada = imagen.join(" ");

  let puntuacion = 0;
  let palabrasEncontradas = 0;

  if (productoNormalizado === imagenNormalizada) {
    puntuacion += 1000;
  }

  if (
    imagenNormalizada.includes(productoNormalizado) ||
    productoNormalizado.includes(imagenNormalizada)
  ) {
    puntuacion += 300;
  }

  for (const palabraProducto of producto) {
    let mejorCoincidencia = 0;

    for (const palabraImagen of imagen) {
      if (palabraImagen === palabraProducto) {
        mejorCoincidencia = Math.max(mejorCoincidencia, 100);
        continue;
      }

      if (
        palabraImagen.includes(palabraProducto) ||
        palabraProducto.includes(palabraImagen)
      ) {
        if (palabraProducto.length >= 4 && palabraImagen.length >= 4) {
          mejorCoincidencia = Math.max(mejorCoincidencia, 55);
        }
      }
    }

    if (mejorCoincidencia > 0) {
      palabrasEncontradas += 1;
      puntuacion += mejorCoincidencia;
    }
  }

  if (palabrasEncontradas === producto.length) {
    puntuacion += 250;
  } else {
    const porcentaje = palabrasEncontradas / producto.length;

    puntuacion += Math.round(porcentaje * 80);
  }

  if (
    producto.length >= 2 &&
    palabrasEncontradas < Math.ceil(producto.length / 2)
  ) {
    return 0;
  }

  return puntuacion;
}

function fechaSoloDia(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const texto = String(value).trim();

  if (!texto) {
    return null;
  }

  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const fecha = new Date(texto);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha.toISOString().slice(0, 10);
}

export default function AddProductScreen() {
  const t = useSurtioTheme();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [category, setCategory] = useState<ProductCategory>("otros");

  const [precios, setPrecios] = useState<Precio[]>([]);
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<Precio["tipo"]>("unidad");

  const [unidadStock, setUnidadStock] = useState<UnidadStock>("unidad");

  const [showMedidas, setShowMedidas] = useState(false);
  const [equivalencia, setEquivalencia] = useState("");

  const [stock, setStock] = useState("");

  // NUEVO: stock mínimo para generar alertas.
  const [stockMinimo, setStockMinimo] = useState("");

  const [vence, setVence] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const [imagen, setImagen] = useState("");
  const [imagenes, setImagenes] = useState<ProductImage[]>([]);
  const [showImages, setShowImages] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const api = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/home");

  const imagenesFiltradas = (() => {
    const nombreProducto = nombre.trim();

    if (!nombreProducto) {
      return [];
    }

    return imagenes
      .map((item) => {
        const nombreImagen = obtenerNombreImagen(item.public_id);

        return {
          item,
          score: puntuacionImagen(nombreProducto, nombreImagen),
        };
      })
      .filter((resultado) => resultado.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.item.public_id.localeCompare(b.item.public_id, "es");
      })
      .map((resultado) => resultado.item);
  })();

  function cambiarUnidadStock(value: UnidadStock) {
    if (value === unidadStock) {
      return;
    }

    const aplicar = () => {
      setUnidadStock(value);
      setTipo(value);
      setPrecios([]);
      setValor("");
      setEquivalencia("");
    };

    if (precios.length) {
      Alert.alert(
        "Cambiar unidad de stock",
        "Al cambiarla se quitarán los precios agregados para la unidad anterior.",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Cambiar",
            onPress: aplicar,
          },
        ],
      );
    } else {
      aplicar();
    }
  }

  function agregarPrecio() {
    const valorNumerico = number(valor);

    if (!valor.trim() || !Number.isFinite(valorNumerico) || valorNumerico < 0) {
      Alert.alert(
        "Precio inválido",
        "Escribe un precio igual o mayor que cero.",
      );
      return;
    }

    const equivalenciaNumerica = number(equivalencia);

    if (
      tipo === "paquete" &&
      (!equivalencia.trim() ||
        !Number.isInteger(equivalenciaNumerica) ||
        equivalenciaNumerica <= 0)
    ) {
      Alert.alert(
        "Equivalencia inválida",
        "Indica un número entero de unidades por paquete.",
      );
      return;
    }

    const price: Precio = {
      tipo,
      valor: valorNumerico,
      ...(tipo === "paquete"
        ? {
            equivalencia: equivalenciaNumerica,
          }
        : {}),
    };

    setPrecios((current) => [...current.filter((p) => p.tipo !== tipo), price]);

    setValor("");
    setEquivalencia("");
  }

  async function cargarImagenes() {
    setShowImages(true);
    setImageLoading(true);
    setImageError(null);

    try {
      if (!api) {
        throw new Error("Falta configurar la dirección del backend.");
      }

      const res = await fetch(`${api}/api/imagenes`);
      const data = await res.json().catch(() => null);

      if (!res.ok || !Array.isArray(data)) {
        throw new Error("No se pudo cargar el catálogo de imágenes.");
      }

      setImagenes(
        data.filter(
          (item) =>
            typeof item?.url === "string" &&
            typeof item?.public_id === "string",
        ),
      );
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Error al cargar imágenes.",
      );
    } finally {
      setImageLoading(false);
    }
  }

  async function guardar() {
    if (savingRef.current) {
      return;
    }

    const stockNumerico = number(stock);

    // NUEVO: convertir el stock mínimo.
    // Campo vacío = null = alerta desactivada.
    const stockMinimoNumerico =
      stockMinimo.trim() === "" ? null : number(stockMinimo);

    if (
      !nombre.trim() ||
      !precios.length ||
      !stock.trim() ||
      !Number.isFinite(stockNumerico) ||
      stockNumerico < 0
    ) {
      Alert.alert(
        "Revisa el formulario",
        "Completa el nombre, agrega al menos un precio e indica existencias iguales o mayores que cero.",
      );
      return;
    }

    if (unidadStock === "unidad" && !Number.isInteger(stockNumerico)) {
      Alert.alert(
        "Existencias inválidas",
        "Para productos por unidad, escribe una cantidad entera.",
      );
      return;
    }

    // NUEVO: validar el stock mínimo.
    if (
      stockMinimoNumerico !== null &&
      (!Number.isFinite(stockMinimoNumerico) || stockMinimoNumerico < 0)
    ) {
      Alert.alert(
        "Stock mínimo inválido",
        "Introduce una cantidad igual o mayor que cero, o deja el campo vacío.",
      );
      return;
    }

    if (
      unidadStock === "unidad" &&
      stockMinimoNumerico !== null &&
      !Number.isInteger(stockMinimoNumerico)
    ) {
      Alert.alert(
        "Stock mínimo inválido",
        "Para productos por unidad, el stock mínimo debe ser un número entero.",
      );
      return;
    }

    if (valor.trim()) {
      Alert.alert(
        "Precio sin agregar",
        "Pulsa Agregar precio o borra el precio pendiente antes de guardar.",
      );
      return;
    }

    if (vence && !fechaVencimiento.trim()) {
      Alert.alert(
        "Fecha de vencimiento requerida",
        "Has indicado que este producto vence. Selecciona una fecha de vencimiento antes de guardar.",
      );
      return;
    }

    const fechaSeleccionada = fechaSoloDia(fechaVencimiento);

    if (vence && !fechaSeleccionada) {
      Alert.alert(
        "Fecha inválida",
        "La fecha de vencimiento seleccionada no es válida.",
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const lotesIniciales = initialLots(
        vence,
        fechaVencimiento,
        stockNumerico,
      );

      if (
        vence &&
        (!lotesIniciales ||
          !Array.isArray(lotesIniciales) ||
          lotesIniciales.length === 0)
      ) {
        throw new Error(
          "No se pudo preparar el lote con la fecha de vencimiento.",
        );
      }

      // NUEVO: enviar stockMinimo junto al resto del producto.
      const payload: NuevoProductoPayload = {
        nombre: nombre.trim(),
        precios,
        stock: stockNumerico,
        stockMinimo: stockMinimoNumerico,
        unidadStock,
        imagen,
        ...(lotesIniciales
          ? {
              lotesIniciales,
            }
          : {}),
      };

      if (!api) {
        throw new Error("Falta configurar la dirección del backend.");
      }

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Inicia sesión para guardar el producto.");
      }

      const res = await fetch(`${api}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo guardar el producto.");
      }

      const product = data?.producto ?? data;
      let categorySaved = false;

      if (typeof product?._id === "string") {
        try {
          await saveProductCategory(product._id, category);
          categorySaved = true;
        } catch {
          // El producto ya está guardado en el backend.
        }
      }

      let expiryConfirmed = !vence;

      if (vence) {
        const lotes = Array.isArray(product?.lotes) ? product.lotes : [];

        expiryConfirmed = lotes.some(
          (
            lot: {
              fechaVencimiento?: string;
              cantidadDisponible?: number;
            } | null,
          ) => {
            if (!lot) {
              return false;
            }

            const fechaLote = fechaSoloDia(lot.fechaVencimiento);

            const cantidad = Number(lot.cantidadDisponible);

            return (
              fechaLote === fechaSeleccionada &&
              Number.isFinite(cantidad) &&
              Math.abs(cantidad - stockNumerico) < 0.000001
            );
          },
        );
      }

      if (vence && !expiryConfirmed) {
        Alert.alert(
          "Producto guardado",
          "El producto se guardó, pero el servidor no confirmó correctamente el lote y su fecha de vencimiento. Revisa el producto antes de continuar.",
          [{ text: "Aceptar" }],
        );
        return;
      }

      Alert.alert(
        "Producto guardado",
        vence
          ? `El producto se guardó correctamente con fecha de vencimiento ${fechaSeleccionada}.${categorySaved ? "" : " No se pudo conservar la categoría en el dispositivo."}`
          : `El producto ya forma parte de tu catálogo.${categorySaved ? "" : " No se pudo conservar la categoría en el dispositivo."}`,
        [
          {
            text: "Aceptar",
            onPress: back,
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "No se pudo guardar",
        error instanceof Error
          ? error.message
          : "Revisa la conexión e inténtalo de nuevo.",
      );
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  const card = {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.card,
    gap: 14,
  };

  const input = {
    minHeight: 52,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.background,
    color: t.text,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  };

  const label = {
    color: t.text,
    fontSize: 17,
    fontWeight: "600" as const,
  };

  const muted = {
    color: t.secondary,
    fontSize: 13,
    lineHeight: 20,
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: t.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 32,
            gap: 20,
            flexGrow: 1,
            width: "100%",
            maxWidth: 660,
            alignSelf: "center",
          }}
        >
          <Pressable
            onPress={back}
            accessibilityRole="button"
            style={{
              minHeight: 44,
              justifyContent: "center",
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: t.primary,
                fontWeight: "600",
              }}
            >
              ← Volver
            </Text>
          </Pressable>

          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: t.text,
                fontSize: 28,
                fontWeight: "700",
              }}
            >
              Nuevo producto
            </Text>

            <Text style={muted}>
              Agrega un producto al inventario de tu negocio.
            </Text>
          </View>

          {/* INFORMACIÓN DEL PRODUCTO */}

          <View style={card}>
            <Text style={label}>Información del producto</Text>

            <TextInput
              accessibilityLabel="Nombre del producto"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre del producto"
              placeholderTextColor={t.secondary}
              style={input}
            />

            <CategoryPicker value={category} onChange={setCategory} />

            <Text style={muted}>
              La categoría se conserva en este dispositivo.
            </Text>

            <Pressable
              onPress={cargarImagenes}
              accessibilityRole="button"
              style={{
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: t.border,
                borderRadius: 14,
                padding: 20,
                alignItems: "center",
                gap: 10,
              }}
            >
              {imagen ? (
                <Image
                  source={{ uri: imagen }}
                  resizeMode="contain"
                  style={{
                    width: "100%",
                    height: 120,
                  }}
                />
              ) : (
                <Text
                  style={{
                    color: t.primary,
                    fontSize: 32,
                  }}
                >
                  ＋
                </Text>
              )}

              <Text
                style={{
                  color: t.primary,
                  fontWeight: "600",
                }}
              >
                {imagen ? "Cambiar imagen" : "Seleccionar imagen"}
              </Text>

              <Text style={muted}>Imagen del catálogo · Opcional</Text>
            </Pressable>
          </View>

          {/* PRECIOS DE VENTA */}

          <View style={card}>
            <Text style={label}>Precios de venta</Text>

            <Text style={muted}>
              Primero indica cómo cuentas el inventario. Cada presentación
              tendrá su propio precio en RD$.
            </Text>

            <Text
              style={{
                color: t.text,
                fontWeight: "600",
              }}
            >
              Stock contado en
            </Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["unidad", "libra"] as const).map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: unidadStock === value,
                  }}
                  onPress={() => cambiarUnidadStock(value)}
                  style={{
                    flex: 1,
                    padding: 12,
                    minHeight: 48,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: unidadStock === value ? t.tint : t.muted,
                    borderWidth: 1,
                    borderColor: unidadStock === value ? t.primary : t.border,
                  }}
                >
                  <Text
                    style={{
                      color: unidadStock === value ? t.primary : t.text,
                      fontWeight: "600",
                    }}
                  >
                    {value === "unidad" ? "Unidades" : "Libras"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={{
                color: t.text,
                fontWeight: "600",
              }}
            >
              Presentación de venta
            </Text>

            <Pressable
              onPress={() => setShowMedidas(true)}
              accessibilityRole="button"
              accessibilityLabel="Seleccionar medida"
              style={[
                input,
                {
                  justifyContent: "center",
                },
              ]}
            >
              <Text style={{ color: t.text }}>{nombreMedida(tipo)} ▾</Text>
            </Pressable>

            <TextInput
              accessibilityLabel="Precio en pesos"
              value={valor}
              onChangeText={setValor}
              keyboardType="decimal-pad"
              placeholder="RD$ 0.00"
              placeholderTextColor={t.secondary}
              style={input}
            />

            {tipo === "paquete" && (
              <TextInput
                accessibilityLabel="Unidades por paquete"
                value={equivalencia}
                onChangeText={setEquivalencia}
                keyboardType="decimal-pad"
                placeholder="Unidades por paquete"
                placeholderTextColor={t.secondary}
                style={input}
              />
            )}

            <Pressable
              onPress={agregarPrecio}
              accessibilityRole="button"
              style={{
                padding: 16,
                minHeight: 50,
                backgroundColor: t.tint,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: t.primary,
                  fontWeight: "700",
                }}
              >
                ＋ Agregar precio
              </Text>
            </Pressable>

            {precios.map((p) => (
              <View
                key={p.tipo}
                style={{
                  flexDirection: "row",
                  gap: 8,
                  alignItems: "center",
                  borderTopWidth: 1,
                  borderTopColor: t.border,
                  paddingTop: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text }}>
                    {nombreMedida(p.tipo)} · RD$ {p.valor.toFixed(2)}
                  </Text>

                  {p.tipo === "paquete" && (
                    <Text style={muted}>
                      {p.equivalencia} unidades por paquete
                    </Text>
                  )}
                </View>

                <Pressable
                  accessibilityLabel={`Quitar precio por ${p.tipo}`}
                  onPress={() =>
                    setPrecios((current) =>
                      current.filter((price) => price.tipo !== p.tipo),
                    )
                  }
                  style={{ padding: 12 }}
                >
                  <Text style={{ color: t.primary }}>Quitar</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* EXISTENCIAS INICIALES */}

          <View style={card}>
            <Text style={label}>Existencias iniciales</Text>

            <Text style={muted}>
              Cantidad disponible en{" "}
              {unidadStock === "libra" ? "libras" : "unidades"}.
            </Text>

            <TextInput
              accessibilityLabel="Existencias iniciales"
              value={stock}
              onChangeText={setStock}
              keyboardType="decimal-pad"
              placeholder="Ej. 20"
              placeholderTextColor={t.secondary}
              style={input}
            />
          </View>

          {/* NUEVO: STOCK MÍNIMO */}

          <View style={card}>
            <Text style={label}>Alerta de stock bajo</Text>

            <Text style={muted}>
              Define la cantidad mínima que deseas mantener en inventario.
              Cuando las existencias sean iguales o inferiores a este valor, el
              producto aparecerá en las alertas.
            </Text>

            <Text style={label}>
              Stock mínimo ({unidadStock === "libra" ? "libras" : "unidades"})
            </Text>

            <TextInput
              accessibilityLabel="Stock mínimo para alertas"
              value={stockMinimo}
              onChangeText={setStockMinimo}
              keyboardType="decimal-pad"
              placeholder={unidadStock === "libra" ? "Ej. 2" : "Ej. 5"}
              placeholderTextColor={t.secondary}
              style={input}
            />

            <Text style={muted}>
              {stockMinimo.trim() === ""
                ? "Opcional. Déjalo vacío para desactivar la alerta."
                : `Stock mínimo configurado: ${stockMinimo} ${
                    unidadStock === "libra" ? "lb" : "unidades"
                  }`}
            </Text>
          </View>

          {/* FECHA DE VENCIMIENTO */}

          <View style={card}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Text style={[label, { flex: 1 }]}>Este producto vence</Text>

              <Switch
                accessibilityLabel="Este producto vence"
                value={vence}
                onValueChange={(value) => {
                  setVence(value);

                  if (!value) {
                    setFechaVencimiento("");
                  }
                }}
                trackColor={{
                  false: t.border,
                  true: t.button,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {vence && (
              <>
                <DatePicker
                  label="Fecha de vencimiento"
                  value={fechaVencimiento}
                  onChange={setFechaVencimiento}
                />

                {fechaVencimiento ? (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: t.tint,
                      borderWidth: 1,
                      borderColor: t.border,
                    }}
                  >
                    <Text
                      style={{
                        color: t.primary,
                        fontWeight: "700",
                      }}
                    >
                      ✓ Vencimiento seleccionado
                    </Text>

                    <Text
                      style={{
                        color: t.text,
                        marginTop: 4,
                      }}
                    >
                      {fechaVencimiento}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      color: t.primary,
                      fontWeight: "600",
                    }}
                  >
                    Selecciona una fecha de vencimiento.
                  </Text>
                )}

                <Text style={muted}>
                  La fecha aplica a las {stock || "0"}{" "}
                  {unidadStock === "libra" ? "libras" : "unidades"} que estás
                  registrando. Registra juntos solo productos con el mismo
                  vencimiento.
                </Text>
              </>
            )}
          </View>

          {/* GUARDAR PRODUCTO */}

          <Pressable
            onPress={guardar}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{
              disabled: saving,
            }}
            style={{
              backgroundColor: t.button,
              opacity: saving ? 0.6 : 1,
              padding: 18,
              minHeight: 54,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {saving ? "Guardando…" : "Guardar producto"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DE MEDIDAS */}

      <Modal
        visible={showMedidas}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMedidas(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 20,
            justifyContent: "center",
          }}
        >
          <View
            style={[
              card,
              {
                width: "100%",
                maxWidth: 500,
                alignSelf: "center",
                maxHeight: "85%",
              },
            ]}
          >
            <Text style={label}>Seleccionar presentación</Text>

            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {MEDIDAS.filter((m) => m.unidadStock === unidadStock).map((m) => (
                <Pressable
                  key={m.tipo}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: tipo === m.tipo,
                  }}
                  onPress={() => {
                    setTipo(m.tipo);
                    setEquivalencia("");
                    setShowMedidas(false);
                  }}
                  style={{
                    minHeight: 48,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: tipo === m.tipo ? t.primary : t.border,
                    backgroundColor: tipo === m.tipo ? t.tint : t.card,
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: t.text }}>{m.nombre}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setShowMedidas(false)}
              style={{
                minHeight: 44,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: t.primary }}>Cancelar</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL DE IMÁGENES */}

      <Modal
        visible={showImages}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImages(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 20,
            justifyContent: "center",
          }}
        >
          <View
            style={[
              card,
              {
                width: "100%",
                maxWidth: 560,
                alignSelf: "center",
                maxHeight: "90%",
              },
            ]}
          >
            <Text style={label}>Seleccionar imagen</Text>

            <Text
              style={[
                muted,
                {
                  marginTop: -6,
                },
              ]}
            >
              {nombre.trim()
                ? `Imágenes relacionadas con "${nombre.trim()}"`
                : "Escribe el nombre del producto para buscar sus imágenes."}
            </Text>

            {imageLoading && <ActivityIndicator color={t.primary} />}

            {imageError ? (
              <>
                <Text style={muted}>{imageError}</Text>

                <Pressable onPress={cargarImagenes} style={{ padding: 12 }}>
                  <Text style={{ color: t.primary }}>Reintentar</Text>
                </Pressable>
              </>
            ) : (
              <FlatList
                data={imagenesFiltradas}
                numColumns={3}
                keyExtractor={(item) => item.public_id}
                style={{ flexGrow: 0 }}
                ListEmptyComponent={
                  !imageLoading ? (
                    <View
                      style={{
                        paddingVertical: 20,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={[
                          muted,
                          {
                            textAlign: "center",
                          },
                        ]}
                      >
                        {!nombre.trim()
                          ? "Escribe primero el nombre del producto para buscar sus imágenes."
                          : "No se encontraron imágenes suficientemente relacionadas con este producto."}
                      </Text>
                    </View>
                  ) : null
                }
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityLabel={`Seleccionar imagen ${item.public_id}`}
                    onPress={() => {
                      setImagen(item.url);
                      setShowImages(false);
                    }}
                    style={{
                      width: "33.33%",
                      padding: 4,
                    }}
                  >
                    <Image
                      source={{ uri: item.url }}
                      resizeMode="contain"
                      style={{
                        width: "100%",
                        aspectRatio: 1,
                        borderRadius: 10,
                      }}
                    />
                  </Pressable>
                )}
              />
            )}

            <Pressable
              onPress={() => setShowImages(false)}
              accessibilityRole="button"
              style={{
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: t.primary }}>Cancelar</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
