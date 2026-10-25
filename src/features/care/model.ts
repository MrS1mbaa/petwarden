import { copy } from '../../lib/copy.ts';
import { parseTime, PetValidationError } from '../pets/validation.ts';

export type TaskType = 'meal' | 'walk' | 'other';
export type CareDraft = { title: string; type: TaskType; time: string; repeatRule: string };
export type Mood = 'happy' | 'calm' | 'sleepy' | 'playful' | 'unwell';
export const moodChoices: Mood[] = ['happy', 'calm', 'sleepy', 'playful', 'unwell'];
export const moodEmoji: Record<Mood, string> = { happy: '😊', calm: '😌', sleepy: '😴', playful: '🤩', unwell: '🥺' };
export function repeatDays(rule: string): number[] {
  if (rule === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  if (rule === 'weekdays') return [1, 2, 3, 4, 5];
  try {
    const days: unknown = JSON.parse(rule);
    if (Array.isArray(days) && days.length > 0 && days.every(day => Number.isInteger(day) && day >= 0 && day <= 6)) return [...new Set(days as number[])].sort();
  } catch {}
  throw new Error(copy.plannerCare.invalidRepeat);
}
export function occursOn(rule: string, date: string) {
  return repeatDays(rule).includes(new Date(`${date}T12:00:00`).getDay());
}
export function validateCare(draft: CareDraft): CareDraft {
  const title = draft.title.trim();
  if (!title || title.length > 80) throw new Error(copy.homeCare.invalidTitle);
  if (!['meal', 'walk', 'other'].includes(draft.type)) throw new Error(copy.homeCare.invalidType);
  repeatDays(draft.repeatRule);
  try { return { ...draft, title, time: parseTime(draft.time) }; }
  catch (error) { if (error instanceof PetValidationError) throw new Error(copy.onboarding.validation.time); throw error; }
}
