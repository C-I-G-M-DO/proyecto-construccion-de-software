import Ionicons from "@/components/ui/business-icon";
import { useProducts } from "@/context/product_context";
import { useSurtioStyles, useSurtioTheme } from "@/hooks/use-surtio-theme";
import { businessStyles } from "@/styles/business.styles";
import type { ExpiryAlert } from "@/types/expiry";
import { formatDate } from "@/utils/dates";
import { expiryLabel } from "@/utils/expiry";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  alert: ExpiryAlert;
  onRetired?: () => void;
};

export default function ExpiryCard({ alert, onRetired }: Props) {
  const t = useSurtioTheme();
  const s = useSurtioStyles(businessStyles);
  const { retirarLoteVencido } = useProducts();

  const [modalVisible, setModalVisible] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("Producto vencido");
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  const color =
    alert.estado === "vencido"
      ? t.primary
      : alert.estado === "pronto"
        ? t.dark
          ? "#FFD28A"
          : "#765114"
        : t.dark
          ? "#8DDDB0"
          : "#247347";

  const cerrarModal = () => {
    if (guardando) return;
    setModalVisible(false);
    setCantidad("");
    setMotivo("Producto vencido");
    setError("");
  };

  const confirmarRetirada = async () => {
    const cantidadNumerica = Number(cantidad);

    if (!alert.loteId) {
      setError(
        "Este lote no tiene un identificador válido. Actualiza los productos e inténtalo de nuevo.",
      );
      return;
    }

    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
      setError("Indica una cantidad mayor que cero.");
      return;
    }

    if (alert.unidadStock === "unidad" && !Number.isInteger(cantidadNumerica)) {
      setError("La cantidad debe ser un número entero.");
      return;
    }

    if (cantidadNumerica > alert.cantidad) {
      setError(
        `Solo quedan ${alert.cantidad} ${
          alert.unidadStock === "libra" ? "lb" : "unidades"
        } disponibles en este lote.`,
      );
      return;
    }

    if (!motivo.trim()) {
      setError("Indica el motivo de la retirada.");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      await retirarLoteVencido(
        alert.productoId,
        alert.loteId,
        cantidadNumerica,
        motivo.trim(),
      );

      cerrarDespuesDeGuardar();

      Alert.alert(
        "Retirada registrada",
        "Las existencias se actualizaron y la retirada quedó registrada en el historial. No se generó ninguna venta.",
      );

      onRetired?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo registrar la retirada.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const cerrarDespuesDeGuardar = () => {
    setModalVisible(false);
    setCantidad("");
    setMotivo("Producto vencido");
    setError("");
  };

  return (
    <>
      <View style={[s.card, { marginBottom: 12, gap: 12 }]}>
        <View style={[s.row, { flexWrap: "nowrap", alignItems: "flex-start" }]}>
          {alert.imagen ? (
            <Image
              source={{ uri: alert.imagen }}
              style={{
                width: 58,
                height: 58,
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="cube-outline" color={t.secondary} size={32} />
          )}

          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[s.label, { color }]}>
              {expiryLabel(alert.diasRestantes)}
            </Text>

            <Text style={[s.heading, { fontSize: 18 }]}>{alert.nombre}</Text>

            <Text style={s.muted}>
              {alert.cantidad.toLocaleString("es-DO")}{" "}
              {alert.unidadStock === "libra"
                ? "lb disponibles en este lote"
                : "unidades disponibles en este lote"}
            </Text>
          </View>
        </View>

        <Text style={s.muted}>
          Vencimiento · {formatDate(alert.fechaVencimiento)}
        </Text>

        {alert.estado === "vencido" && (
          <>
            <Text style={s.text}>
              Este lote está vencido. Retira las existencias que correspondan
              para que no sigan formando parte del inventario disponible.
            </Text>

            <Pressable
              disabled={!alert.loteId}
              onPress={() => setModalVisible(true)}
              style={{
                backgroundColor: t.primary,
                padding: 13,
                borderRadius: 10,
                alignItems: "center",
                opacity: alert.loteId ? 1 : 0.5,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                Retirar producto vencido
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000080",
            justifyContent: "center",
            padding: 22,
          }}
        >
          <View
            style={{
              backgroundColor: t.background,
              borderRadius: 16,
              padding: 20,
              gap: 14,
            }}
          >
            <Text style={[s.heading, { fontSize: 20 }]}>
              Retirar lote vencido
            </Text>

            <Text style={s.text}>{alert.nombre}</Text>

            <Text style={s.muted}>
              Vencimiento: {formatDate(alert.fechaVencimiento)}
            </Text>

            <Text style={s.muted}>
              Cantidad máxima: {alert.cantidad.toLocaleString("es-DO")}{" "}
              {alert.unidadStock === "libra" ? "lb" : "unidades"}
            </Text>

            <TextInput
              value={cantidad}
              onChangeText={setCantidad}
              placeholder="Cantidad que vas a retirar"
              placeholderTextColor={t.secondary}
              keyboardType="decimal-pad"
              editable={!guardando}
              style={{
                borderWidth: 1,
                borderColor: t.secondary,
                borderRadius: 10,
                padding: 12,
                color: t.text,
              }}
            />

            <TextInput
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Motivo de la retirada"
              placeholderTextColor={t.secondary}
              editable={!guardando}
              style={{
                borderWidth: 1,
                borderColor: t.secondary,
                borderRadius: 10,
                padding: 12,
                color: t.text,
              }}
            />

            {!!error && <Text style={{ color: t.primary }}>{error}</Text>}

            <Text style={s.muted}>
              Esta operación descuenta inventario, pero no registra una venta ni
              un ingreso.
            </Text>

            <View style={[s.row, { gap: 10 }]}>
              <Pressable
                disabled={guardando}
                onPress={cerrarModal}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: t.secondary,
                }}
              >
                <Text style={s.text}>Cancelar</Text>
              </Pressable>

              <Pressable
                disabled={guardando}
                onPress={() => void confirmarRetirada()}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: t.primary,
                  opacity: guardando ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                  {guardando ? "Guardando…" : "Confirmar retirada"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
