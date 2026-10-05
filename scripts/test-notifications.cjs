// Isolated checks: no network requests, no real push registrations or device notifications.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const src = path.resolve(__dirname, '../src');
const keys = { preferences: 'surtio.notifications', ledger: 'surtio.notifications.days', revocations: 'surtio.notifications.revocations' };
function environment(mocks = {}, globals = {}) {
  const cache = new Map();
  function load(name, parent = path.join(src, '_')) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    let file = name.startsWith('@/') ? path.join(src, name.slice(2)) : path.resolve(path.dirname(parent), name);
    if (!/\.tsx?$/.test(file)) file += '.ts';
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, { exports, require: value => load(value, file), Date, URL, AbortController, setTimeout, clearTimeout, process: { env: {} }, ...globals }, { filename: file });
    return exports;
  }
  return load;
}
function storage() {
  const data = new Map([['token','session-a']]);
  return { data, getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); }, removeItem: async key => { data.delete(key); } };
}
const products = [{ _id: 'p', nombre: 'Salami', stock: 5, lotes: [{ _id: 'l', fechaVencimiento: '2026-10-05', cantidadDisponible: 5 }] }];
function device() {
  const calls = [];
  return { calls, remoteCapability: () => ({ available: false, reason: 'Expo Go' }), requestLocalPermission: async () => calls.push('permission'), syncLocalNotifications: async () => calls.push('sync'), clearDeviceNotifications: async () => calls.push('clear'), releasePushDevice: async () => calls.push('release'), createPushPayload: async () => ({ kind: 'expo', token: 'fake', platform: 'ios' }) };
}
test('local opt-in persists, survives reload and cancels when the account changes', async () => {
  const store = storage(), api = device();
  const load = environment({ '@react-native-async-storage/async-storage': store, './notification-device': api, './lists': { fetchList: async () => products } });
  const service = load('@/services/notifications');
  assert.equal((await service.enableLocalNotifications()).mode, 'local');
  assert.equal((await service.restoreNotifications()).mode, 'local');
  store.data.set('token','session-b');
  assert.equal((await service.restoreNotifications()).mode, 'off');
  assert.ok(api.calls.includes('clear'));
});
test('a failed scheduling attempt rolls back partial notices and never claims activation', async () => {
  const store = storage(), api = device();
  api.syncLocalNotifications = async () => { throw new Error('OS quota'); };
  const service = environment({ '@react-native-async-storage/async-storage': store, './notification-device': api, './lists': { fetchList: async () => products } })('@/services/notifications');
  await assert.rejects(service.enableLocalNotifications(), /OS quota/);
  assert.equal((await service.restoreNotifications()).mode, 'off');
  assert.ok(api.calls.includes('clear'));
});
test('permission rejection and Expo Go do not perform subscription requests', async () => {
  const store = storage(), api = device(); let requests = 0;
  api.requestLocalPermission = async () => { throw new Error('denied'); };
  const service = environment({ '@react-native-async-storage/async-storage': store, './notification-device': api, './lists': { fetchList: async () => { requests++; return products; } } }, { fetch: async () => { requests++; } })('@/services/notifications');
  await assert.rejects(service.enableLocalNotifications(), /denied/);
  await assert.rejects(service.enablePushNotifications(), /Expo Go/);
  assert.equal(requests, 0);
});
test('push is activated only after server confirmation, and logout queues revocation without retaining JWT', async () => {
  const store = storage(), api = device();
  api.remoteCapability = () => ({ available: true });
  const registration = { id: 'device-a', revokeToken: 'r'.repeat(43) };
  const load = environment({ '@react-native-async-storage/async-storage': store, './notification-device': api }, {
    process: { env: { EXPO_PUBLIC_NOTIFICATIONS_URL: 'https://example.test/api/notifications' } },
    fetch: async (url, options) => {
      if (options.method === 'DELETE') throw new Error('offline');
      assert.equal(options.headers.Authorization, 'Bearer session-a');
      return { ok: true, status: 200, json: async () => url.endsWith('/config') ? { expoEnabled: true, webEnabled: false } : registration };
    },
  });
  const service = load('@/services/notifications');
  assert.equal((await service.enablePushNotifications()).mode, 'push');
  await service.disableNotifications();
  store.data.delete('token');
  const queue = JSON.parse(store.data.get(keys.revocations));
  assert.equal(queue[0].id, registration.id);
  assert.ok(!store.data.get(keys.revocations).includes('session-a'));
  assert.equal((await service.restoreNotifications()).mode, 'off');
});
test('revocations retain a concurrently queued account and retry without Authorization', async () => {
  const store = storage(); let release, started;
  const pending = new Promise(resolve => { started = resolve; });
  const load = environment({ '@react-native-async-storage/async-storage': store }, {
    process: { env: { EXPO_PUBLIC_NOTIFICATIONS_URL: 'https://example.test/api/notifications' } },
    fetch: async (_url, options) => {
      assert.equal(options.headers.Authorization, undefined);
      started(); await new Promise(resolve => { release = resolve; });
      return { ok: true, status: 204 };
    },
  });
  const api = load('@/services/notification-api');
  await api.queuePushRevocation({ id: 'a', revokeToken: 'a'.repeat(43) });
  const flushing = api.flushPushRevocations(); await pending;
  await api.queuePushRevocation({ id: 'b', revokeToken: 'b'.repeat(43) });
  release(); await flushing;
  assert.deepEqual(JSON.parse(store.data.get(keys.revocations)).map(item => item.id), ['b']);
});
function nativeEnvironment() {
  const store = storage(), scheduled = new Map(), sent = [], cancelled = [], dismissed = [];
  const api = {
    setNotificationHandler: () => {}, getPermissionsAsync: async () => ({ granted: true }),
    IosAuthorizationStatus: { PROVISIONAL: 3 }, SchedulableTriggerInputTypes: { DATE: 'date' },
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
    scheduleNotificationAsync: async notification => { sent.push(notification); if (notification.trigger.type === 'date') scheduled.set(notification.identifier, notification); return notification.identifier; },
    cancelScheduledNotificationAsync: async id => { cancelled.push(id); scheduled.delete(id); },
    getPresentedNotificationsAsync: async () => [ { request: { identifier: 'ours', content: { data: { scope: 'surtio-expiry' } } } }, { request: { identifier: 'other', content: { data: { scope: 'another-app' } } } } ],
    dismissNotificationAsync: async id => dismissed.push(id),
  };
  const load = environment({ '@react-native-async-storage/async-storage': store, 'react-native': { Platform: { OS: 'ios' } }, 'expo-constants': { ExecutionEnvironment: { StoreClient: 'store' }, executionEnvironment: 'store' }, 'expo-notifications': api });
  return { store, scheduled, sent, cancelled, dismissed, api: load('@/services/notification-device.native') };
}
test('native scheduling deduplicates reloads, adapts stock and leaves other apps notices alone', async () => {
  const fixture = nativeEnvironment(), morning = new Date(2026, 9, 4, 8);
  fixture.scheduled.set('other', { identifier: 'other', content: { data: { scope: 'other' } } });
  await fixture.api.syncLocalNotifications(products, 'owner', morning);
  assert.equal(fixture.sent.length, 30);
  await fixture.api.syncLocalNotifications(products, 'owner', morning);
  assert.equal(fixture.sent.length, 30);
  await fixture.api.syncLocalNotifications([], 'owner', morning);
  assert.equal(fixture.cancelled.length, 30);
  assert.ok(fixture.scheduled.has('other'));
  await fixture.api.clearDeviceNotifications();
  assert.deepEqual(fixture.dismissed, ['ours']);
  assert.ok(fixture.scheduled.has('other'));
});
test('native same-day delivery remains deduplicated after a temporarily empty inventory', async () => {
  const fixture = nativeEnvironment(), evening = new Date(2026, 9, 4, 20);
  fixture.store.data.set(keys.ledger, 'null');
  await fixture.api.syncLocalNotifications(products, 'owner', evening);
  const immediate = () => fixture.sent.filter(item => item.trigger.type !== 'date').length;
  assert.equal(immediate(), 1);
  await fixture.api.syncLocalNotifications([], 'owner', evening);
  await fixture.api.syncLocalNotifications(products, 'owner', evening);
  assert.equal(immediate(), 1);
  assert.equal(fixture.api.remoteCapability().available, false);
});
test('Web notices deduplicate a day and keep subscription errors visible', async () => {
  const store = storage(), shown = [], key = new Uint8Array(65); key[0] = 4;
  const registration = { active: { scriptURL: 'https://example.test/surtio-notifications-sw.js' }, showNotification: async (...args) => shown.push(args), pushManager: { getSubscription: async () => null, subscribe: async () => { throw new Error('push service offline'); } } };
  const web = environment({ '@react-native-async-storage/async-storage': store }, {
    window: { isSecureContext: true, Notification: {}, PushManager: {} }, navigator: { serviceWorker: { register: async () => registration } },
    Notification: { permission: 'granted' }, atob: value => Buffer.from(value, 'base64').toString('binary'),
  })('@/services/notification-device.web');
  await web.syncLocalNotifications(products, 'owner', new Date(2026,9,4,20));
  await web.syncLocalNotifications(products, 'owner', new Date(2026,9,4,20));
  assert.equal(shown.length, 1);
  await assert.rejects(web.createPushPayload({ webEnabled: true, expoEnabled: false, vapidPublicKey: Buffer.from(key).toString('base64url') }), /push service offline/);
});
test('notification worker handles malformed messages and opens only the same-origin app', async () => {
  const handlers = {}, shown = [], opened = [], origin = 'https://surtio.test';
  const self = { addEventListener: (name, callback) => { handlers[name] = callback; }, location: { origin }, registration: { showNotification: async (...args) => shown.push(args) }, clients: { matchAll: async () => [], openWindow: async url => opened.push(url) } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../public/surtio-notifications-sw.js'), 'utf8'), { self, URL });
  let completion;
  const event = data => ({ data: { json: () => data }, waitUntil: value => { completion = value; } });
  for (const payload of [null, [], 'bad', { title: 'Notice', body: 'Expiry', url: 'https://evil.test' }]) { handlers.push(event(payload)); await completion; }
  assert.equal(shown.length, 4);
  assert.ok(shown.every(item => item[1].data.scope === 'surtio-expiry'));
  handlers.notificationclick({ notification: { data: { scope: 'surtio-expiry' }, close: () => {} }, waitUntil: value => { completion = value; } });
  await completion;
  assert.deepEqual(opened, [`${origin}/?notification=expiry`]);
});
