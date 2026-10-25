import { and, desc, eq } from 'drizzle-orm';
import { withDatabase } from '../client';
import { medications } from '../schema';
import { validateMedication, type MedicationDraft } from '../../features/health/model';
export type Medication = typeof medications.$inferSelect;
export function listMedications(petId: number) {
  return withDatabase(db => db.select().from(medications).where(eq(medications.petId, petId)).orderBy(desc(medications.startDate), desc(medications.id)).all());
}
export function saveMedication(petId: number, id: number | null, draft: MedicationDraft) {
  const values = validateMedication(draft);
  return withDatabase(async db => {
    if (id === null) return db.insert(medications).values({ petId, ...values }).returning().get();
    const result = await db.update(medications).set(values).where(and(eq(medications.petId, petId), eq(medications.id, id))).returning().get();
    if (!result) throw new Error('Record missing');
    return result;
  });
}
export function deleteMedication(petId: number, id: number) {
  return withDatabase(db => db.delete(medications).where(and(eq(medications.petId, petId), eq(medications.id, id))).run());
}
