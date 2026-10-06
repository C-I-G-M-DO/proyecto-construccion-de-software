import type { ExpiryAlert } from "@/types/expiry";
import type { LoteInicial, Producto } from "@/types/products";
import { dateKey, daysBetween, parseDate } from "./dates";

export const EXPIRY_WARNING_DAYS = 7;

export function initialLots(
  enabled: boolean,
  date: string,
  quantity: number,
): LoteInicial[] | undefined {
  if (!enabled) return undefined;
  if (!parseDate(date))
    throw new Error("Selecciona una fecha de vencimiento válida.");
  if (!Number.isFinite(quantity) || quantity <= 0)
    throw new Error(
      "Indica una cantidad mayor que cero para registrar el vencimiento.",
    );
  return [{ cantidad: quantity, fechaVencimiento: date }];
}

/** Derive UI alerts only from dates and remaining quantities supplied by the API. */
export function expiryAlerts(
  products: Producto[],
  now = new Date(),
): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];

  for (const product of products) {
    for (const [index, lot] of (Array.isArray(product.lotes)
      ? product.lotes
      : []
    ).entries()) {
      if (!lot) continue;

      // MongoDB puede devolver:
      // "2026-10-20T00:00:00.000Z"
      // mientras que daysBetween() necesita:
      // "2026-10-20"
      const fechaVencimiento = String(lot.fechaVencimiento).slice(0, 10);

      const days = daysBetween(dateKey(now), fechaVencimiento);

      if (
        days === null ||
        !Number.isFinite(lot.cantidadDisponible) ||
        lot.cantidadDisponible <= 0
      ) {
        continue;
      }

      alerts.push({
        id: `${product._id}/${lot._id ?? index}`,
        productoId: product._id,
        nombre: product.nombre,
        imagen: product.imagen,
        cantidad: lot.cantidadDisponible,
        unidadStock: product.unidadStock ?? "unidad",
        fechaVencimiento,
        diasRestantes: days,
        estado:
          days < 0
            ? "vencido"
            : days <= EXPIRY_WARNING_DAYS
              ? "pronto"
              : "vigente",
      });
    }
  }

  return alerts.sort(
    (a, b) =>
      a.diasRestantes - b.diasRestantes ||
      a.nombre.localeCompare(b.nombre, "es"),
  );
}

export function expiryLabel(days: number): string {
  if (days < 0)
    return `Vencido hace ${Math.abs(days)} día${days === -1 ? "" : "s"}`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `Vence en ${days} días`;
}
