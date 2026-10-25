const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'moj-photo-transition-'));
try {
  for (const name of ['photoGeometry', 'photoTransition']) {
    const source = fs.readFileSync(path.join(__dirname, '../src/features/pets', name + '.ts'), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replace('require("zustand")', 'require(' + JSON.stringify(require.resolve('zustand')) + ')');
    fs.writeFileSync(path.join(temp, name + '.js'), code);
  }
  const store = require(path.join(temp, 'photoTransition.js')).usePhotoTransition;
  const frame = { x: 10, y: 20, width: 112, height: 112 };
  store.getState().begin(1, 'local-photo-one', frame);
  const oldKey = store.getState().pending.key;
  store.getState().begin(2, 'local-photo-two', frame);
  const key = store.getState().pending.key;
  store.getState().finish(oldKey);
  store.getState().target(oldKey, frame);
  assert.equal(store.getState().pending.petId, 2);
  assert.equal(store.getState().pending.to, null);
  store.getState().target(key, { ...frame, width: 0 });
  assert.equal(store.getState().pending.to, null);
  store.getState().target(key, { ...frame, x: 100 });
  store.getState().target(key, { ...frame, x: 200 });
  assert.equal(store.getState().pending.to.x, 100);
  store.getState().finish(key);
  assert.equal(store.getState().pending, null);
  store.getState().begin(3, 'invalid', { ...frame, height: 0 });
  assert.equal(store.getState().pending, null);
  console.log('Photo transition: stale callbacks, invalid geometry, one target and completion guards passed.');
} finally {
  for (const name of ['photoGeometry.js', 'photoTransition.js']) { const file = path.join(temp, name); if (fs.existsSync(file)) fs.unlinkSync(file); }
  fs.rmdirSync(temp);
}
