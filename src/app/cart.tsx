import { useThemeColor } from "@/hooks/use-theme-color";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useCart } from "../context/cart_context";
import { useProducts } from "../context/product_context";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("Falta EXPO_PUBLIC_API_URL en el archivo .env");
}

type Cliente = {
  _id: string;
  nombre: string;
  telefono: string;
  puntos: number;
};

export default function CartScreen() {
  const router = useRouter();

  const {
    carrito,
    agregarAlCarrito,
    disminuirDelCarrito,
    eliminarDelCarrito,
    total,
    vaciarCarrito,
  } = useCart();

  const { obtenerProductos } = useProducts();

  const [loading, setLoading] = useState(false);

  // Cliente
  const [telefono, setTelefono] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // Registro de cliente
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [nombreNuevoCliente, setNombreNuevoCliente] = useState("");
  const [registrandoCliente, setRegistrandoCliente] = useState(false);

  // Fidelidad
  const [canjearPuntos, setCanjearPuntos] = useState(false);
  const [puntosCanjeados, setPuntosCanjeados] = useState("");

  // Tema
  const background = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");
  const card = useThemeColor({}, "card");
  const border = useThemeColor({}, "border");
  const primary = useThemeColor({}, "primary");

  /**
   * Buscar cliente por teléfono
   */
  const buscarCliente = async () => {
    const telefonoLimpio = telefono.trim();

    if (!telefonoLimpio) {
      Alert.alert("Cliente", "Introduce un número de teléfono.");
      return;
    }

    try {
      setBuscandoCliente(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Sesión expirada.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/customers/telefono/${encodeURIComponent(
          telefonoLimpio,
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const textResponse = await response.text();

      let data: any = {};

      try {
        data = textResponse ? JSON.parse(textResponse) : {};
      } catch {
        data = {};
      }

      if (response.ok) {
        setCliente(data);

        // Reiniciar opciones de fidelidad
        setCanjearPuntos(false);
        setPuntosCanjeados("");

        // Ocultar registro si estaba abierto
        setMostrarRegistro(false);
        setNombreNuevoCliente("");

        return;
      }

      if (response.status === 404) {
        // No existe: permitimos registrarlo o continuar sin cliente
        setCliente(null);
        setCanjearPuntos(false);
        setPuntosCanjeados("");

        setNombreNuevoCliente("");
        setMostrarRegistro(true);

        return;
      }

      Alert.alert("Error", data.message || "No se pudo buscar el cliente.");
    } catch (error) {
      console.log("ERROR BUSCANDO CLIENTE:", error);

      Alert.alert("Error", "No se pudo conectar al servidor.");
    } finally {
      setBuscandoCliente(false);
    }
  };

  /**
   * Registrar cliente directamente desde el carrito
   */
  const registrarCliente = async () => {
    const nombre = nombreNuevoCliente.trim();
    const telefonoLimpio = telefono.trim();

    if (!telefonoLimpio) {
      Alert.alert("Cliente", "Introduce primero el teléfono.");
      return;
    }

    if (!nombre) {
      Alert.alert("Cliente", "Introduce el nombre del cliente.");
      return;
    }

    try {
      setRegistrandoCliente(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Sesión expirada.");
        return;
      }

      const response = await fetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre,
          telefono: telefonoLimpio,
        }),
      });

      const textResponse = await response.text();

      let data: any = {};

      try {
        data = textResponse ? JSON.parse(textResponse) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        Alert.alert(
          "Error",
          data.message || "No se pudo registrar el cliente.",
        );
        return;
      }

      // Seleccionamos automáticamente el cliente recién creado
      setCliente(data);

      // Limpiamos el formulario de registro
      setMostrarRegistro(false);
      setNombreNuevoCliente("");

      // Reiniciamos fidelidad
      setCanjearPuntos(false);
      setPuntosCanjeados("");

      Alert.alert(
        "Cliente registrado",
        `${data.nombre} fue registrado correctamente.`,
      );
    } catch (error) {
      console.log("ERROR REGISTRANDO CLIENTE:", error);

      Alert.alert("Error", "No se pudo conectar al servidor.");
    } finally {
      setRegistrandoCliente(false);
    }
  };

  /**
   * Quitar cliente de la venta
   */
  const quitarCliente = () => {
    setCliente(null);
    setCanjearPuntos(false);
    setPuntosCanjeados("");

    // No eliminamos el teléfono automáticamente.
    // Esto permite volver a buscarlo fácilmente.
  };

  /**
   * Activar / desactivar canje de puntos
   */
  const cambiarCanje = () => {
    if (!cliente) {
      Alert.alert("Cliente", "Primero debes seleccionar un cliente.");
      return;
    }

    if (cliente.puntos <= 0) {
      Alert.alert("Puntos", "Este cliente no tiene puntos disponibles.");
      return;
    }

    if (!canjearPuntos) {
      setCanjearPuntos(true);

      // Por defecto proponemos todos los puntos disponibles,
      // pero nunca más que el total de la venta.
      const puntosIniciales = Math.min(cliente.puntos, total);

      setPuntosCanjeados(String(Math.floor(puntosIniciales)));
    } else {
      setCanjearPuntos(false);
      setPuntosCanjeados("");
    }
  };

  /**
   * Puntos solicitados para canjear
   */
  const puntosSolicitados = Number(puntosCanjeados) || 0;

  /**
   * Descuento real mostrado en pantalla.
   *
   * 1 punto = RD$1
   */
  const descuentoAplicado =
    canjearPuntos && cliente
      ? Math.min(
          Math.max(0, Math.floor(puntosSolicitados)),
          cliente.puntos,
          total,
        )
      : 0;

  /**
   * Total final de la venta
   */
  const totalFinal = Math.max(0, total - descuentoAplicado);

  /**
   * Realizar venta
   */
  const realizarVenta = async () => {
    if (loading) return;

    if (carrito.length === 0) {
      Alert.alert("Carrito vacío");
      return;
    }

    // Validación del canje
    if (canjearPuntos) {
      if (!cliente) {
        Alert.alert(
          "Cliente",
          "Debes seleccionar un cliente para canjear puntos.",
        );
        return;
      }

      const puntos = Number(puntosCanjeados);

      if (
        !Number.isFinite(puntos) ||
        puntos <= 0 ||
        !Number.isInteger(puntos)
      ) {
        Alert.alert("Puntos", "Introduce una cantidad válida de puntos.");
        return;
      }

      if (puntos > cliente.puntos) {
        Alert.alert(
          "Puntos insuficientes",
          `El cliente tiene ${cliente.puntos} puntos disponibles.`,
        );
        return;
      }

      if (puntos > total) {
        Alert.alert(
          "Puntos",
          `No puedes canjear más de RD$${total} en esta venta.`,
        );
        return;
      }
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Sesión expirada.");
        return;
      }

      const response = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: carrito,
          subtotal: total,
          metodoPago: "efectivo",

          // Si no hay cliente, enviamos null.
          clienteId: cliente?._id || null,

          // Si no se canjean puntos, enviamos 0.
          puntosCanjeados: canjearPuntos ? puntosSolicitados : 0,
        }),
      });

      const textResponse = await response.text();

      let data: any = {};

      try {
        data = textResponse ? JSON.parse(textResponse) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        Alert.alert("Error", data.message || "No se pudo realizar la venta.");
        return;
      }

      // Guardamos información antes de limpiar
      const fidelidad = data.fidelidad;

      // Vaciar carrito
      vaciarCarrito();

      // Actualizar productos para reflejar el nuevo stock
      await obtenerProductos();

      // Limpiar cliente/fidelidad
      setCliente(null);
      setTelefono("");
      setCanjearPuntos(false);
      setPuntosCanjeados("");
      setMostrarRegistro(false);
      setNombreNuevoCliente("");

      if (fidelidad) {
        Alert.alert(
          "Venta realizada",
          `Venta realizada correctamente.\n\n` +
            `Cliente: ${fidelidad.nombre}\n` +
            `Puntos canjeados: ${fidelidad.puntosCanjeados}\n` +
            `Puntos ganados: ${fidelidad.puntosGanados}\n` +
            `Puntos disponibles: ${fidelidad.puntosDisponibles}`,
        );
      } else {
        Alert.alert("Venta realizada", "La venta se realizó correctamente.");
      }

      router.replace("/history");
    } catch (error) {
      console.log("ERROR VENTA:", error);

      Alert.alert("Error", "No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: background,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: text,
          marginBottom: 10,
        }}
      >
        Carrito
      </Text>

      <FlatList
        data={carrito}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        ListEmptyComponent={
          <Text
            style={{
              color: text,
              marginTop: 30,
              textAlign: "center",
            }}
          >
            No hay productos en el carrito
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              marginTop: 10,
              backgroundColor: card,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: border,
            }}
          >
            <Text
              style={{
                color: text,
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {item.nombre}
            </Text>

            <Text
              style={{
                color: text,
                marginTop: 4,
              }}
            >
              ${item.precio} ({item.tipo})
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <TouchableOpacity
                onPress={() => disminuirDelCarrito(item)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: text,
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  −
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  color: text,
                  fontSize: 20,
                  fontWeight: "bold",
                  marginHorizontal: 20,
                  minWidth: 30,
                  textAlign: "center",
                }}
              >
                {item.cantidad}
              </Text>

              <TouchableOpacity
                onPress={() => agregarAlCarrito(item)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: text,
                fontWeight: "bold",
                marginTop: 10,
                fontSize: 16,
              }}
            >
              Total: ${item.total}
            </Text>

            <TouchableOpacity
              onPress={() => eliminarDelCarrito(item.id)}
              style={{
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  color: "red",
                  fontWeight: "600",
                }}
              >
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          carrito.length > 0 ? (
            <View style={{ marginTop: 20 }}>
              {/* ========================= */}
              {/* CLIENTE / FIDELIDAD */}
              {/* ========================= */}

              <View
                style={{
                  backgroundColor: card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: border,
                  padding: 15,
                }}
              >
                <Text
                  style={{
                    color: text,
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 12,
                  }}
                >
                  Cliente y fidelidad
                </Text>

                <Text
                  style={{
                    color: text,
                    marginBottom: 6,
                  }}
                >
                  Teléfono del cliente
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <TextInput
                    value={telefono}
                    onChangeText={(value) => {
                      setTelefono(value);

                      // Si cambia el teléfono, quitamos el cliente
                      // seleccionado para evitar asociar la venta
                      // al cliente equivocado.
                      if (cliente) {
                        setCliente(null);
                        setCanjearPuntos(false);
                        setPuntosCanjeados("");
                      }

                      setMostrarRegistro(false);
                    }}
                    placeholder="Ej.: 8091234567"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: border,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      color: text,
                      backgroundColor: background,
                    }}
                  />

                  <TouchableOpacity
                    onPress={buscarCliente}
                    disabled={buscandoCliente}
                    style={{
                      marginLeft: 8,
                      backgroundColor: primary,
                      paddingHorizontal: 16,
                      height: 48,
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "bold",
                      }}
                    >
                      {buscandoCliente ? "Buscando..." : "Buscar"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ========================= */}
                {/* CLIENTE ENCONTRADO */}
                {/* ========================= */}

                {cliente && (
                  <View
                    style={{
                      marginTop: 15,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: background,
                      borderWidth: 1,
                      borderColor: border,
                    }}
                  >
                    <Text
                      style={{
                        color: text,
                        fontSize: 17,
                        fontWeight: "bold",
                      }}
                    >
                      {cliente.nombre}
                    </Text>

                    <Text
                      style={{
                        color: text,
                        marginTop: 4,
                      }}
                    >
                      📱 {cliente.telefono}
                    </Text>

                    <Text
                      style={{
                        color: text,
                        marginTop: 4,
                      }}
                    >
                      ⭐ Puntos disponibles: {cliente.puntos}
                    </Text>

                    <TouchableOpacity
                      onPress={quitarCliente}
                      style={{
                        marginTop: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: "red",
                          fontWeight: "600",
                        }}
                      >
                        Quitar cliente
                      </Text>
                    </TouchableOpacity>

                    {/* CANJEAR PUNTOS */}

                    {cliente.puntos > 0 && (
                      <View style={{ marginTop: 15 }}>
                        <TouchableOpacity
                          onPress={cambiarCanje}
                          style={{
                            borderWidth: 1,
                            borderColor: primary,
                            borderRadius: 10,
                            padding: 12,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: primary,
                              fontWeight: "bold",
                            }}
                          >
                            {canjearPuntos
                              ? "Cancelar canje de puntos"
                              : "Canjear puntos"}
                          </Text>
                        </TouchableOpacity>

                        {canjearPuntos && (
                          <View style={{ marginTop: 12 }}>
                            <Text
                              style={{
                                color: text,
                                marginBottom: 6,
                              }}
                            >
                              Puntos a canjear
                            </Text>

                            <TextInput
                              value={puntosCanjeados}
                              onChangeText={(value) => {
                                // Solo permitimos números enteros
                                const limpio = value.replace(/[^0-9]/g, "");

                                setPuntosCanjeados(limpio);
                              }}
                              keyboardType="number-pad"
                              placeholder={`Máximo ${Math.min(
                                cliente.puntos,
                                total,
                              )}`}
                              placeholderTextColor="#888"
                              style={{
                                height: 48,
                                borderWidth: 1,
                                borderColor: border,
                                borderRadius: 10,
                                paddingHorizontal: 12,
                                color: text,
                                backgroundColor: background,
                              }}
                            />

                            <Text
                              style={{
                                color: text,
                                marginTop: 6,
                                fontSize: 13,
                              }}
                            >
                              1 punto = RD$1 de descuento.
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* ========================= */}
                {/* CLIENTE NO ENCONTRADO */}
                {/* ========================= */}

                {!cliente && mostrarRegistro && (
                  <View
                    style={{
                      marginTop: 15,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: background,
                      borderWidth: 1,
                      borderColor: border,
                    }}
                  >
                    <Text
                      style={{
                        color: text,
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      Cliente no registrado
                    </Text>

                    <Text
                      style={{
                        color: text,
                        marginTop: 5,
                        marginBottom: 12,
                      }}
                    >
                      Puedes registrarlo ahora o continuar la venta sin cliente.
                    </Text>

                    <TextInput
                      value={nombreNuevoCliente}
                      onChangeText={setNombreNuevoCliente}
                      placeholder="Nombre del cliente"
                      placeholderTextColor="#888"
                      style={{
                        height: 48,
                        borderWidth: 1,
                        borderColor: border,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        color: text,
                        backgroundColor: card,
                      }}
                    />

                    <TouchableOpacity
                      onPress={registrarCliente}
                      disabled={registrandoCliente}
                      style={{
                        marginTop: 10,
                        backgroundColor: primary,
                        padding: 14,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontWeight: "bold",
                        }}
                      >
                        {registrandoCliente
                          ? "Registrando..."
                          : "Registrar cliente"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setMostrarRegistro(false);
                        setNombreNuevoCliente("");
                      }}
                      style={{
                        marginTop: 10,
                        padding: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: text,
                          fontWeight: "600",
                        }}
                      >
                        Continuar sin cliente
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* ========================= */}
              {/* RESUMEN DE VENTA */}
              {/* ========================= */}

              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: text,
                  marginTop: 20,
                }}
              >
                Resumen
              </Text>

              <View
                style={{
                  marginTop: 10,
                  padding: 15,
                  backgroundColor: card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: text }}>Subtotal</Text>

                  <Text
                    style={{
                      color: text,
                      fontWeight: "bold",
                    }}
                  >
                    RD${total}
                  </Text>
                </View>

                {descuentoAplicado > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ color: text }}>Descuento por puntos</Text>

                    <Text
                      style={{
                        color: "#16a34a",
                        fontWeight: "bold",
                      }}
                    >
                      -RD${descuentoAplicado}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    height: 1,
                    backgroundColor: border,
                    marginVertical: 12,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: text,
                      fontSize: 20,
                      fontWeight: "bold",
                    }}
                  >
                    Total
                  </Text>

                  <Text
                    style={{
                      color: primary,
                      fontSize: 22,
                      fontWeight: "bold",
                    }}
                  >
                    RD${totalFinal}
                  </Text>
                </View>
              </View>

              {/* ========================= */}
              {/* BOTÓN VENDER */}
              {/* ========================= */}

              <TouchableOpacity
                disabled={loading || carrito.length === 0}
                onPress={realizarVenta}
                style={{
                  backgroundColor:
                    loading || carrito.length === 0 ? "#999" : primary,
                  padding: 16,
                  borderRadius: 14,
                  marginTop: 20,
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 18,
                  }}
                >
                  {loading ? "Procesando..." : `Vender (RD$${totalFinal})`}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}
