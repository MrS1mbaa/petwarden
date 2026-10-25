import { copy, locale } from '../../lib/copy.ts';
import { localDate } from '../../lib/dates.ts';
import { medicationTimes, dateInput } from '../health/model.ts';
import type { HealthCommand } from '../health/useHealth';
import type { TodayTask } from '../../db/repositories/care';
import type { Vaccine } from '../../db/repositories/vaccines';
import type { VetVisit } from '../../db/repositories/vetVisits';
import type { Medication } from '../../db/repositories/medications';
import type { Accent } from '../../theme/theme';
import { repeatDays, type TaskType } from '../care/model.ts';

export function calendarDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(date.getTime()) || localDate(date) !== iso) throw new Error(copy.plannerCare.invalidDate);
  return date;
}
export function shiftDate(iso: string, days: number) {
  const date = calendarDate(iso);
  date.setDate(date.getDate() + days);
  return localDate(date);
}
export function weekFor(iso: string) {
  const start = shiftDate(iso, -((calendarDate(iso).getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
}
export function canCheckDate(date: string, today = localDate()) {
  calendarDate(date);
  return date <= today;
}
export function dayLabel(date: string) {
  return new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(calendarDate(date));
}
export type CalendarCommand = Extract<HealthCommand, { kind: 'vaccine' | 'visit' | 'medication' }>;
export type HealthEvent = { kind: 'health'; key: string; type: 'vaccine' | 'visit' | 'medication'; title: string; detail: string; time: string | null; command: CalendarCommand };
export type PlannerRow = { kind: 'care'; key: string; task: TodayTask } | HealthEvent;
export function dayEntries(date: string, tasks: TodayTask[], vaccines: Vaccine[], visits: VetVisit[], medications: Medication[]): PlannerRow[] {
  calendarDate(date);
  const rows: PlannerRow[] = tasks.map(task => ({ kind: 'care', key: `care.${task.id}`, task }));
  for (const record of vaccines) if (record.nextDueAt === date) rows.push({ kind: 'health', key: `vaccine.${record.id}`, type: 'vaccine', title: record.name, detail: record.notes, time: null, command: { kind: 'vaccine', id: record.id, draft: { name: record.name, givenAt: dateInput(record.givenAt), nextDueAt: dateInput(record.nextDueAt), notes: record.notes } } });
  for (const record of visits) if (record.date === date) rows.push({ kind: 'health', key: `visit.${record.id}`, type: 'visit', title: record.reason, detail: record.clinic, time: null, command: { kind: 'visit', id: record.id, draft: { date: dateInput(record.date), clinic: record.clinic, reason: record.reason, notes: record.notes } } });
  for (const record of medications) if (record.startDate <= date && (!record.endDate || date <= record.endDate)) for (const time of medicationTimes(record.schedule)) rows.push({ kind: 'health', key: `medication.${record.id}.${time}`, type: 'medication', title: record.name, detail: record.dose, time, command: { kind: 'medication', id: record.id, draft: { name: record.name, dose: record.dose, times: medicationTimes(record.schedule).join(', '), startDate: dateInput(record.startDate), endDate: dateInput(record.endDate) } } });
  const timeOf = (row: PlannerRow) => row.kind === 'care' ? row.task.time : row.time ?? '';
  return rows.sort((a, b) => timeOf(a).localeCompare(timeOf(b)) || a.key.localeCompare(b.key));
}
export function monthLabel(date: string) {
  const label = new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(calendarDate(date));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
const careAccent: Record<TaskType, Accent> = { meal: 'corgi', walk: 'sage', other: 'butter' };
export const healthAccent: Record<HealthEvent['type'], Accent> = { vaccine: 'blush', visit: 'blush', medication: 'sky' };
// One micro-dot per category on a day, in timeline order, capped so the day pill stays readable.
export function rowAccents(rows: PlannerRow[], limit = 3): Accent[] {
  const accents = rows.map(row => row.kind === 'care' ? careAccent[row.task.type] : healthAccent[row.type]);
  return [...new Set(accents)].slice(0, limit);
}
export type DayPart = 'allDay' | 'morning' | 'afternoon' | 'evening';
export function dayPart(time: string | null): DayPart {
  if (!time) return 'allDay';
  const hour = Number(time.slice(0, 2));
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}
export type TimelineItem = { kind: 'part'; key: string; part: DayPart } | PlannerRow;
export function timeline(rows: PlannerRow[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  let current: DayPart | null = null;
  const sorted = [...rows].sort((a, b) => Number(dayPart(a.kind === 'care' ? a.task.time : a.time) !== 'allDay') - Number(dayPart(b.kind === 'care' ? b.task.time : b.time) !== 'allDay'));
  for (const row of sorted) {
    const part = dayPart(row.kind === 'care' ? row.task.time : row.time);
    if (part !== current) { items.push({ kind: 'part', key: `part.${part}`, part }); current = part; }
    items.push(row);
  }
  return items;
}
export function repeatLabel(rule: string) {
  if (rule === 'daily') return copy.plannerCare.daily;
  if (rule === 'weekdays') return copy.plannerCare.workdays;
  try { return repeatDays(rule).map(day => copy.plannerCare.weekdays[day]).join(', '); } catch { return copy.plannerCare.custom; }
}
