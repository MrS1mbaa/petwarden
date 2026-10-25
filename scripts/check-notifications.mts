import assert from 'node:assert/strict';
import { notificationTarget } from '../src/notifications/open.ts';
import { buildCarePlan, reconcilePlan, type Scheduler } from '../src/notifications/plan.ts';
import { buildHealthPlan } from '../src/notifications/healthPlan.ts';
import { moodAtPoint } from '../src/features/care/moodHit.ts';
import { validPhotoFrame, localPhotoFrame, interpolatePhotoFrame } from '../src/features/pets/photoGeometry.ts';
import { rollingColumns } from '../src/lib/rollingDigits.ts';

for (const [from, to, paddedFrom, paddedTo] of [['9,9', '10,1', ' 9,9', '10,1'], ['12,4', '12,45', '12,4 ', '12,45'], ['500', '1', '500', '  1'], ['0,001', '0,01', '0,001', '0,01 '], ['0', '0', '0', '0'], ['9.9', '10.1', ' 9.9', '10.1'], ['12', '12.5', '12  ', '12.5']]) {
  const columns = rollingColumns(from, to);
  assert.equal(columns.map(column => column.from).join(''), paddedFrom);
  assert.equal(columns.map(column => column.to).join(''), paddedTo);
}

const sourcePhoto = { x: 150, y: 80, width: 112, height: 112 }, targetPhoto = { x: 24, y: 100, width: 116, height: 116 };
assert.ok(validPhotoFrame(sourcePhoto));
for (const invalid of [{ ...sourcePhoto, width: 0 }, { ...sourcePhoto, height: -1 }, { ...sourcePhoto, x: NaN }]) assert.equal(validPhotoFrame(invalid), false);
assert.deepEqual(localPhotoFrame(sourcePhoto, { x: 10, y: 20 }), { x: 140, y: 60, width: 112, height: 112 });
assert.deepEqual(interpolatePhotoFrame(sourcePhoto, targetPhoto, 0), sourcePhoto);
assert.deepEqual(interpolatePhotoFrame(sourcePhoto, targetPhoto, 1), targetPhoto);
assert.deepEqual(interpolatePhotoFrame(sourcePhoto, targetPhoto, 0.5), { x: 87, y: 90, width: 114, height: 114 });

const moodBounds = [{ x: 0, y: 0, width: 88, height: 80 }, { x: 100, y: 0, width: 88, height: 80 }, null, { x: 0, y: 92, width: 88, height: 80 }];
assert.equal(moodAtPoint(moodBounds, 40, 40), 0);
assert.equal(moodAtPoint(moodBounds, 100, 40), 1);
assert.equal(moodAtPoint(moodBounds, 40, 100), 3);
for (const [x, y] of [[88, 40], [40, 80], [-1, 0], [40, 200]]) assert.equal(moodAtPoint(moodBounds, x, y), -1);

assert.deepEqual(notificationTarget({ app: 'petwarden', petId: 2, url: '/health' }), { petId: 2, url: '/health' });
assert.deepEqual(notificationTarget({ app: 'petwarden', url: 'https://example.com' }), { url: '/' });
assert.equal(notificationTarget({ app: 'foreign', petId: 2 }), null);
for (const petId of [0, -1, 1.5, '2', NaN, Number.MAX_SAFE_INTEGER + 1]) assert.equal(notificationTarget({ app: 'petwarden', petId }), null);
assert.equal(notificationTarget(null), null);
const row = { task: { id: 1, petId: 2, title: 'Obrok', time: '08:00', repeatRule: 'daily' }, petName: 'Luna' };
const plan = buildCarePlan([row]);
assert.equal(plan[0].petId, 2);
const legacy = buildCarePlan([{ ...row, task: { ...row.task, petId: undefined } }]);
const operations: string[] = [];
const scheduler: Scheduler = { list: async () => [{ id: legacy[0].id, fingerprint: legacy[0].fingerprint }], cancel: async id => { operations.push(`cancel:${id}`); }, schedule: async item => { operations.push(`schedule:${item.petId}`); } };
await reconcilePlan(scheduler, plan);
assert.deepEqual(operations, ['cancel:moj.care.1.daily', 'schedule:2']);
const health = buildHealthPlan({ vaccines: [{ id: 1, petId: 2, petName: 'Luna', name: 'Test vakcina', date: '2026-10-08' }], visits: [{ id: 1, petId: 1, petName: 'Bubi', name: 'Test kontrola', date: '2026-10-09' }], medications: [{ petName: 'Luna', medication: { id: 1, petId: 2, name: 'Test terapija', dose: 'Test uputstvo', schedule: '{"times":["08:00"],"repeatRule":"daily"}', startDate: '2026-10-07', endDate: null } }] }, new Date('2026-10-07T12:00:00').getTime());
assert.equal(health.plan.find(item => item.id.includes('visit'))?.petId, 1);
assert.ok(health.plan.filter(item => !item.id.includes('visit')).every(item => item.petId === 2));
assert.ok(health.plan.every(item => item.url === '/health'));
console.log('Phase 7: safe notification targets, per-pet care/health metadata and legacy rescheduling passed.');
