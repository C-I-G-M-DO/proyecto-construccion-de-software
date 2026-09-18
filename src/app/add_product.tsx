import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";
import { Precio } from "../types/products";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env');
}

export default function AddProductScreen() {
  const [nombre, setNombre] = useState("");
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [valorPrecio, setValorPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [equivalencia, setEquivalencia] = useState("");

  const [imagenes, setImagenes] = useState<any[]>([]);
  const [imagenSeleccionada, setImagenSeleccionada] = useState("");

  type TipoPrecio = Precio["tipo"];
  const tipos: TipoPrecio[] = ["unidad", "libra", "paquete"];

  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoPrecio>("unidad");

  const router = useRouter();

  // 🎯 MODALES
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const screenHeight = Dimensions.get("window").height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // 🎨 THEME
  const background = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const border = useThemeColor({}, "border");
  const card = useThemeColor({}, "card");
  const primary = useThemeColor({}, "primary");

  // 🎬 Animación tipo modal
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showTipoModal ? 0 : screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showTipoModal]);

  // 🔥 OBTENER IMÁGENES
  const obtenerImagenes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/imagenes`);
      const data = await res.json();
      setImagenes(data);
    } catch (error) {
      console.log("Error cargando imágenes", error);
    }
  };

  // ➕ AGREGAR PRECIO
  const agregarPrecio = () => {
    if (!valorPrecio) return;

    setPrecios((prev) => [
      ...prev,
      {
        tipo: tipoSeleccionado,
        valor: Number(valorPrecio),
        equivalencia:
          tipoSeleccionado === "paquete" ? Number(equivalencia) : undefined,
      },
    ]);

    setValorPrecio("");
    setEquivalencia("");
  };

  // 💾 GUARDAR PRODUCTO
  const guardarProducto = async () => {
    if (!nombre || precios.length === 0 || !stock) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/products`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre,
          precios,
          stock: Number(stock),
          imagen: imagenSeleccionada, // 🔥 CLAVE
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Error creando producto");
        return;
      }

      Alert.alert("Éxito", "Producto guardado");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo conectar al servidor");
    }
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
          <TextInput
            placeholder="Nombre del producto"
            placeholderTextColor={border}
            value={nombre}
            onChangeText={setNombre}
            style={{
              borderWidth: 1,
              borderColor: border,
              backgroundColor: card,
              color: text,
              marginBottom: 10,
              padding: 10,
              borderRadius: 12,
            }}
          />

          {/* 🖼️ IMAGEN */}
          <TouchableOpacity
            onPress={() => {
              obtenerImagenes();
              setShowImageModal(true);
            }}
            style={{
              backgroundColor: card,
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: border,
            }}
          >
            <Text style={{ color: text }}>
              {imagenSeleccionada ? "Cambiar imagen" : "Seleccionar imagen"}
            </Text>
          </TouchableOpacity>

          {imagenSeleccionada !== "" && (
            <Image
              source={{ uri: imagenSeleccionada }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 10,
                marginBottom: 10,
              }}
            />
          )}

          {/* PRECIO */}
          <Text style={{ fontWeight: "bold", fontSize: 20, color: text }}>
            Precio
          </Text>

          <TextInput
            placeholder="Valor del precio"
            placeholderTextColor={border}
            value={valorPrecio}
            onChangeText={setValorPrecio}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: border,
              backgroundColor: card,
              color: text,
              marginBottom: 10,
              padding: 10,
              borderRadius: 12,
            }}
          />

          {/* SELECTOR */}
          <TouchableOpacity
            onPress={() => setShowTipoModal(true)}
            style={{
              backgroundColor: card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: border,
              padding: 15,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: text }}>Tipo: {tipoSeleccionado}</Text>
          </TouchableOpacity>

          {/* EQUIVALENCIA */}
          {tipoSeleccionado === "paquete" && (
            <TextInput
              placeholder="Equivalencia"
              placeholderTextColor={border}
              value={equivalencia}
              onChangeText={setEquivalencia}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: border,
                backgroundColor: card,
                color: text,
                marginBottom: 10,
                padding: 10,
                borderRadius: 12,
              }}
            />
          )}

          {/* BOTÓN PRECIO */}
          <TouchableOpacity
            onPress={agregarPrecio}
            style={{
              backgroundColor: primary,
              padding: 12,
              borderRadius: 10,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "white" }}>Agregar Precio</Text>
          </TouchableOpacity>

          {precios.map((p, i) => (
            <Text key={i} style={{ color: text }}>
              {p.tipo}: ${p.valor}
            </Text>
          ))}

          {/* STOCK */}
          <Text style={{ fontWeight: "bold", fontSize: 20, color: text }}>
            Cantidad
          </Text>

          <TextInput
            placeholder="Cantidad disponible"
            placeholderTextColor={border}
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: border,
              backgroundColor: card,
              color: text,
              marginBottom: 10,
              padding: 10,
              borderRadius: 12,
            }}
          />

          {/* BOTÓN FINAL */}
          <View
            style={{ position: "absolute", bottom: 40, left: 20, right: 20 }}
          >
            <TouchableOpacity
              onPress={guardarProducto}
              style={{
                height: 55,
                borderRadius: 40,
                backgroundColor: primary,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                gap: 10,
              }}
            >
              <Text style={{ color: "white", fontSize: 18 }}>
                Guardar producto
              </Text>
              <FontAwesome name="save" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 🖼️ MODAL IMÁGENES */}
        <Modal visible={showImageModal} transparent>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 15,
                padding: 10,
                maxHeight: "80%",
              }}
            >
              <FlatList
                data={imagenes}
                numColumns={3}
                keyExtractor={(item) => item.public_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setImagenSeleccionada(item.url);
                      setShowImageModal(false);
                    }}
                    style={{ margin: 5 }}
                  >
                    <Image
                      source={{ uri: item.url }}
                      style={{ width: 80, height: 80, borderRadius: 10 }}
                    />
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={{ padding: 10 }}
              >
                <Text style={{ textAlign: "center" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL TIPO */}
        <Modal transparent visible={showTipoModal}>
          <TouchableOpacity
            style={{ flex: 1, justifyContent: "flex-end" }}
            onPress={() => setShowTipoModal(false)}
          >
            <Animated.View
              style={{
                backgroundColor: card,
                padding: 20,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {tipos.map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => {
                    setTipoSeleccionado(tipo);
                    setShowTipoModal(false);
                  }}
                  style={{ padding: 15 }}
                >
                  <Text style={{ textAlign: "center", color: text }}>
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
