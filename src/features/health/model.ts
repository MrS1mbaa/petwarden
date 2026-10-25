import { parseBirthDate, parseTime, parseWeight } from '../pets/validation.ts';
import { localDate } from '../../lib/dates.ts';

export type WeightDraft = { value: string; date: string };
export type VaccineDraft = { name: string; givenAt: string; nextDueAt: string; notes: string };
export type VisitDraft = { date: string; clinic: string; reason: string; notes: string };
export type MedicationDraft = { name: string; dose: string; times: string; startDate: string; endDate: string };
export type NotesDraft = { allergies: string; notes: string };
export type HealthField = 'date' | 'weight' | 'name' | 'clinic' | 'reason' | 'notes' | 'allergies' | 'dose' | 'times' | 'dateOrder';
export class HealthValidationError extends Error {
  readonly field: HealthField;
  constructor(field: HealthField) { super(field); this.field = field; }
}
function text(value: string, field: HealthField, max: number, required = true) {
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new HealthValidationError(field);
  return result;
}
function parseHealthDate(value: string, optional = false, future = true, today = localDate()): string | null {
  if (optional && !value.trim()) return null;
  try {
    const result = parseBirthDate(value, future ? '9999-12-31' : today);
    if (!result) throw new Error('date');
    return result;
  } catch { throw new HealthValidationError('date'); }
}
export function dateInput(iso: string | null | undefined): string {
  return iso ? iso.split('-').reverse().join('.') : '';
}
export function validateWeight(draft: WeightDraft, today = localDate()) {
  let valueKg: number | null;
  try { valueKg = parseWeight(draft.value); } catch { throw new HealthValidationError('weight'); }
  if (valueKg === null) throw new HealthValidationError('weight');
  return { valueKg, date: parseHealthDate(draft.date, false, false, today)! };
}
export function validateVaccine(draft: VaccineDraft, today = localDate()) {
  const givenAt = parseHealthDate(draft.givenAt, true, false, today);
  const nextDueAt = parseHealthDate(draft.nextDueAt, true);
  if (!givenAt && !nextDueAt) throw new HealthValidationError('date');
  if (givenAt && nextDueAt && nextDueAt < givenAt) throw new HealthValidationError('dateOrder');
  return { name: text(draft.name, 'name', 100), givenAt, nextDueAt, notes: text(draft.notes, 'notes', 2000, false) };
}
export function validateVisit(draft: VisitDraft) {
  return { date: parseHealthDate(draft.date)!, clinic: text(draft.clinic, 'clinic', 150, false), reason: text(draft.reason, 'reason', 200), notes: text(draft.notes, 'notes', 2000, false) };
}
export function validateHealthNotes(draft: NotesDraft) {
  return { allergies: text(draft.allergies, 'allergies', 1000, false), notes: text(draft.notes, 'notes', 2000, false) };
}
export function validateMedication(draft: MedicationDraft) {
  let times: string[];
  try {
    times = [...new Set(draft.times.split(/[,;\n]/).map(value => parseTime(value)))].sort();
    if (!times.length || times.length > 12) throw new Error('times');
  } catch { throw new HealthValidationError('times'); }
  const startDate = parseHealthDate(draft.startDate)!;
  const endDate = parseHealthDate(draft.endDate, true);
  if (endDate && endDate < startDate) throw new HealthValidationError('dateOrder');
  return { name: text(draft.name, 'name', 100), dose: text(draft.dose, 'dose', 150), schedule: JSON.stringify({ times, repeatRule: 'daily' }), startDate, endDate };
}
export function vaccineStatus(record: { givenAt: string | null; nextDueAt: string | null }, today = localDate()): 'overdue' | 'due' | 'given' | 'unscheduled' {
  if (record.nextDueAt) return record.nextDueAt < today ? 'overdue' : 'due';
  return record.givenAt ? 'given' : 'unscheduled';
}
export function medicationStatus(record: { startDate: string; endDate: string | null }, today = localDate()): 'planned' | 'active' | 'ended' {
  return record.startDate > today ? 'planned' : record.endDate && record.endDate < today ? 'ended' : 'active';
}
export function medicationTimes(schedule: string): string[] {
  try {
    const parsed: unknown = JSON.parse(schedule);
    if (!parsed || typeof parsed !== 'object' || !('times' in parsed) || !Array.isArray(parsed.times)) return [];
    return parsed.times.filter((item): item is string => typeof item === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item));
  } catch { return []; }
}
