// Tests real demo rules, including pending-order persistence and fractional stock.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename.endsWith('.ts') ? filename : `${filename}.ts`);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {}; cache.set(filename, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => load(name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : path.resolve(path.dirname(filename), name)) });
  return exports;
}
const demo = load(path.resolve(__dirname, '../src/utils/demo'));
const now = new Date(2026, 9, 8, 14);
const line = (productoId, tipo = 'unidad', cantidad = 1) => ({ productoId, tipo, cantidad });
test('sending an order creates no sale and changes no stock until dispatch', () => {
  const original = demo.createDemoState(now);
  const pending = demo.prepareDemoOrder(original, [line('demo-pan', 'unidad', 2), line('demo-salami', 'cuarta', 3)], now);
  assert.equal(pending.sales.length, original.sales.length);
  assert.equal(pending.products.find(p => p._id === 'demo-salami').stock, 8);
  const dispatched = demo.dispatchDemoOrder(pending, now);
  assert.equal(dispatched.pending, null);
  assert.equal(dispatched.sales.length, original.sales.length + 1);
  assert.equal(dispatched.sales[0].subtotal, 150);
  assert.equal(dispatched.products.find(p => p._id === 'demo-salami').stock, 7.25);
  assert.equal(dispatched.products.find(p => p._id === 'demo-pan').stock, 22);
  assert.equal(original.products.find(p => p._id === 'demo-pan').stock, 24);
  assert.throws(() => demo.dispatchDemoOrder(dispatched, now));
});
test('combined measures cannot oversell a shared stock balance', () => {
  const state = demo.createDemoState(now);
  assert.throws(() => demo.prepareDemoOrder(state, [line('demo-salami', 'libra', 8), line('demo-salami', 'onza')], now), /stock/);
  for (const quantity of [0, -1, 1.5, NaN]) assert.throws(() => demo.prepareDemoOrder(state, [line('demo-pan', 'unidad', quantity)], now));
  assert.throws(() => demo.prepareDemoOrder(state, [line('demo-pan', 'libra')], now));
});
test('expired lots are blocked and dispatch consumes eligible lots in FEFO order', () => {
  const state = demo.createDemoState(now);
  assert.equal(demo.demoAvailable(state.products.find(p => p._id === 'demo-yogur'), now), 0);
  assert.throws(() => demo.prepareDemoOrder(state, [line('demo-yogur')], now), /stock/);
  state.products[0] = { ...state.products[0], stock: 10, lotes: [
    { cantidadDisponible: 2, fechaVencimiento: '2026-10-07' },
    { cantidadDisponible: 5, fechaVencimiento: '2026-10-12' },
    { cantidadDisponible: 3, fechaVencimiento: '2026-10-09' },
  ] };
  const next = demo.dispatchDemoOrder(demo.prepareDemoOrder(state, [line('demo-pan', 'unidad', 4)], now), now);
  const lots = next.products[0].lotes;
  assert.equal(lots.find(l => l.fechaVencimiento === '2026-10-07').cantidadDisponible, 2);
  assert.equal(lots.find(l => l.fechaVencimiento === '2026-10-09').cantidadDisponible, 0);
  assert.equal(lots.find(l => l.fechaVencimiento === '2026-10-12').cantidadDisponible, 4);
});
test('dispatch rechecks stock and the expiration day after preparation', () => {
  const pending = demo.prepareDemoOrder(demo.createDemoState(now), [line('demo-pan', 'unidad', 2)], now);
  pending.products[0] = { ...pending.products[0], stock: 1, lotes: [{ cantidadDisponible: 1, fechaVencimiento: '2026-10-09' }] };
  assert.throws(() => demo.dispatchDemoOrder(pending, now), /stock/);
  const later = new Date(2026, 9, 10, 14);
  const fresh = demo.prepareDemoOrder(demo.createDemoState(now), [line('demo-pan')], now);
  assert.throws(() => demo.dispatchDemoOrder(fresh, later), /stock/);
});
test('reports include both boundaries and calculate consumed base stock separately from presentations', () => {
  const state = demo.dispatchDemoOrder(demo.prepareDemoOrder(demo.createDemoState(now), [line('demo-salami', 'cuarta', 2)], now), now);
  const report = demo.demoReport(state, { desde: '2026-10-08', hasta: '2026-10-08' });
  assert.equal(report.cantidadVentas, 2);
  assert.equal(report.ingresos, 130);
  assert.equal(report.ticketPromedio, 65);
  const salami = report.productosVendidos.find(p => p.productoId === 'demo-salami');
  assert.equal(salami.cantidadVendida, 2);
  assert.equal(salami.unidadesStockConsumidas, .5);
  assert.equal(demo.demoReport(state, { desde: '2026-10-09', hasta: '2026-10-09' }).ingresos, 0);
  assert.throws(() => demo.demoReport(state, { desde: '2026-10-09', hasta: '2026-10-08' }));
});
test('browser storage rejects malformed data and retains legitimate pending orders', () => {
  // Use current dates because restoration validates pending orders against today.
  const state = demo.prepareDemoOrder(demo.createDemoState(), [line('demo-salami', 'onza', 3)]);
  assert.equal(demo.restoreDemoState(JSON.stringify(state)).pending.length, 1);
  for (const raw of [null, '{broken', '{}', JSON.stringify({ ...state, products: [{ nombre: 'Broken' }] }), JSON.stringify({ ...state, sales: [null] })]) assert.equal(demo.restoreDemoState(raw), null);
  const corrupted = JSON.parse(JSON.stringify(state)); corrupted.pending[0].precio = 1;
  assert.equal(demo.restoreDemoState(JSON.stringify(corrupted)), null);
  const finished = demo.dispatchDemoOrder(state);
  assert.equal(demo.restoreDemoState(JSON.stringify(finished)).sales.length, finished.sales.length);
});
test('synthetic report exports explicitly identify fictitious data', () => {
  const reports = load(path.resolve(__dirname, '../src/utils/report-content'));
  const period = { desde: '2026-10-08', hasta: '2026-10-08' };
  assert.match(reports.reportHtml(demo.demoReport(demo.createDemoState(now), period), period, true), /DEMO · DATOS FICTICIOS/);
  assert.doesNotMatch(reports.reportHtml({}, period), /DATOS FICTICIOS/);
});
