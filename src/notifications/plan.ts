import { repeatDays } from '../features/care/model.ts';
import { copy } from '../lib/copy.ts';

export const reminderPrefix = 'moj.care.';
export function isOwnReminder(id: string) { return id.startsWith(reminderPrefix) || id.startsWith('moj.health.'); }
export type ReminderTask = { task: { id: number; petId?: number; title: string; time: string; repeatRule: string }; petName: string };
export type Reminder = { id: string; title: string; body: string; fingerprint: string; petId?: number; url?: '/' | '/health'; trigger: { kind: 'daily'; hour: number; minute: number } | { kind: 'weekly'; hour: number; minute: number; weekday: number } | { kind: 'date'; timestamp: number } };
export type PendingReminder = { id: string; fingerprint: string | null };
export type Scheduler = { list: () => Promise<PendingReminder[]>; cancel: (id: string) => Promise<void>; schedule: (reminder: Reminder) => Promise<void> };
export function buildCarePlan(tasks: ReminderTask[]): Reminder[] {
  return tasks.flatMap(({ task, petName }) => {
    const [hour, minute] = task.time.split(':').map(Number);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error('Neispravno vreme podsetnika.');
    const days = repeatDays(task.repeatRule);
    const triggers: Reminder['trigger'][] = days.length === 7 ? [{ kind: 'daily', hour, minute }] : days.map(day => ({ kind: 'weekly', hour, minute, weekday: day + 1 }));
    return triggers.map(trigger => {
      const id = `${reminderPrefix}${task.id}.${trigger.kind === 'weekly' ? trigger.weekday : 'daily'}`;
      const title = copy.reminders.notificationTitle(petName), body = copy.reminders.notificationBody(task.title, task.time);
      return { id, title, body, trigger, petId: task.petId, fingerprint: JSON.stringify([title, body, trigger, task.petId]) };
    });
  });
}
// Reconcile only our own reminders; repeated launches don't multiply schedules.
export async function reconcilePlan(scheduler: Scheduler, plan: Reminder[], now = Date.now()) {
  const pending = await scheduler.list();
  const desired = new Map(plan.map(item => [item.id, item]));
  for (const item of pending) {
    if (!isOwnReminder(item.id)) continue;
    if (item.id.endsWith('.snooze') && Number(item.fingerprint) > now && plan.some(target => target.id.startsWith(item.id.slice(0, -'snooze'.length)))) continue;
    const target = desired.get(item.id);
    if (!target || target.fingerprint !== item.fingerprint) await scheduler.cancel(item.id);
    else desired.delete(item.id);
  }
  for (const item of desired.values()) await scheduler.schedule(item);
}
