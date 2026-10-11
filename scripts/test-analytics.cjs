const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map(), storage = new Map();
let storageFailure = false;
const asyncStorage = { getItem: async key => { if (storageFailure) throw Error('Unavailable'); return storage.get(key) ?? null; }, setItem: async (key, value) => { if (storageFailure) throw Error('Unavailable'); storage.set(key, value); } };
function load(filename) {
  filename = path.resolve(filename.endsWith('.ts') ? filename : `${filename}.ts`);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {}; cache.set(filename, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => name === '@react-native-async-storage/async-storage' ? { __esModule: true, default: asyncStorage } : load(name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : path.resolve(path.dirname(filename), name)) });
  return exports;
}
const analytics = load(path.resolve(__dirname, '../src/utils/analytics'));
const categories = load(path.resolve(__dirname, '../src/utils/product-categories'));
const categoryStorage = load(path.resolve(__dirname, '../src/services/product-categories'));
const companies = load(path.resolve(__dirname, '../src/utils/companies-demo'));
const products = [{ _id: 'agua', nombre: 'Agua', stock: 12, precios: [], categoria: 'bebidas' }, { _id: 'salami', nombre: 'Salami', stock: 4, precios: [], categoria: 'embutidos' }];
const item = (id = 'agua', quantity = 2, type = 'unidad', price = 25) => ({ productoId: id, nombre: id === 'agua' ? 'Agua' : 'Salami', cantidad: quantity, tipo: type, precio: price });
const sale = (id = 's1', items = [item()], at = '2026-10-05T14:00:00Z', status = 'Despachada') => ({ _id: id, subtotal: 40, items, createdAt: at, estado: status });
const filters = overrides => ({ desde: '2026-10-05', hasta: '2026-10-12', productoId: '', categoria: 'todos', metrica: 'importe', agrupacion: 'dia', ranking: 'mas', ...overrides });
test('business timestamps use Dominican date and hour, including UTC midnight', () => {
  const time = analytics.businessTime('2026-10-06T02:30:00Z');
  assert.equal(time.day, '2026-10-05'); assert.equal(time.hour, 22); assert.equal(time.weekday, 0);
  assert.equal(analytics.businessTime('broken'), null);
  assert.equal(analytics.businessTime(null), null);
});
test('quick periods include both endpoints and span month, year and leap-day boundaries', () => {
  const period = (preset, day) => JSON.parse(JSON.stringify(analytics.analyticsPresetPeriod(preset, day)));
  assert.deepEqual(period('hoy', '2026-10-09'), { desde: '2026-10-09', hasta: '2026-10-09' });
  assert.deepEqual(period('semana', '2026-01-03'), { desde: '2025-12-28', hasta: '2026-01-03' });
  assert.deepEqual(period('ultimos30', '2024-03-01'), { desde: '2024-02-01', hasta: '2024-03-01' });
  assert.deepEqual(period('mes', '2026-10-09'), { desde: '2026-10-01', hasta: '2026-10-09' });
});
test('empty periods retain the latest completed sale for a useful recovery period', () => {
  const query = filters({ desde: '2026-10-09', hasta: '2026-10-09' });
  const result = analytics.analyzeSales([sale(), sale('pending', [item()], '2026-10-10T14:00:00Z', 'Pendiente')], products, query);
  assert.equal(result.ventasDisponibles, 0); assert.equal(result.ventasFueraPeriodo, 1); assert.equal(result.ultimaVenta, '2026-10-05');
  assert.match(analytics.analyticsEmptyMessage(result, query), /última venta registrada/);
  const recovered = analytics.analyzeSales([sale()], products, { ...query, ...analytics.analyticsPresetPeriod('ultimos30', result.ultimaVenta) });
  assert.equal(recovered.ranking[0].valor, 50);
});
test('sales without line items are distinguished from an empty sales history', () => {
  const missing = analytics.analyzeSales([{ ...sale(), items: undefined }, sale('empty', [])], products, filters());
  assert.equal(missing.ventasDisponibles, 2); assert.equal(missing.ventasSinDetalle, 2);
  assert.match(analytics.analyticsEmptyMessage(missing, filters()), /no incluyen el detalle/);
  assert.match(analytics.analyticsEmptyMessage(analytics.analyzeSales([], products, filters()), filters()), /Todavía no hay ventas realizadas/);
});
test('invalid sales dates are reported without inventing calendar dates', () => {
  const result = analytics.analyzeSales([sale('bad', [item()], 'broken'), { ...sale('null'), createdAt: null }], products, filters());
  assert.equal(result.ventasFechaInvalida, 2); assert.equal(result.ultimaVenta, null);
  assert.match(analytics.analyticsEmptyMessage(result, filters()), /fecha válida/);
});
test('category and measure mismatches do not claim that existing sales are absent', () => {
  for (const query of [filters({ categoria: 'embutidos' }), filters({ metrica: 'libras' })]) {
    const result = analytics.analyzeSales([sale()], products, query);
    assert.equal(result.ventasDisponibles, 1); assert.equal(result.ranking.length, 0);
    assert.match(analytics.analyticsEmptyMessage(result, query), /ningún producto coincide/);
  }
  const partial = analytics.analyzeSales([sale(), { ...sale('missing'), items: undefined }], products, filters());
  assert.equal(partial.ranking[0].valor, 50); assert.equal(partial.ventasSinDetalle, 1);
});
test('gross product values stay distinct from discounted sale cash totals', () => {
  const result = analytics.analyzeSales([sale()], products, filters());
  assert.equal(result.ranking[0].valor, 50); assert.equal(result.series[0].total, 50);
  assert.equal(result.ventasDisponibles, 1); assert.equal(result.series.length, 8);
});
test('pending, cancelled, returned, duplicate and out-of-period sales do not inflate ranking', () => {
  const sales = [sale(), sale(), sale('s2', [item()], undefined, 'Cancelada'), sale('s3', [item()], undefined, 'Pendiente'), sale('s4', [item()], undefined, 'Devuelta'), sale('s5', [item()], '2026-10-04T15:00:00Z')];
  assert.equal(analytics.analyzeSales(sales, products, filters()).ranking[0].valor, 50);
});
test('weekday averages account for different numbers of Mondays and Tuesdays', () => {
  const result = analytics.analyzeSales([sale()], products, filters({ agrupacion: 'diaSemana' }));
  assert.equal(result.series[0].dias, 2); assert.equal(result.series[0].valor, 25); assert.equal(result.series[1].dias, 1);
});
test('hourly patterns divide by calendar days in the selected period', () => {
  const result = analytics.analyzeSales([sale()], products, filters({ agrupacion: 'hora' }));
  assert.equal(result.series.length, 24); assert.equal(result.series[10].total, 50); assert.equal(result.series[10].valor, 6.25);
});
test('product selection filters the demand graph without losing ranking choices', () => {
  const result = analytics.analyzeSales([sale('s', [item(), item('salami', 1, 'libra', 100)])], products, filters({ productoId: 'agua' }));
  assert.equal(result.ranking.length, 2); assert.equal(result.series[0].total, 50);
  const filtered = analytics.analyzeSales([sale('s', [item(), item('salami', 1, 'libra', 100)])], products, filters({ categoria: 'embutidos' }));
  assert.equal(filtered.ranking.length, 1); assert.equal(filtered.series[0].total, 100);
});
test('quarters and ounces normalize to pounds and never mix with unit counts', () => {
  const sales = [sale('s', [item(), item('salami', 2, 'cuarta', 40), item('salami', 8, 'onza', 10)])];
  assert.equal(analytics.analyzeSales(sales, products, filters({ metrica: 'libras' })).ranking[0].valor, 1);
  const units = analytics.analyzeSales(sales, products, filters({ metrica: 'unidades' }));
  assert.equal(units.ranking.length, 1); assert.equal(units.ranking[0].valor, 2);
});
test('packages require immutable conversion data and do not guess from current prices', () => {
  const sales = [sale('s', [{ ...item('agua', 2, 'paquete'), equivalencia: 6 }, { ...item('agua', 1, 'paquete'), unidadesStockConsumidas: 3 }, item('agua', 1, 'paquete')])];
  const result = analytics.analyzeSales(sales, products, filters({ metrica: 'unidades' }));
  assert.equal(result.ranking[0].valor, 15); assert.equal(result.lineasOmitidas, 1);
});
test('malformed lines are excluded rather than rendered as NaN', () => {
  const result = analytics.analyzeSales([sale('s', [item(), item('agua', NaN), item('agua', -1), item('agua', 1, 'unidad', Infinity), item('agua', 1e308, 'unidad', 1e308)])], products, filters());
  assert.equal(result.ranking[0].valor, 50); assert.equal(result.lineasOmitidas, 4);
});
test('invalid periods are rejected and long periods can recover by grouping', () => {
  assert.ok(analytics.analyzeSales([], [], filters({ desde: '2026-02-30' })).error);
  assert.ok(analytics.analyzeSales([], [], filters({ desde: '2027-10-13' })).error);
  assert.ok(analytics.analyzeSales([], [], filters({ desde: '2025-01-01', hasta: '2026-10-12' })).error);
  assert.equal(analytics.analyzeSales([], [], filters({ desde: '2025-01-01', hasta: '2026-10-12', agrupacion: 'hora' })).error, null);
});
test('least-selling ranking includes only known sales, not fabricated zero rows', () => {
  const result = analytics.analyzeSales([sale()], products, filters({ ranking: 'menos' }));
  assert.equal(result.ranking.length, 1); assert.equal(result.ranking[0].id, 'agua');
});
test('manual categories win and legacy suggestions recognize accents and common plural names', () => {
  assert.equal(categories.productCategory({ nombre: 'Pan de agua' }), 'panaderia');
  assert.equal(categories.productCategory({ nombre: 'Agua', categoria: 'otros' }), 'otros');
  assert.equal(categories.productCategory({ nombre: 'Habichuelas rojas' }), 'viveres');
  assert.equal(categories.productCategory({ nombre: 'Plátanos' }), 'viveres');
  assert.equal(categories.filterProducts([{ ...products[0], nombre: 'Café Santo Domingo', categoria: 'viveres' }], 'viveres', 'CAFE').length, 1);
  assert.equal(categories.filterProducts(products, 'embutidos', 'agua').length, 0);
});
test('category cache keeps account choices separate and serializes independent saves', async () => {
  storage.set('surtio.user', JSON.stringify({ phone: '8090000001' }));
  await Promise.all([categoryStorage.saveProductCategory('agua', 'otros'), categoryStorage.saveProductCategory('salami', 'viveres')]);
  const own = await categoryStorage.applyStoredCategories(products);
  assert.equal(own[0].categoria, 'otros'); assert.equal(own[1].categoria, 'viveres');
  storage.set('surtio.user', JSON.stringify({ phone: '8090000002' }));
  assert.equal((await categoryStorage.applyStoredCategories(products))[0].categoria, 'bebidas');
});
test('unavailable category storage does not prevent inventory loading', async () => {
  storageFailure = true;
  try { assert.equal((await categoryStorage.applyStoredCategories(products))[0], products[0]); await assert.rejects(categoryStorage.saveProductCategory('agua', 'otros')); }
  finally { storageFailure = false; }
});
const stores = companies.createDemoStores(new Date('2026-10-09T16:00:00Z'));
const campaign = overrides => ({ id: 'c1', titulo: 'Producto de prueba', patrocinador: 'Empresa Demo', descripcion: 'Descripción', productoId: stores[0].products[0]._id, zona: 'todas', categoriaAudiencia: 'todos', desde: '2026-10-09', hasta: '2026-10-10', estado: 'borrador', ...overrides });
test('commercial demo provides distinct sales and explicit purpose permissions', () => {
  assert.equal(stores.length, 5); assert.equal(stores.filter(s => s.estadisticasAutorizadas).length, 4);
  assert.equal(new Set(stores.flatMap(s => s.sales.map(v => v._id))).size, 225);
});
test('campaign audience respects promotion permission, zone and category', () => {
  assert.equal(companies.eligibleStores(stores, campaign()).length, 3);
  assert.equal(companies.eligibleStores(stores, campaign({ zona: 'Santo Domingo Norte' })).length, 0);
  assert.equal(companies.eligibleStores(stores, campaign({ zona: 'Santiago' })).length, 1);
  assert.equal(companies.eligibleStores(stores, campaign({ categoriaAudiencia: 'limpieza' })).length, 0);
});
test('campaign lifecycle distinguishes draft, scheduled, active, paused and ended', () => {
  assert.equal(companies.campaignStatus(campaign(), '2026-10-09'), 'Borrador');
  assert.equal(companies.campaignStatus(campaign({ estado: 'activa' }), '2026-10-08'), 'Programada');
  assert.equal(companies.campaignStatus(campaign({ estado: 'activa' }), '2026-10-09'), 'Activa');
  assert.equal(companies.campaignStatus(campaign({ estado: 'pausada' }), '2026-10-09'), 'Pausada');
  assert.equal(companies.campaignStatus(campaign({ estado: 'activa' }), '2026-10-11'), 'Finalizada');
});
test('campaign validation checks required fields, dates, product and audience', () => {
  assert.equal(companies.validateCampaign(campaign(), stores), null);
  for (const patch of [{ titulo: ' ' }, { hasta: '2026-01-01' }, { desde: '2026-02-30' }, { productoId: 'unknown' }, { zona: 'unknown' }, { categoriaAudiencia: 'unknown' }]) assert.ok(companies.validateCampaign(campaign(patch), stores));
});
test('campaign restoration validates persisted records and deduplicates interests', () => {
  const raw = { version: 1, campaigns: [campaign()], interests: ['c1', 'c1'] };
  assert.equal(companies.restoreCompaniesDemo(JSON.stringify(raw), stores).interests.length, 1);
  assert.equal(companies.restoreCompaniesDemo(JSON.stringify({ ...raw, interests: ['unknown'] }), stores), null);
  assert.equal(companies.restoreCompaniesDemo(JSON.stringify({ ...raw, campaigns: [campaign(), campaign()] }), stores), null);
  assert.equal(companies.restoreCompaniesDemo('{broken', stores), null);
});
