import { useSurtioTheme } from "@/hooks/use-surtio-theme";
import Entypo from "@expo/vector-icons/Entypo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as XLSX from "xlsx";

type Reporte = {
  fecha?: string;
  cantidadVentas?: number;
  ingresos?: number;
  subtotal?: number;
  descuentosPuntos?: number;
  puntosCanjeados?: number;
  puntosGanados?: number;
  ticketPromedio?: number;

  ventasPorMetodoPago?: {
    efectivo?: number;
    tarjeta?: number;
    transferencia?: number;
    mixto?: number;
  };

  productosVendidos?: {
    productoId?: string;
    nombre?: string;
    cantidadVendida?: number;
    unidadesStockConsumidas?: number;
    totalVendido?: number;
  }[];
};

const money = (value: number | undefined | null) => {
  const amount = Number(value) || 0;

  return `RD$${amount.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const number = (value: number | undefined | null) => {
  return (Number(value) || 0).toLocaleString("es-DO");
};

function fechaHoy() {
  const ahora = new Date();

  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearFecha(fecha?: string) {
  if (!fecha) return "";

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [year, month, day] = partes;

  return `${day}/${month}/${year}`;
}

function nombreArchivoFecha(fecha?: string) {
  return fecha?.replace(/-/g, "") || fechaHoy().replace(/-/g, "");
}

/* =========================================================
   GENERAR EXCEL
========================================================= */

async function exportarExcel(
  reporte: Reporte,
  titulo: string,
  fechaDesde?: string,
  fechaHasta?: string,
) {
  try {
    const filas: any[][] = [];

    filas.push(["SURTÍO"]);
    filas.push([titulo]);
    filas.push([]);

    if (fechaDesde && fechaHasta) {
      filas.push([
        "Período",
        `${formatearFecha(fechaDesde)} - ${formatearFecha(fechaHasta)}`,
      ]);
    } else {
      filas.push(["Fecha", formatearFecha(reporte.fecha || fechaHoy())]);
    }

    filas.push([]);

    filas.push(["RESUMEN"]);
    filas.push(["Concepto", "Valor"]);

    filas.push(["Cantidad de ventas", Number(reporte.cantidadVentas) || 0]);

    filas.push(["Ingresos", Number(reporte.ingresos) || 0]);

    filas.push(["Subtotal", Number(reporte.subtotal) || 0]);

    filas.push([
      "Descuentos por puntos",
      Number(reporte.descuentosPuntos) || 0,
    ]);

    filas.push(["Puntos canjeados", Number(reporte.puntosCanjeados) || 0]);

    filas.push(["Puntos ganados", Number(reporte.puntosGanados) || 0]);

    filas.push(["Ticket promedio", Number(reporte.ticketPromedio) || 0]);

    filas.push([]);

    filas.push(["MÉTODOS DE PAGO"]);
    filas.push(["Método", "Total"]);

    filas.push([
      "Efectivo",
      Number(reporte.ventasPorMetodoPago?.efectivo) || 0,
    ]);

    filas.push(["Tarjeta", Number(reporte.ventasPorMetodoPago?.tarjeta) || 0]);

    filas.push([
      "Transferencia",
      Number(reporte.ventasPorMetodoPago?.transferencia) || 0,
    ]);

    filas.push(["Mixto", Number(reporte.ventasPorMetodoPago?.mixto) || 0]);

    filas.push([]);

    filas.push(["PRODUCTOS VENDIDOS"]);

    filas.push([
      "Producto",
      "Cantidad vendida",
      "Stock consumido",
      "Total vendido",
    ]);

    if (reporte.productosVendidos?.length) {
      reporte.productosVendidos.forEach((producto) => {
        filas.push([
          producto.nombre || "Producto",
          Number(producto.cantidadVendida) || 0,
          Number(producto.unidadesStockConsumidas) || 0,
          Number(producto.totalVendido) || 0,
        ]);
      });
    } else {
      filas.push(["No hay productos vendidos", "", "", 0]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(filas);

    worksheet["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 20 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    const excelBase64 = XLSX.write(workbook, {
      type: "base64",
      bookType: "xlsx",
    });

    const fechaArchivo =
      fechaDesde && fechaHasta
        ? `${nombreArchivoFecha(fechaDesde)}_${nombreArchivoFecha(fechaHasta)}`
        : nombreArchivoFecha(reporte.fecha);

    const fileUri = `${FileSystem.cacheDirectory}reporte_surtio_${fechaArchivo}.xlsx`;

    await FileSystem.writeAsStringAsync(fileUri, excelBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const disponible = await Sharing.isAvailableAsync();

    if (!disponible) {
      Alert.alert("Excel generado", `El archivo fue generado en:\n${fileUri}`);
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Compartir reporte Excel",
      UTI: "com.microsoft.excel.xlsx",
    });
  } catch (error) {
    console.error("Error exportando Excel:", error);

    Alert.alert("Error", "No se pudo generar el archivo Excel.");
  }
}

/* =========================================================
   GENERAR PDF
========================================================= */

async function exportarPDF(
  reporte: Reporte,
  titulo: string,
  fechaDesde?: string,
  fechaHasta?: string,
) {
  try {
    const productos = reporte.productosVendidos || [];

    const filasProductos =
      productos.length > 0
        ? productos
            .map(
              (producto) => `
                <tr>
                  <td>${producto.nombre || "Producto"}</td>
                  <td>${Number(producto.cantidadVendida) || 0}</td>
                  <td>${Number(producto.unidadesStockConsumidas) || 0}</td>
                  <td>${money(producto.totalVendido)}</td>
                </tr>
              `,
            )
            .join("")
        : `
            <tr>
              <td colspan="4" class="empty">
                No hay productos vendidos
              </td>
            </tr>
          `;

    const periodo =
      fechaDesde && fechaHasta
        ? `${formatearFecha(fechaDesde)} - ${formatearFecha(fechaHasta)}`
        : formatearFecha(reporte.fecha || fechaHoy());

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              padding: 32px;
              color: #222222;
            }

            .header {
              text-align: center;
              margin-bottom: 30px;
            }

            .brand {
              font-size: 30px;
              font-weight: bold;
              color: #C00000;
              margin-bottom: 5px;
            }

            .title {
              font-size: 21px;
              font-weight: bold;
            }

            .period {
              color: #666666;
              margin-top: 8px;
              font-size: 13px;
            }

            .section {
              margin-top: 25px;
            }

            .section-title {
              font-size: 17px;
              font-weight: bold;
              border-bottom: 2px solid #C00000;
              padding-bottom: 7px;
              margin-bottom: 12px;
            }

            .summary {
              width: 100%;
              border-collapse: collapse;
            }

            .summary td {
              padding: 9px 5px;
              border-bottom: 1px solid #eeeeee;
            }

            .summary td:last-child {
              text-align: right;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th {
              background: #f3f3f3;
              text-align: left;
              padding: 9px;
              font-size: 12px;
            }

            td {
              padding: 9px;
              border-bottom: 1px solid #eeeeee;
              font-size: 12px;
            }

            td:last-child {
              text-align: right;
            }

            .empty {
              text-align: center !important;
              color: #777777;
            }

            .footer {
              margin-top: 35px;
              text-align: center;
              color: #888888;
              font-size: 10px;
            }
          </style>
        </head>

        <body>

          <div class="header">
            <div class="brand">
              SURTÍO
            </div>

            <div class="title">
              ${titulo}
            </div>

            <div class="period">
              ${periodo}
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              Resumen
            </div>

            <table class="summary">
              <tr>
                <td>Cantidad de ventas</td>
                <td>
                  ${number(reporte.cantidadVentas)}
                </td>
              </tr>

              <tr>
                <td>Ingresos</td>
                <td>
                  ${money(reporte.ingresos)}
                </td>
              </tr>

              <tr>
                <td>Subtotal</td>
                <td>
                  ${money(reporte.subtotal)}
                </td>
              </tr>

              <tr>
                <td>Descuentos por puntos</td>
                <td>
                  ${money(reporte.descuentosPuntos)}
                </td>
              </tr>

              <tr>
                <td>Puntos canjeados</td>
                <td>
                  ${number(reporte.puntosCanjeados)}
                </td>
              </tr>

              <tr>
                <td>Puntos ganados</td>
                <td>
                  ${number(reporte.puntosGanados)}
                </td>
              </tr>

              <tr>
                <td>Ticket promedio</td>
                <td>
                  ${money(reporte.ticketPromedio)}
                </td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">
              Métodos de pago
            </div>

            <table class="summary">
              <tr>
                <td>Efectivo</td>
                <td>
                  ${money(reporte.ventasPorMetodoPago?.efectivo)}
                </td>
              </tr>

              <tr>
                <td>Tarjeta</td>
                <td>
                  ${money(reporte.ventasPorMetodoPago?.tarjeta)}
                </td>
              </tr>

              <tr>
                <td>Transferencia</td>
                <td>
                  ${money(reporte.ventasPorMetodoPago?.transferencia)}
                </td>
              </tr>

              <tr>
                <td>Mixto</td>
                <td>
                  ${money(reporte.ventasPorMetodoPago?.mixto)}
                </td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">
              Productos vendidos
            </div>

            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Stock consumido</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                ${filasProductos}
              </tbody>
            </table>
          </div>

          <div class="footer">
            Reporte generado por Surtío
          </div>

        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html,
    });

    const fechaArchivo =
      fechaDesde && fechaHasta
        ? `${nombreArchivoFecha(fechaDesde)}_${nombreArchivoFecha(fechaHasta)}`
        : nombreArchivoFecha(reporte.fecha);

    const destino =
      `${FileSystem.cacheDirectory}` + `reporte_surtio_${fechaArchivo}.pdf`;

    await FileSystem.copyAsync({
      from: uri,
      to: destino,
    });

    const disponible = await Sharing.isAvailableAsync();

    if (!disponible) {
      Alert.alert("PDF generado", `El archivo fue generado en:\n${destino}`);
      return;
    }

    await Sharing.shareAsync(destino, {
      mimeType: "application/pdf",
      dialogTitle: "Compartir reporte PDF",
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    console.error("Error exportando PDF:", error);

    Alert.alert("Error", "No se pudo generar el archivo PDF.");
  }
}

/* =========================================================
   PANTALLA
========================================================= */

export default function ReportsScreen() {
  const t = useSurtioTheme();
  const router = useRouter();

  const [reporteHoy, setReporteHoy] = useState<Reporte | null>(null);

  const [reportesDiarios, setReportesDiarios] = useState<Reporte[]>([]);

  const [fechaDesde, setFechaDesde] = useState(fechaHoy());

  const [fechaHasta, setFechaHasta] = useState(fechaHoy());

  const [reporteRango, setReporteRango] = useState<Reporte | null>(null);

  const [loading, setLoading] = useState(true);

  const [loadingRango, setLoadingRango] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const api = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

  const back = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  };

  const fetchWithAuth = async (url: string) => {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      throw new Error("Sesión no encontrada");
    }

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      await AsyncStorage.removeItem("token");

      await AsyncStorage.removeItem("nombreColmado");

      router.replace("/login");

      throw new Error("Sesión expirada");
    }

    return res;
  };

  const cargarReportes = async () => {
    try {
      if (!api) {
        throw new Error(
          "Falta configurar EXPO_PUBLIC_API_URL en el archivo .env",
        );
      }

      const hoy = fechaHoy();

      const [rangoResponse, diariosResponse] = await Promise.all([
        fetchWithAuth(`${api}/api/reports?desde=${hoy}&hasta=${hoy}`),

        fetchWithAuth(`${api}/api/reports/daily`),
      ]);

      const rangoData = await rangoResponse.json().catch(() => null);

      const diariosData = await diariosResponse.json().catch(() => null);

      if (!rangoResponse.ok) {
        throw new Error(
          rangoData?.message || "No se pudo cargar el reporte de hoy.",
        );
      }

      if (!diariosResponse.ok) {
        throw new Error(
          diariosData?.message || "No se pudieron cargar los reportes diarios.",
        );
      }

      const reporteHoyData = rangoData?.reporte ?? rangoData ?? null;

      const diarios = diariosData?.reportes ?? diariosData ?? [];

      setReporteHoy(reporteHoyData);

      setReportesDiarios(Array.isArray(diarios) ? diarios : []);
    } catch (error) {
      console.log("Error cargando reportes:", error);

      Alert.alert(
        "No se pudieron cargar los reportes",
        error instanceof Error
          ? error.message
          : "Revisa la conexión e inténtalo nuevamente.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReportes();
    }, []),
  );

  const actualizar = () => {
    setRefreshing(true);
    cargarReportes();
  };

  const consultarRango = async () => {
    if (!fechaDesde.trim() || !fechaHasta.trim()) {
      Alert.alert(
        "Fechas requeridas",
        "Indica la fecha inicial y la fecha final.",
      );
      return;
    }

    if (fechaDesde > fechaHasta) {
      Alert.alert(
        "Rango inválido",
        "La fecha inicial no puede ser posterior a la fecha final.",
      );
      return;
    }

    try {
      if (!api) {
        throw new Error(
          "Falta configurar EXPO_PUBLIC_API_URL en el archivo .env",
        );
      }

      setLoadingRango(true);

      const res = await fetchWithAuth(
        `${api}/api/reports?desde=${fechaDesde}&hasta=${fechaHasta}`,
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo generar el reporte.");
      }

      setReporteRango(data?.reporte ?? data ?? null);
    } catch (error) {
      console.log("Error consultando reporte:", error);

      Alert.alert(
        "No se pudo generar el reporte",
        error instanceof Error
          ? error.message
          : "Revisa las fechas e inténtalo nuevamente.",
      );
    } finally {
      setLoadingRango(false);
    }
  };

  const card = {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.card,
    gap: 14,
  };

  const muted = {
    color: t.secondary,
    fontSize: 13,
    lineHeight: 20,
  };

  const label = {
    color: t.text,
    fontSize: 17,
    fontWeight: "600" as const,
  };

  const input = {
    minHeight: 52,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.background,
    color: t.text,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: t.background,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={t.primary} />

          <Text
            style={{
              color: t.secondary,
              marginTop: 12,
              fontSize: 14,
            }}
          >
            Cargando reportes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: t.background,
      }}
    >
      <FlatList
        data={reportesDiarios}
        keyExtractor={(item, index) => item.fecha || String(index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={actualizar}
            tintColor={t.primary}
          />
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 35,
          gap: 14,
          width: "100%",
          maxWidth: 680,
          alignSelf: "center",
        }}
        ListHeaderComponent={
          <View style={{ gap: 18 }}>
            {/* VOLVER */}

            <Pressable
              onPress={back}
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
                  fontSize: 15,
                }}
              >
                ← Volver
              </Text>
            </Pressable>

            {/* ENCABEZADO */}

            <View style={{ gap: 7 }}>
              <Text
                style={{
                  color: t.text,
                  fontSize: 28,
                  fontWeight: "700",
                }}
              >
                Reportes
              </Text>

              <Text style={muted}>
                Consulta las ventas y el rendimiento de tu negocio.
              </Text>
            </View>

            {/* REPORTE HOY */}

            <View style={card}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={label}>Resumen de hoy</Text>

                  <Text style={muted}>
                    {formatearFecha(reporteHoy?.fecha || fechaHoy())}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: t.tint,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      color: t.primary,
                      fontSize: 10,
                      fontWeight: "800",
                      letterSpacing: 0.8,
                    }}
                  >
                    HOY
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <MetricCard
                  label="Ingresos"
                  value={money(reporteHoy?.ingresos)}
                  t={t}
                />

                <MetricCard
                  label="Ventas"
                  value={number(reporteHoy?.cantidadVentas)}
                  t={t}
                />

                <MetricCard
                  label="Ticket promedio"
                  value={money(reporteHoy?.ticketPromedio)}
                  t={t}
                />

                <MetricCard
                  label="Puntos ganados"
                  value={number(reporteHoy?.puntosGanados)}
                  t={t}
                />
              </View>

              {/* BOTONES EXPORTAR */}

              {reporteHoy && (
                <ExportButtons
                  onExcel={() =>
                    exportarExcel(reporteHoy, "Reporte de ventas del día")
                  }
                  onPDF={() =>
                    exportarPDF(reporteHoy, "Reporte de ventas del día")
                  }
                  t={t}
                />
              )}
            </View>

            {/* MÉTODOS DE PAGO */}

            <View style={card}>
              <Text style={label}>Ventas por método de pago</Text>

              <PaymentRow
                label="Efectivo"
                value={reporteHoy?.ventasPorMetodoPago?.efectivo}
                t={t}
              />

              <PaymentRow
                label="Tarjeta"
                value={reporteHoy?.ventasPorMetodoPago?.tarjeta}
                t={t}
              />

              <PaymentRow
                label="Transferencia"
                value={reporteHoy?.ventasPorMetodoPago?.transferencia}
                t={t}
              />

              <PaymentRow
                label="Mixto"
                value={reporteHoy?.ventasPorMetodoPago?.mixto}
                t={t}
              />
            </View>

            {/* PRODUCTOS */}

            <View style={card}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <Text style={label}>Productos vendidos</Text>

                <Text
                  style={{
                    color: t.secondary,
                    fontSize: 12,
                  }}
                >
                  {number(reporteHoy?.productosVendidos?.length)} productos
                </Text>
              </View>

              {reporteHoy?.productosVendidos?.length ? (
                reporteHoy.productosVendidos.map((producto, index) => (
                  <ProductReportRow
                    key={producto.productoId || `${producto.nombre}-${index}`}
                    producto={producto}
                    index={index}
                    t={t}
                  />
                ))
              ) : (
                <EmptyState
                  text="Todavía no hay productos vendidos hoy."
                  t={t}
                />
              )}
            </View>

            {/* RANGO */}

            <View style={card}>
              <View
                style={{
                  gap: 4,
                }}
              >
                <Text style={label}>Reporte por fechas</Text>

                <Text style={muted}>
                  Consulta las ventas acumuladas entre dos fechas.
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: t.secondary,
                      fontSize: 11,
                      fontWeight: "700",
                      marginBottom: 6,
                    }}
                  >
                    DESDE
                  </Text>

                  <TextInput
                    value={fechaDesde}
                    onChangeText={setFechaDesde}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={t.secondary}
                    style={input}
                    autoCapitalize="none"
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: t.secondary,
                      fontSize: 11,
                      fontWeight: "700",
                      marginBottom: 6,
                    }}
                  >
                    HASTA
                  </Text>

                  <TextInput
                    value={fechaHasta}
                    onChangeText={setFechaHasta}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={t.secondary}
                    style={input}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Pressable
                onPress={consultarRango}
                disabled={loadingRango}
                style={{
                  minHeight: 54,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: t.button,
                  opacity: loadingRango ? 0.6 : 1,
                }}
              >
                {loadingRango ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    Generar reporte
                  </Text>
                )}
              </Pressable>
            </View>

            {/* RESULTADO RANGO */}

            {reporteRango && (
              <View style={card}>
                <Text style={label}>Resultado del período</Text>

                <Text style={muted}>
                  {formatearFecha(fechaDesde)} → {formatearFecha(fechaHasta)}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <MetricCard
                    label="Ingresos"
                    value={money(reporteRango.ingresos)}
                    t={t}
                  />

                  <MetricCard
                    label="Ventas"
                    value={number(reporteRango.cantidadVentas)}
                    t={t}
                  />

                  <MetricCard
                    label="Ticket promedio"
                    value={money(reporteRango.ticketPromedio)}
                    t={t}
                  />

                  <MetricCard
                    label="Descuentos"
                    value={money(reporteRango.descuentosPuntos)}
                    t={t}
                  />
                </View>

                <Text
                  style={{
                    color: t.text,
                    fontSize: 15,
                    fontWeight: "700",
                    marginTop: 4,
                  }}
                >
                  Productos vendidos
                </Text>

                {reporteRango.productosVendidos?.length ? (
                  reporteRango.productosVendidos.map((producto, index) => (
                    <ProductReportRow
                      key={
                        producto.productoId ||
                        `${producto.nombre}-rango-${index}`
                      }
                      producto={producto}
                      index={index}
                      t={t}
                    />
                  ))
                ) : (
                  <EmptyState
                    text="No hay productos vendidos en este período."
                    t={t}
                  />
                )}

                {/* EXPORTAR RANGO */}

                <ExportButtons
                  onExcel={() =>
                    exportarExcel(
                      reporteRango,
                      "Reporte de ventas por período",
                      fechaDesde,
                      fechaHasta,
                    )
                  }
                  onPDF={() =>
                    exportarPDF(
                      reporteRango,
                      "Reporte de ventas por período",
                      fechaDesde,
                      fechaHasta,
                    )
                  }
                  t={t}
                />
              </View>
            )}

            {/* HISTORIAL */}

            <View
              style={{
                marginTop: 4,
                marginBottom: 2,
              }}
            >
              <Text style={label}>Reportes diarios</Text>

              <Text style={muted}>Historial de los reportes generados.</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              width: "100%",
              maxWidth: 648,
              alignSelf: "center",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.card,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: t.tint,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Entypo name="bar-graph" size={20} color={t.primary} />
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Text
                style={{
                  color: t.text,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {formatearFecha(item.fecha)}
              </Text>

              <Text
                style={{
                  color: t.secondary,
                  fontSize: 11,
                  marginTop: 3,
                }}
              >
                {number(item.cantidadVentas)}{" "}
                {Number(item.cantidadVentas) === 1 ? "venta" : "ventas"}
              </Text>
            </View>

            <View
              style={{
                alignItems: "flex-end",
              }}
            >
              <Text
                style={{
                  color: t.text,
                  fontSize: 14,
                  fontWeight: "800",
                }}
              >
                {money(item.ingresos)}
              </Text>

              <Text
                style={{
                  color: t.secondary,
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                Ticket {money(item.ticketPromedio)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingHorizontal: 25,
              paddingVertical: 35,
            }}
          >
            <Entypo name="bar-graph" size={34} color={t.secondary} />

            <Text
              style={{
                color: t.text,
                fontSize: 16,
                fontWeight: "700",
                marginTop: 10,
              }}
            >
              Aún no hay reportes diarios
            </Text>

            <Text
              style={{
                color: t.secondary,
                fontSize: 13,
                lineHeight: 19,
                marginTop: 5,
                textAlign: "center",
                maxWidth: 400,
              }}
            >
              Los reportes diarios aparecerán aquí cuando sean generados por el
              sistema.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/* =========================================================
   BOTONES DE EXPORTACIÓN
========================================================= */

function ExportButtons({
  onExcel,
  onPDF,
  t,
}: {
  onExcel: () => void;
  onPDF: () => void;
  t: ReturnType<typeof useSurtioTheme>;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        marginTop: 4,
      }}
    >
      <Pressable
        onPress={onExcel}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.background,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 7,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Entypo name="download" size={17} color={t.primary} />

        <Text
          style={{
            color: t.primary,
            fontSize: 14,
            fontWeight: "700",
          }}
        >
          Excel
        </Text>
      </Pressable>

      <Pressable
        onPress={onPDF}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 48,
          borderRadius: 12,
          backgroundColor: t.button,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 7,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Entypo name="download" size={17} color="#FFFFFF" />

        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "700",
          }}
        >
          PDF
        </Text>
      </Pressable>
    </View>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function MetricCard({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: ReturnType<typeof useSurtioTheme>;
}) {
  return (
    <View
      style={{
        flexBasis: "47%",
        flexGrow: 1,
        minHeight: 105,
        padding: 13,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.background,
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          color: t.secondary,
          fontSize: 11,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: t.text,
          fontSize: 20,
          fontWeight: "800",
          marginTop: 8,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function PaymentRow({
  label,
  value,
  t,
}: {
  label: string;
  value?: number;
  t: ReturnType<typeof useSurtioTheme>;
}) {
  return (
    <View
      style={{
        minHeight: 42,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          color: t.text,
          opacity: 0.72,
          fontSize: 14,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: t.text,
          fontSize: 15,
          fontWeight: "800",
        }}
      >
        {money(value)}
      </Text>
    </View>
  );
}

function ProductReportRow({
  producto,
  index,
  t,
}: {
  producto: NonNullable<Reporte["productosVendidos"]>[number];
  index: number;
  t: ReturnType<typeof useSurtioTheme>;
}) {
  return (
    <View
      style={{
        minHeight: 58,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: t.tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: t.primary,
            fontSize: 13,
            fontWeight: "900",
          }}
        >
          {index + 1}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: t.text,
            fontSize: 14,
            fontWeight: "700",
          }}
        >
          {producto.nombre || "Producto"}
        </Text>

        <Text
          style={{
            color: t.secondary,
            fontSize: 11,
            marginTop: 2,
          }}
        >
          {number(producto.cantidadVendida)} vendidos
          {" · "}
          {number(producto.unidadesStockConsumidas)} unidades de inventario
        </Text>
      </View>

      <Text
        style={{
          color: t.text,
          fontSize: 14,
          fontWeight: "800",
        }}
      >
        {money(producto.totalVendido)}
      </Text>
    </View>
  );
}

function EmptyState({
  text,
  t,
}: {
  text: string;
  t: ReturnType<typeof useSurtioTheme>;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
      }}
    >
      <Text
        style={{
          color: t.secondary,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        {text}
      </Text>
    </View>
  );
}
