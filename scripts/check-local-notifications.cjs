const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, dirname } = require('node:path');

const adapter = readFileSync('src/notifications/localNotifications.native.ts', 'utf8');
const native = readFileSync('src/notifications/platform.native.ts', 'utf8');
assert.ok(native.includes("from './localNotifications.native'"));
assert.ok(!/from ['"]expo-notifications['"]/.test(native));
const roots = [...adapter.matchAll(/from ['"](expo-notifications\/build\/[^'"]+)['"]/g)].map(match => require.resolve(match[1]));
assert.ok(roots.length >= 10, 'Local scheduling, permissions and response APIs must remain included');
const seen = new Set();
function walk(file) {
  if (seen.has(file)) return;
  seen.add(file);
  assert.ok(!/\/(?:TokenEmitter|DevicePushTokenAutoRegistration\.fx|warnOfExpoGoPushUsage|getDevicePushTokenAsync|getExpoPushTokenAsync)\./.test(file.replaceAll('\\', '/')), `Remote push side effect loaded: ${file}`);
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g)) {
    const path = resolve(dirname(file), match[1]);
    const dependency = [path + '.android.js', path + '.native.js', path + '.js'].find(existsSync);
    assert.ok(dependency, `Missing SDK dependency: ${path}`);
    walk(dependency);
  }
}
roots.forEach(walk);
console.log(`Local notifications: ${seen.size} Android SDK modules checked; remote push registration excluded.`);
