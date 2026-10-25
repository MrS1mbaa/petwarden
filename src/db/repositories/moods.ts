import { and, eq } from 'drizzle-orm';
import { withDatabase } from '../client';
import { moods } from '../schema';
import { moodChoices, type Mood } from '../../features/care/model';

export function getMood(petId: number, date: string) {
  return withDatabase(async db => {
    const row = await db.select().from(moods).where(and(eq(moods.petId, petId), eq(moods.date, date))).get();
    return row && moodChoices.includes(row.mood as Mood) ? row.mood as Mood : null;
  });
}
export function saveMood(petId: number, date: string, mood: Mood) {
  if (!moodChoices.includes(mood)) throw new Error('Neispravno raspoloženje.');
  return withDatabase(async db => { await db.insert(moods).values({ petId, date, mood }).onConflictDoUpdate({ target: [moods.petId, moods.date], set: { mood } }).run(); });
}
