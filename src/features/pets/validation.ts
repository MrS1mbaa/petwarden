import { isSpecies } from '../../db/species.ts';
import type { Species } from '../../db/schema';
import { localDate } from '../../lib/dates.ts';

export type PetDraft = { name: string; species: Species; breed: string; birthDate: string; weight: string; photoUri: string | null; morning: string; evening: string; walk: string; walksEnabled: boolean };
export const initialDraft: PetDraft = { name: '', species: 'dog', breed: '', birthDate: '', weight: '', photoUri: null, morning: '08:00', evening: '18:00', walk: '14:00', walksEnabled: true };
export type ValidationKey = 'name' | 'species' | 'breed' | 'birthDate' | 'weight' | 'time';
export class PetValidationError extends Error {
  readonly field: ValidationKey;
  constructor(field: ValidationKey) { super(field); this.field = field; }
}
export function parseBirthDate(value: string, today = localDate()): string | null {
  if (!value.trim()) return null;
  const match = /^(\d{2})\.(\d{2})\.(\d{4})\.?$/.exec(value.trim());
  if (!match) throw new PetValidationError('birthDate');
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(`${iso}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso || iso > today || Number(year) < 1900) throw new PetValidationError('birthDate');
  return iso;
}
export function parseWeight(value: string): number | null {
  if (!value.trim()) return null;
  if (!/^\d+(?:[.,]\d{1,3})?$/.test(value.trim())) throw new PetValidationError('weight');
  const weight = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(weight) || weight <= 0 || weight > 500) throw new PetValidationError('weight');
  return weight;
}
export function parseTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) throw new PetValidationError('time');
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}
export function validateStep(draft: PetDraft, step: number) {
  if (step === 0) {
    if (!draft.name.trim() || draft.name.trim().length > 40) throw new PetValidationError('name');
    if (!isSpecies(draft.species)) throw new PetValidationError('species');
    if (draft.breed.trim().length > 80) throw new PetValidationError('breed');
  }
  if (step === 1) { parseBirthDate(draft.birthDate); parseWeight(draft.weight); }
  if (step === 2) { parseTime(draft.morning); parseTime(draft.evening); if (draft.walksEnabled) parseTime(draft.walk); }
}
export function validateDraft(draft: PetDraft) {
  [0, 1, 2].forEach(step => validateStep(draft, step));
  return { name: draft.name.trim(), species: draft.species, breed: draft.breed.trim(), birthDate: parseBirthDate(draft.birthDate), weight: parseWeight(draft.weight), morning: parseTime(draft.morning), evening: parseTime(draft.evening), walk: draft.walksEnabled ? parseTime(draft.walk) : null };
}
