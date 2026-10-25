import { eq } from 'drizzle-orm';
import { withDatabase } from '../client';
import { petHealthNotes } from '../schema';
import { validateHealthNotes, type NotesDraft } from '../../features/health/model';
export function readHealthNotes(petId: number) {
  return withDatabase(async db => (await db.select().from(petHealthNotes).where(eq(petHealthNotes.petId, petId)).get()) ?? { petId, allergies: '', notes: '' });
}
export function saveHealthNotes(petId: number, draft: NotesDraft) {
  const values = validateHealthNotes(draft);
  return withDatabase(db => db.insert(petHealthNotes).values({ petId, ...values }).onConflictDoUpdate({ target: petHealthNotes.petId, set: values }).run());
}
