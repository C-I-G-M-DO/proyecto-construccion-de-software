import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useProducts } from "../context/product_context";
import { useThemeColor } from "../hooks/use-theme-color";
import { Precio } from "../types/products";

export default function EditProductScreen() {
  const router = useRouter();
  const { productos, setProductos, reponerStock } = useProducts();

  const params = useLocalSearchParams<{
    id: string;
    nombre: string;
    cantidad: string;
    precios: string;
  }>();

  const [nombre] = useState(params.nombre ?? "");
  const [precios, setPrecios] = useState<Precio[]>(
    JSON.parse(params.precios ?? "[]")
  );
  const [cantidad] = useState(params.cantidad ?? "");

  // 🔐 Modal eliminar
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");

  // 📦 Modal stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [cantidadStock, setCantidadStock] = useState("");
  const [tipoStock, setTipoStock] =
    useState<"unidad" | "libra" | "paquete">("unidad");

  // 🎨 THEME
  const background = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const border = useThemeColor({}, "border");
  const card = useThemeColor({}, "card");
  const primary = useThemeColor({}, "primary");

  // 🎬 Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showModal || showStockModal) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showModal, showStockModal]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // 💾 Guardar cambios
  const guardarCambios = () => {
    const nuevosProductos = productos.map((p) =>
      p._id === params.id
        ? { ...p, precios }
        : p
    );

    setProductos(nuevosProductos);
    router.back();
  };

  // 🗑️ Eliminar con contraseña
  const confirmarEliminacion = () => {
    if (password === "1234") {
      const nuevosProductos = productos.filter(
        (p) => p._id !== params.id
      );

      setProductos(nuevosProductos);
      setShowModal(false);
      router.back();
    } else {
      shake();
      alert("Contraseña incorrecta");
    }
  };

  // 📦 Confirmar reposición
  const confirmarStock = () => {
    if (!cantidadStock) return;

    reponerStock(params.id, Number(cantidadStock), tipoStock);

    setCantidadStock("");
    setShowStockModal(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1, padding: 20 }}>

          {/* NOMBRE */}
          <Text style={{ fontWeight: "bold", fontSize: 20, color: text }}>
            Nombre
          </Text>

          <View style={{
            backgroundColor: card,
            padding: 12,
            borderRadius: 12,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: border,
            opacity: 0.7,
          }}>
            <Text style={{ color: text }}>{nombre}</Text>
          </View>

          {/* PRECIOS */}
          <Text style={{ fontWeight: "bold", fontSize: 20, color: text }}>
            Precios
          </Text>

          {precios.map((p, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={{ color: text }}>{p.tipo}</Text>

              <TextInput
                value={p.valor.toString()}
                keyboardType="numeric"
                onChangeText={(value) => {
                  const nuevos = [...precios];
                  nuevos[index].valor = Number(value);
                  setPrecios(nuevos);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: card,
                  color: text,
                  padding: 10,
                  borderRadius: 10,
                }}
              />
            </View>
          ))}

          {/* STOCK */}
          <Text style={{ color: text }}>Stock: {cantidad}</Text>

          {/* BOTÓN REPOSICIÓN */}
          <TouchableOpacity
            onPress={() => setShowStockModal(true)}
            style={{
              backgroundColor: "green",
              padding: 15,
              borderRadius: 12,
              marginTop: 10,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Reponer stock
            </Text>
          </TouchableOpacity>

          {/* GUARDAR */}
          <TouchableOpacity
            onPress={guardarCambios}
            style={{
              backgroundColor: primary,
              padding: 15,
              borderRadius: 12,
              marginTop: 10,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Guardar cambios
            </Text>
          </TouchableOpacity>

          {/* ELIMINAR */}
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              backgroundColor: "#ff3b30",
              padding: 15,
              borderRadius: 12,
              marginTop: 10,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Eliminar producto
            </Text>
          </TouchableOpacity>

          {/* 🔐 MODAL ELIMINAR */}
          {showModal && (
            <View style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <View style={{
                width: "80%",
                backgroundColor: card,
                padding: 20,
                borderRadius: 12,
              }}>
                <Text style={{ color: text }}>Contraseña</Text>

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={{
                    borderWidth: 1,
                    borderColor: border,
                    padding: 10,
                    borderRadius: 10,
                    color: text,
                    marginBottom: 10,
                  }}
                />

                <TouchableOpacity onPress={confirmarEliminacion}>
                  <Text style={{ color: "red", textAlign: "center" }}>
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

{/* 📦 MODAL STOCK */}
{showStockModal && (
  <TouchableWithoutFeedback onPress={() => setShowStockModal(false)}>
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TouchableWithoutFeedback>
        <View
          style={{
            width: "80%",
            backgroundColor: card,
            padding: 20,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: text, marginBottom: 10 }}>
            Cantidad a reponer
          </Text>

          <TextInput
            value={cantidadStock}
            onChangeText={setCantidadStock}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: border,
              padding: 10,
              borderRadius: 10,
              color: text,
              marginBottom: 15,
            }}
          />

          {/* BOTONES */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            
            {/* CANCELAR */}
            <TouchableOpacity
              onPress={() => {
                setCantidadStock("");
                setShowStockModal(false);
              }}
              style={{
                flex: 1,
                marginRight: 5,
                padding: 12,
                borderRadius: 10,
                backgroundColor: border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: text }}>Cancelar</Text>
            </TouchableOpacity>

            {/* CONFIRMAR */}
            <TouchableOpacity
              onPress={confirmarStock}
              style={{
                flex: 1,
                marginLeft: 5,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "green",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>Confirmar</Text>
            </TouchableOpacity>

          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
)}

        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}