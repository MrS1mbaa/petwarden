import { and, desc, eq } from 'drizzle-orm';
import { withDatabase } from '../client';
import { documents } from '../schema';
import { documentTitle } from '../../features/documents/model';
export type PetDocument = typeof documents.$inferSelect;
export function listDocuments(petId: number) {
  return withDatabase(db => db.select().from(documents).where(eq(documents.petId, petId)).orderBy(desc(documents.createdAt), desc(documents.id)).all());
}
export function saveDocument(petId: number, title: string, uri: string) {
  const name = documentTitle(title);
  return withDatabase(db => db.insert(documents).values({ petId, title: name, uri, createdAt: new Date().toISOString() }).returning().get());
}
export function renameDocument(petId: number, id: number, title: string) {
  const name = documentTitle(title);
  return withDatabase(async db => {
    const record = await db.update(documents).set({ title: name }).where(and(eq(documents.petId, petId), eq(documents.id, id))).returning().get();
    if (!record) throw new Error('Dokument više nije dostupan.');
    return record;
  });
}
export function deleteDocument(petId: number, id: number) {
  return withDatabase(db => db.delete(documents).where(and(eq(documents.petId, petId), eq(documents.id, id))).returning().get());
}
