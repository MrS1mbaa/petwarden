import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { withDatabase } from '../client';
import { vetVisits } from '../schema';
import { validateVisit, type VisitDraft } from '../../features/health/model';

export type VetVisit = typeof vetVisits.$inferSelect;
export function listVetVisits(petId: number) {
  return withDatabase(db => db.select().from(vetVisits).where(eq(vetVisits.petId, petId)).orderBy(desc(vetVisits.date), desc(vetVisits.id)).all());
}
export function saveVetVisit(petId: number, id: number | null, draft: VisitDraft) {
  const values = validateVisit(draft);
  return withDatabase(async db => {
    if (id === null) return db.insert(vetVisits).values({ petId, ...values }).returning().get();
    const result = await db.update(vetVisits).set(values).where(and(eq(vetVisits.petId, petId), eq(vetVisits.id, id))).returning().get();
    if (!result) throw new Error('Record missing');
    return result;
  });
}
export function deleteVetVisit(petId: number, id: number) {
  return withDatabase(db => db.delete(vetVisits).where(and(eq(vetVisits.petId, petId), eq(vetVisits.id, id))).run());
}

export function nextVetVisit(petId: number, date: string) {
  return withDatabase(async db => (await db.select().from(vetVisits).where(and(eq(vetVisits.petId, petId), gte(vetVisits.date, date))).orderBy(asc(vetVisits.date), asc(vetVisits.id)).get()) ?? null);
}
