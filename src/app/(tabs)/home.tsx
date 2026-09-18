import {
  Alert,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";

import Entypo from "@expo/vector-icons/Entypo";

import { useCart } from "../../context/cart_context";
import { useProducts } from "../../context/product_context";
import { useThemeColor } from "../../hooks/use-theme-color";

// ============================================================
//  TEMPORAL: IMPORT PARA BORRAR EL TOKEN
//  BORRAR ESTE IMPORT DESPUÉS DE HACER LA PRUEBA DE LOGOUT
// ============================================================
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const { productos, obtenerProductos } = useProducts();
  const { agregarAlCarrito, carrito, disminuirDelCarrito } = useCart();

  const router = useRouter();

  const [search, setSearch] = useState("");
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);

  // THEME
  const background = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const card = useThemeColor({}, "card");
  const border = useThemeColor({}, "border");
  const primary = useThemeColor({}, "primary");

  // ============================================================
  //  TEMPORAL: BORRAR TOKEN
  //  BORRAR ESTA FUNCIÓN DESPUÉS DE HACER LA PRUEBA
  // ============================================================
  const borrarToken = async () => {
    try {
      await AsyncStorage.removeItem("token");

      Alert.alert(
        "Token eliminado",
        "El token de sesión fue eliminado correctamente.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ],
      );
    } catch (error) {
      console.error("Error eliminando token:", error);

      Alert.alert("Error", "No se pudo eliminar el token.");
    }
  };

  // CARGAR PRODUCTOS
  useFocusEffect(
    useCallback(() => {
      obtenerProductos();
    }, []),
  );

  // FILTRO
  const productosFiltrados = productos.filter((item: any) => {
    const nombre = (item.nombre ?? "").toLowerCase();
    const busqueda = (search ?? "").toLowerCase();

    return nombre.includes(busqueda);
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: background,
      }}
    >
      <View
        style={{
          flex: 1,
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: text,
          }}
        >
          Productos
        </Text>

        {/* 🔍 BUSCADOR */}
        <TextInput
          placeholder="Buscar producto..."
          placeholderTextColor={border}
          value={search}
          onChangeText={setSearch}
          style={{
            borderWidth: 1,
            borderColor: border,
            backgroundColor: card,
            color: text,
            padding: 12,
            borderRadius: 12,
            marginVertical: 15,
          }}
        />

        {/*  LISTA */}
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item: any) => item._id}
          numColumns={2}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
          columnWrapperStyle={{
            justifyContent: "space-between",
          }}
          ListEmptyComponent={
            <Text
              style={{
                color: text,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No hay productos
            </Text>
          }
          renderItem={({ item }: { item: any }) => {
            const totalEnCarrito = carrito
              .filter((p) => p.productoId === item._id)
              .reduce((acc, curr) => acc + curr.cantidad, 0);

            return (
              <TouchableOpacity
                onPress={() => {
                  // VENTA RÁPIDA
                if (item.precios?.length === 1) {
                    const precio = item.precios[0];

                    agregarAlCarrito({
                      id: `${item._id}-${precio.tipo}`,
                      productoId: item._id,
                      nombre: item.nombre,
                      tipo: precio.tipo,
                      precio: precio.valor,
                      cantidad: 1,
                      total: precio.valor,
                      equivalencia: precio.equivalencia,
                    });

                    return;
                  }

                  setProductoSeleccionado(item);
                  setShowTipoModal(true);
                }}
                onLongPress={() =>
                  router.push({
                    pathname: "/edit_products",
                    params: {
                      id: item._id,
                      nombre: item.nombre,
                      precios: JSON.stringify(item.precios),
                      cantidad: item.stock.toString(),
                    },
                  })
                }
                style={{
                  width: "48%",
                  backgroundColor: card,
                  padding: 12,
                  borderRadius: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                {/*  BADGE FLOTANTE */}
                {totalEnCarrito > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: totalEnCarrito > 5 ? "#ff4d4d" : primary,
                      minWidth: 30,
                      height: 30,
                      borderRadius: 15,
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: totalEnCarrito > 9 ? 12 : 14,
                      }}
                    >
                      {totalEnCarrito}
                    </Text>
                  </View>
                )}

                {/*  IMAGEN */}
                <Image
                  source={{
                    uri: item.imagen?.trim()
                      ? item.imagen
                      : "https://via.placeholder.com/150",
                  }}
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 12,
                    marginBottom: 10,
                  }}
                />

                {/* NOMBRE */}
                <Text
                  numberOfLines={1}
                  style={{
                    fontWeight: "bold",
                    color: text,
                    fontSize: 16,
                  }}
                >
                  {item.nombre}
                </Text>

                {/* PRECIO */}
                <Text
                  style={{
                    color: text,
                  }}
                >
                  RD${item.precios?.[0]?.valor ?? 0}
                </Text>

                {/* STOCK */}
                <Text
                  style={{
                    color: text,
                    opacity: 0.7,
                  }}
                >
                  Stock: {item.stock}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/*  MODAL */}
      <Modal visible={showTipoModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "92%",
              backgroundColor: card,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{
                color: text,
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Selecciona tipo
            </Text>

            {productoSeleccionado?.precios?.map((precio: any) => {
              const itemEnCarrito = carrito.find(
                (p) =>
                  p.productoId === productoSeleccionado._id &&
                  p.tipo === precio.tipo,
              );

              return (
                <View
                  key={precio.tipo}
                  style={{
                    marginBottom: 15,
                    padding: 15,
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 15,
                  }}
                >
                  <Text
                    style={{
                      color: text,
                      fontSize: 18,
                      fontWeight: "bold",
                      marginBottom: 10,
                    }}
                  >
                    {precio.tipo.toUpperCase()} - RD$
                    {precio.valor}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* MENOS */}
                    <TouchableOpacity
                      onPress={() => {
                        if (itemEnCarrito) {
                          disminuirDelCarrito(itemEnCarrito);
                        }
                      }}
                      style={{
                        backgroundColor: "#ff4d4d",
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 28,
                        }}
                      >
                        -
                      </Text>
                    </TouchableOpacity>

                    {/* CANTIDAD */}
                    <Text
                      style={{
                        color: text,
                        fontSize: 24,
                      }}
                    >
                      {itemEnCarrito?.cantidad ?? 0}
                    </Text>

                    {/* MÁS */}
                    <TouchableOpacity
                      onPress={() => {
                        agregarAlCarrito({
                          id: `${productoSeleccionado._id}-${precio.tipo}`,
                          productoId: productoSeleccionado._id,
                          nombre: productoSeleccionado.nombre,
                          tipo: precio.tipo,
                          precio: precio.valor,
                          cantidad: 1,
                          total: precio.valor,
                          equivalencia: precio.equivalencia,
                        });
                      }}
                      style={{
                        backgroundColor: primary,
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 28,
                        }}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              onPress={() => setShowTipoModal(false)}
              style={{
                marginTop: 10,
                padding: 15,
                borderRadius: 12,
                backgroundColor: border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: text,
                }}
              >
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/*  BOTÓN */}
      <TouchableOpacity
        onPress={() => router.push("/add_product")}
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Entypo name="add-to-list" size={28} color="white" />
      </TouchableOpacity>

      {/* CARRITO BOTÓN */}
      <TouchableOpacity
        onPress={() => router.push("/cart")}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          padding: 15,
        }}
      >
        <Entypo name="shopping-cart" size={26} color={text} />
      </TouchableOpacity>

      {/* ========================================================
           BOTÓN TEMPORAL PARA BORRAR EL TOKEN
          
          ESTE BOTÓN ES SOLO PARA PRUEBAS.
          
          DESPUÉS DE ELIMINAR EL TOKEN:
          1. BORRA TODO ESTE BLOQUE.
          2. BORRA LA FUNCIÓN "borrarToken".
          3. BORRA EL IMPORT DE AsyncStorage.
          
          ======================================================== */}

      <TouchableOpacity
        onPress={borrarToken}
        style={{
          position: "absolute",
          bottom: 30,
          left: 20,
          backgroundColor: "#ff0000",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
          }}
        >
          BORRAR TOKEN
        </Text>
      </TouchableOpacity>

      {/* ========================================================
           FIN DEL BOTÓN TEMPORAL
          ======================================================== */}
    </View>
  );
}
