import assert from 'node:assert/strict';
import { documentTitle, mimeForName, validateAsset, validateDataUri, maxAssetBytes, maxBackupBytes, documentKind, matchesQuery } from '../src/features/documents/model.ts';
import { backupPlan, writeBackup } from '../src/features/documents/backupModel.ts';
import { parseBackup } from '../src/features/documents/restoreModel.ts';
import type { BackupSnapshot } from '../src/db/repositories/backup.ts';

assert.equal(documentTitle('  Nalaz  '), 'Nalaz');
assert.throws(() => documentTitle(' '));
assert.throws(() => documentTitle('a'.repeat(151)));
assert.equal(mimeForName('NALAZ.PDF'), 'application/pdf');
assert.equal(mimeForName('photo.heif'), 'image/heif');
for (const size of [0, -1, NaN, Infinity, maxAssetBytes + 1]) assert.throws(() => validateAsset('image/png', size));
assert.throws(() => validateAsset('text/html', 100));
assert.deepEqual(validateDataUri('data:application/pdf;base64,YQ=='), { mime: 'application/pdf', bytes: 1 });
for (const value of ['data:image/png;base64,', 'data:image/png;base64,a', 'data:text/html;base64,YQ==', 'data:image/png;base64,a===']) assert.throws(() => validateDataUri(value));

const snapshot: BackupSnapshot = {
  pets: [{ id: 1, name: 'Test', species: 'dog', breed: '', birthDate: null, photoUri: 'file:///photo.png', createdAt: '2026-10-07T00:00:00Z' }],
  documents: [{ id: 1, petId: 1, title: 'Test slika', uri: 'file:///photo.png', createdAt: '2026-10-07T00:00:00Z' }],
  careTasks: [{ id: 1, petId: 1, type: 'meal', title: 'Obrok', time: '08:00', repeatRule: 'daily', active: true }],
  taskLogs: [{ id: 1, taskId: 1, date: '2026-10-07', doneAt: '2026-10-07T08:00:00Z' }],
  settings: [{ key: 'activePetId', value: '1' }], weights: [], vaccines: [], vetVisits: [], medications: [], moods: [], healthNotes: [],
};
let reads = 0;
const plan = await backupPlan(snapshot, async () => { reads++; return 1; });
assert.equal(reads, 1);
const head = plan.head as { formatVersion: number; databaseVersion: number; data: BackupSnapshot };
assert.equal(head.data.pets[0].photoUri, head.data.documents[0].uri);
assert.equal(head.formatVersion, 1);
assert.equal(head.databaseVersion, 3);
assert.deepEqual(head.data.taskLogs, snapshot.taskLogs);
assert.deepEqual(head.data.careTasks, snapshot.careTasks);
assert.equal(snapshot.pets[0].photoUri, 'file:///photo.png');
assert.equal(JSON.stringify(head).includes('file:///'), false);
await assert.rejects(backupPlan(snapshot, async () => { throw new Error('Missing file'); }), /Missing file/);
const large = 'data:image/png;base64,' + Buffer.alloc(maxAssetBytes).toString('base64');
assert.equal(validateDataUri(large).bytes, maxAssetBytes);
const oversized: BackupSnapshot = { ...snapshot, documents: [1, 2, 3].map(id => ({ ...snapshot.documents[0], id, uri: `file:///image${id}.png` })) };
assert.equal(maxBackupBytes, 2 * maxAssetBytes);
await assert.rejects(backupPlan(oversized, async () => maxAssetBytes));
// Streamed output: chunks join into valid JSON, one read per asset, assets in reference order.
const chunks: string[] = []; let assetReads = 0;
await writeBackup(plan, async () => { assetReads++; return { mime: 'image/png', base64: 'YQ==' }; }, chunk => { chunks.push(chunk); });
assert.equal(assetReads, 1);
const result = JSON.parse(chunks.join(''));
assert.equal(result.assets['asset:1'], 'data:image/png;base64,YQ==');
const twoAssets = await backupPlan({ ...snapshot, documents: [{ ...snapshot.documents[0], uri: 'file:///doc.pdf' }] }, async () => 1);
const parts: string[] = [];
await writeBackup(twoAssets, async uri => ({ mime: uri.endsWith('.pdf') ? 'application/pdf' : 'image/png', base64: 'YQ==' }), chunk => { parts.push(chunk); });
assert.deepEqual(Object.keys(JSON.parse(parts.join('')).assets), ['asset:1', 'asset:2']);
assert.equal(documentKind('data:application/pdf;base64,AAAA'), 'pdf');
assert.equal(documentKind('data:image/png;base64,AAAA'), 'image');
assert.equal(documentKind('file:///docs/12-nalaz.PDF'), 'pdf');
assert.equal(documentKind('file:///docs/12-rendgen.jpg'), 'image');
assert.ok(matchesQuery('Krvna slika — Đurđevdan', 'djurdj'));
assert.ok(matchesQuery('Vakcinalni pasoš', 'PASOS'));
assert.ok(!matchesQuery('Račun', 'nalaz'));
// Restore: own export parses back; malformed or tampered files are rejected before any write.
const text = JSON.stringify(result);
const parsed = parseBackup(text);
assert.equal(parseBackup(text.replace('"petwarden"', '"moj-ljubimac"')).data.pets.length, 1); // backups from the first app version
assert.equal(parsed.data.pets.length, 1);
assert.equal(parsed.assets[parsed.data.pets[0].photoUri as string], 'data:image/png;base64,YQ==');
for (const bad of ['nope', '{}', text.replace('"petwarden"', '"other"'), text.replace('"asset:1"', '"asset:9"'), text.replace('"dog"', '"dragon"'), text.replace('"formatVersion":1', '"formatVersion":2'), text.replace('data:image/png;base64,YQ==', 'data:text/html;base64,YQ==')]) assert.throws(() => parseBackup(bad), bad.slice(0, 40));
console.log('Phase 6: document validation, portable references, relational snapshot, deduplication and export limits passed.');
