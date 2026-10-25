import assert from 'node:assert/strict';
import { repeatDays, occursOn, validateCare } from '../src/features/care/model.ts';
import { buildCarePlan, reconcilePlan, type Scheduler, type Reminder } from '../src/notifications/plan.ts';

assert.deepEqual(repeatDays('daily'), [0, 1, 2, 3, 4, 5, 6]);
assert.deepEqual(repeatDays('weekdays'), [1, 2, 3, 4, 5]);
assert.deepEqual(repeatDays('[6,0,6]'), [0, 6]);
for (const rule of ['[]', '[7]', '["1"]', 'oops']) assert.throws(() => repeatDays(rule));
assert.equal(occursOn('weekdays', '2026-10-05'), true);
assert.equal(occursOn('weekdays', '2026-10-04'), false);
assert.equal(validateCare({ title: ' Četkanje ', type: 'other', time: '7:05', repeatRule: 'daily' }).time, '07:05');
assert.throws(() => validateCare({ title: ' ', type: 'other', time: '08:00', repeatRule: 'daily' }));
assert.throws(() => validateCare({ title: 'Nega', type: 'other', time: '24:00', repeatRule: 'daily' }));
const tasks = [{ task: { id: 1, title: 'Jutarnji obrok', time: '08:00', repeatRule: 'daily' }, petName: 'Bubi' }, { task: { id: 2, title: 'Šetnja', time: '14:00', repeatRule: '[0,6]' }, petName: 'Mica' }];
const plan = buildCarePlan(tasks);
assert.equal(plan.length, 3);
assert.deepEqual(plan.slice(1).map(item => item.trigger.kind === 'weekly' ? item.trigger.weekday : null), [1, 7]);
const pending = new Map<string, string>([['another.app', 'preserve']]);
const scheduled: string[] = [], canceled: string[] = [];
let failNext = false;
const scheduler: Scheduler = {
  list: async () => [...pending].map(([id, fingerprint]) => ({ id, fingerprint })),
  cancel: async id => { canceled.push(id); pending.delete(id); },
  schedule: async (item: Reminder) => { if (failNext) { failNext = false; throw new Error('OS scheduling failed'); } scheduled.push(item.id); pending.set(item.id, item.fingerprint); },
};
await reconcilePlan(scheduler, plan, 1000);
await reconcilePlan(scheduler, plan, 1000);
assert.equal(scheduled.length, 3, 'Repeated launch must not duplicate schedules');
pending.set('moj.care.1.snooze', '2000');
await reconcilePlan(scheduler, plan, 1000);
assert.equal(pending.has('moj.care.1.snooze'), true, 'Foreground sync must preserve a future snooze');
const edited = buildCarePlan([{ ...tasks[0], task: { ...tasks[0].task, time: '09:30' } }, tasks[1]]);
await reconcilePlan(scheduler, edited, 1000);
assert.equal(scheduled.length, 4, 'Only changed reminder reschedules');
assert.equal(canceled.includes('another.app'), false);
await reconcilePlan(scheduler, buildCarePlan([tasks[1]]), 1000);
assert.equal(pending.has('moj.care.1.snooze'), false, 'Deleted task cancels its snooze');
await reconcilePlan(scheduler, [], 1000);
assert.deepEqual([...pending.keys()], ['another.app'], 'Disable cancels only owned reminders');
failNext = true;
await assert.rejects(reconcilePlan(scheduler, plan, 1000));
await reconcilePlan(scheduler, plan, 1000);
assert.equal(pending.size, 4, 'Retry repairs partially scheduled state');
console.log('PASS: recurrence, care validation, daily/weekly plans, deduplication, edit/delete/disable, snooze persistence and scheduling retry.');
