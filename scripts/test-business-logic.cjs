// Run with: node scripts/test-business-logic.cjs (uses the project's existing TypeScript).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
function load(name) {
  const filename = path.resolve(__dirname, '../src/utils', `${name}.ts`);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: value => load(path.basename(value)) });
  cache.set(filename, exports);
  return exports;
}
const dates = load('dates'), history = load('history'), expiry = load('expiry'), reports = load('report-content');
const notifications = load('notification-plan');
const filters = changes => ({ ...history.INITIAL_FILTERS, ...changes });
const sales = [
  { _id: 'old', numeroOrden: 101, subtotal: 100, createdAt: '2026-09-30T12:00:00', items: [{ nombre: 'Café', cantidad: 1 }] },
  { _id: 'new', numeroOrden: 104, subtotal: 600, createdAt: '2026-10-04T18:00:00', items: [{ nombre: 'Salami', cantidad: 2 }] },
  { _id: 'morning', numeroOrden: 103, subtotal: 500, createdAt: '2026-10-04T09:00:00', items: [{ nombre: 'Café', cantidad: 1 }] },
];
const now = new Date(2026, 9, 4, 20);
test('strict dates reject impossible days and retain leap days', () => {
  assert.equal(dates.parseDate('2026-02-29'), null);
  assert.equal(dates.parseDate('2026-13-01'), null);
  assert.equal(dates.parseDate('04/10/2026'), null);
  assert.equal(dates.dateKey(dates.parseDate('2028-02-29')), '2028-02-29');
});
test('calendar starts Monday, includes every day and ends on a complete week', () => {
  const grid = dates.calendarDays(2028, 1);
  assert.equal(grid.length % 7, 0);
  assert.equal(grid.filter(Boolean).length, 29);
  assert.equal(grid[1], '2028-02-01');
  assert.equal(grid.filter(Boolean).at(-1), '2028-02-29');
});
test('day differences are independent of DST and month/year boundaries', () => {
  assert.equal(dates.daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.equal(dates.daysBetween('2026-03-07', '2026-03-09'), 2);
  assert.equal(dates.daysBetween('2026-10-04', '2026-10-03'), -1);
  assert.equal(dates.daysBetween('bad', '2026-10-03'), null);
});
test('recent activity sorts unsorted sales without mutating source', () => {
  assert.equal(history.newestSales(sales)[0]._id, 'new');
  assert.equal(sales[0]._id, 'old');
});
test('today includes morning and evening, week starts Monday, month excludes September', () => {
  assert.equal(history.filterSales(sales, filters({ periodo: 'dia' }), now).length, 2);
  assert.equal(history.historyQuery(filters({ periodo: 'semana' }), now).desde, '2026-09-28');
  assert.equal(history.filterSales(sales, filters({ periodo: 'mes' }), now).length, 2);
});
test('product and amount filters combine, ignore accents, and include boundary amounts', () => {
  const result = history.filterSales(sales, filters({ producto: 'cafe', montoMin: '500,00', montoMax: '500' }), now);
  assert.equal(result.length, 1);
  assert.equal(result[0]._id, 'morning');
  assert.equal(history.filterSales(sales, filters({ orden: '104' }), now)[0]._id, 'new');
});
test('invalid amounts do not silently become an unrestricted query', () => {
  assert.ok(history.amountError(filters({ montoMin: 'abc' })));
  assert.ok(history.amountError(filters({ montoMin: '501', montoMax: '500' })));
  assert.ok(history.amountError(filters({ montoMax: '-1' })));
  assert.equal(history.amountError(filters({ montoMin: '0', montoMax: '0' })), null);
});
test('expiry payload relates the entire initial quantity to one date', () => {
  assert.equal(expiry.initialLots(false, '', 0), undefined);
  assert.equal(expiry.initialLots(true, '2026-10-10', 1.5)[0].cantidad, 1.5);
  assert.throws(() => expiry.initialLots(true, '', 2));
  assert.throws(() => expiry.initialLots(true, '2026-10-10', 0));
});
test('expiry states respect today/tomorrow/seven-day boundary and exclude depleted/invalid lots', () => {
  const products = [{ _id: 'p', nombre: 'Salami', stock: 12, unidadStock: 'libra', lotes: [
    { fechaVencimiento: '2026-10-03', cantidadDisponible: 1 },
    { fechaVencimiento: '2026-10-04', cantidadDisponible: 1 },
    { fechaVencimiento: '2026-10-05', cantidadDisponible: 1 },
    { fechaVencimiento: '2026-10-11', cantidadDisponible: 1 },
    { fechaVencimiento: '2026-10-12', cantidadDisponible: 1 },
    { fechaVencimiento: '2026-10-01', cantidadDisponible: 0 },
    { fechaVencimiento: 'bad', cantidadDisponible: 5 },
  ] }];
  const result = expiry.expiryAlerts(products, now);
  assert.equal(result.length, 5);
  assert.equal(result[0].estado, 'vencido');
  assert.equal(result[1].diasRestantes, 0);
  assert.equal(result[3].estado, 'pronto');
  assert.equal(result[4].estado, 'vigente');
  assert.equal(expiry.expiryLabel(1), 'Vence mañana');
});
test('products without API expiry metadata never generate artificial alerts', () => {
  assert.equal(expiry.expiryAlerts([{ _id: 'p', nombre: 'Agua', stock: 20 }], now).length, 0);
  assert.equal(expiry.expiryAlerts([{ _id: 'p', nombre: 'Agua', stock: 20, lotes: {} }], now).length, 0);
});
test('report content escapes product HTML, preserves zeros, and distinguishes absent data', () => {
  const html = reports.reportHtml({ ingresos: 0, productosVendidos: [{ nombre: '<script>alert(1)</script>', cantidadVendida: 1 }] }, { desde: '2026-10-04', hasta: '2026-10-04' });
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('No disponible'));
  assert.ok(html.includes('RD$ 0.00'));
});
test('notification summaries use only confirmed, available lots and never expose product names', () => {
  const products = [{ _id: 'p', nombre: 'Privado', lotes: [{ _id: 'l', cantidadDisponible: 2, fechaVencimiento: '2026-10-05' }] }];
  const plan = notifications.notificationPlan(products, 'owner', now);
  assert.equal(plan.length, 30);
  assert.equal(plan[0].at, null);
  assert.equal(plan[0].date, '2026-10-04');
  assert.ok(plan[0].body.includes('1 lote por vencer'));
  assert.ok(!plan[0].body.includes('Privado'));
  assert.equal(new Date(plan[1].at).getHours(), 9);
  assert.equal(notifications.notificationPlan([{ _id: 'p', stock: 20 }], 'owner', now).length, 0);
  products[0].lotes[0].cantidadDisponible = 0;
  assert.equal(notifications.notificationPlan(products, 'owner', now).length, 0);
});
test('notification timing follows calendar days and signatures ignore product response ordering', () => {
  const morning = new Date(2026, 11, 31, 8);
  const products = ['a','b'].map(_id => ({ _id, nombre: _id, lotes: [{ _id: 'l', cantidadDisponible: 1, fechaVencimiento: '2027-01-01' }] }));
  const plan = notifications.notificationPlan(products, 'owner', morning);
  assert.equal(new Date(plan[0].at).getHours(), 9);
  assert.equal(plan[1].date, '2027-01-01');
  assert.equal(plan[0].signature, notifications.notificationPlan([...products].reverse(), 'owner', morning)[0].signature);
  assert.equal(products[0]._id, 'a');
  assert.equal(notifications.notificationOwner('token-a'), notifications.notificationOwner('token-a'));
  assert.notEqual(notifications.notificationOwner('token-a'), notifications.notificationOwner('token-b'));
});
test('invalid notification ledgers are safely rebuilt', () => {
  for (const raw of ['null','[]','123','bad']) assert.equal(Object.keys(notifications.readNotificationLedger(raw)).length, 0);
  assert.equal(notifications.readNotificationLedger('{"ok":"signature","bad":null}').ok, 'signature');
  assert.equal(Object.keys(notifications.readNotificationLedger('{"ok":"signature","bad":null}')).length, 1);
});
