import { and, desc, eq } from 'drizzle-orm';
import { withDatabase } from '../client';
import { vaccines } from '../schema';
import { validateVaccine, type VaccineDraft } from '../../features/health/model';
export type Vaccine = typeof vaccines.$inferSelect;
export function listVaccines(petId: number) {
  return withDatabase(db => db.select().from(vaccines).where(eq(vaccines.petId, petId)).orderBy(desc(vaccines.id)).all());
}
export function saveVaccine(petId: number, id: number | null, draft: VaccineDraft) {
  const values = validateVaccine(draft);
  return withDatabase(async db => {
    if (id === null) return db.insert(vaccines).values({ petId, ...values }).returning().get();
    const result = await db.update(vaccines).set(values).where(and(eq(vaccines.petId, petId), eq(vaccines.id, id))).returning().get();
    if (!result) throw new Error('Record missing');
    return result;
  });
}
export function deleteVaccine(petId: number, id: number) {
  return withDatabase(db => db.delete(vaccines).where(and(eq(vaccines.petId, petId), eq(vaccines.id, id))).run());
}
