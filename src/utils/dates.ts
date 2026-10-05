/** Date-only values stay in local calendar time; do not parse them as UTC timestamps. */
export function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d, 12);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDate(value: string): string {
  return parseDate(value)?.toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }) ?? 'Fecha no disponible';
}

export function daysBetween(from: string, to: string): number | null {
  const a = parseDate(from), b = parseDate(to);
  if (!a || !b) return null;
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  return day(b) - day(a);
}

export function calendarDays(year: number, month: number): (string | null)[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= count; day++) cells.push(dateKey(new Date(year, month, day, 12)));
  while (cells.length % 7) cells.push(null);
  return cells;
}
