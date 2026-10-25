import { and, asc, desc, eq } from 'drizzle-orm';
import { withDatabase } from '../client';
import { weights } from '../schema';
import { validateWeight, type WeightDraft } from '../../features/health/model';

export type Weight = typeof weights.$inferSelect;
export function listWeights(petId: number) {
  return withDatabase(db => db.select().from(weights).where(eq(weights.petId, petId)).orderBy(asc(weights.date), asc(weights.id)).all());
}
export function saveWeight(petId: number, id: number | null, draft: WeightDraft) {
  const values = validateWeight(draft);
  return withDatabase(async db => {
    if (id === null) return db.insert(weights).values({ petId, ...values }).returning().get();
    const result = await db.update(weights).set(values).where(and(eq(weights.petId, petId), eq(weights.id, id))).returning().get();
    if (!result) throw new Error('Record missing');
    return result;
  });
}
export function deleteWeight(petId: number, id: number) {
  return withDatabase(db => db.delete(weights).where(and(eq(weights.petId, petId), eq(weights.id, id))).run());
}

export async function latestWeight(petId: number) {
  return withDatabase(async db => (await db.select().from(weights).where(eq(weights.petId, petId)).orderBy(desc(weights.date), desc(weights.id)).get()) ?? null);
}
