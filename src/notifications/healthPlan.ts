import { medicationTimes } from '../features/health/model.ts';
import { localDate } from '../lib/dates.ts';
import { copy } from '../lib/copy.ts';
import type { Reminder } from './plan.ts';

const healthReminderPrefix = 'moj.health.';
const healthReminderDays = 30;
type Appointment = { id: number; petId?: number; name: string; date: string; petName: string };
type Medication = { medication: { id: number; petId?: number; name: string; dose: string; schedule: string; startDate: string; endDate: string | null }; petName: string };
export type HealthReminders = { vaccines: Appointment[]; visits: Appointment[]; medications: Medication[] };
function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return localDate(parsed);
}
function dateReminder(id: string, title: string, body: string, date: string, time: string, now: number, petId?: number): Reminder | null {
  const timestamp = new Date(`${date}T${time}:00`).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= now) return null;
  const trigger: Reminder['trigger'] = { kind: 'date', timestamp };
  return { id, title, body, trigger, petId, url: '/health', fingerprint: JSON.stringify([title, body, trigger, '/health', petId]) };
}
export function buildHealthPlan(records: HealthReminders, now = Date.now()) {
  const today = localDate(new Date(now)), horizon = addDays(today, healthReminderDays);
  let renewBy: string | null = null;
  const plan: Reminder[] = [];
  for (const [kind, rows] of [['vaccine', records.vaccines], ['visit', records.visits]] as const) {
    for (const record of rows) {
      const item = dateReminder(`${healthReminderPrefix}${kind}.${record.id}`, copy.reminders.notificationTitle(record.petName), copy.healthRecords.appointmentReminder(record.name), record.date, '09:00', now, record.petId);
      if (item) plan.push(item);
    }
  }
  for (const { medication, petName } of records.medications) {
    const times = medicationTimes(medication.schedule);
    if (!times.length) throw new Error('Invalid medication schedule');
    const title = copy.reminders.notificationTitle(petName), body = copy.healthRecords.medicationReminder(medication.name, medication.dose);
    // Unbounded active courses use OS daily repetition. Bounded/future courses use
    // date triggers so no dose can fire outside the prescribed range.
    if (!medication.endDate && medication.startDate <= today) {
      for (const time of times) {
        const [hour, minute] = time.split(':').map(Number);
        const trigger: Reminder['trigger'] = { kind: 'daily', hour, minute };
        plan.push({ id: `${healthReminderPrefix}medication.${medication.id}.${time}.daily`, title, body, trigger, petId: medication.petId, url: '/health', fingerprint: JSON.stringify([title, body, trigger, '/health', medication.petId]) });
      }
      continue;
    }
    if (!medication.endDate || medication.endDate > horizon) renewBy = horizon;
    const end = medication.endDate && medication.endDate < horizon ? medication.endDate : horizon;
    let date = medication.startDate > today ? medication.startDate : today;
    for (; date <= end; date = addDays(date, 1)) {
      for (const time of times) {
        const item = dateReminder(`${healthReminderPrefix}medication.${medication.id}.${date}.${time}`, title, body, date, time, now, medication.petId);
        if (item) plan.push(item);
      }
    }
  }
  return { plan, renewBy };
}
export function limitReminderPlan(plan: Reminder[], available: number, renewBy: string | null) {
  const sorted = plan.slice().sort((a, b) => {
    const timeA = a.trigger.kind === 'date' ? a.trigger.timestamp : 0;
    const timeB = b.trigger.kind === 'date' ? b.trigger.timestamp : 0;
    return timeA - timeB || a.id.localeCompare(b.id);
  });
  const omitted = sorted.slice(Math.max(0, available));
  const firstDate = omitted.find(item => item.trigger.kind === 'date');
  if (firstDate?.trigger.kind === 'date') {
    const date = localDate(new Date(firstDate.trigger.timestamp));
    renewBy = renewBy && renewBy < date ? renewBy : date;
  }
  return { plan: sorted.slice(0, Math.max(0, available)), renewBy, limited: omitted.length > 0 };
}
