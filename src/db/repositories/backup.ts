import { withTransaction } from '../client';
import { pets, careTasks, taskLogs, weights, vaccines, vetVisits, medications, documents, moods, petHealthNotes, settings } from '../schema';
export function backupSnapshot() {
  return withTransaction(async db => ({
    pets: await db.select().from(pets).all(), careTasks: await db.select().from(careTasks).all(), taskLogs: await db.select().from(taskLogs).all(),
    weights: await db.select().from(weights).all(), vaccines: await db.select().from(vaccines).all(), vetVisits: await db.select().from(vetVisits).all(), medications: await db.select().from(medications).all(),
    documents: await db.select().from(documents).all(), moods: await db.select().from(moods).all(), healthNotes: await db.select().from(petHealthNotes).all(), settings: await db.select().from(settings).all(),
  }));
}
type Rows = Record<string, any>[];
// Inserts a parsed backup as NEW rows (fresh ids), so it never overwrites or merges into existing pets.
export function restoreSnapshot(data: Record<string, Rows>, uriFor: (ref: string, folder: 'pet-photos' | 'pet-documents') => string) {
  return withTransaction(async db => {
    const petIds = new Map<number, number>(), taskIds = new Map<number, number>();
    const strip = ({ id: _id, ...row }: Record<string, any>) => row;
    const incomplete = () => new Error('Kopija je nepotpuna.');
    for (const row of data.pets) petIds.set(row.id, (await db.insert(pets).values({ ...strip(row), photoUri: row.photoUri ? uriFor(row.photoUri, 'pet-photos') : null } as never).returning().get()).id);
    const petId = (row: Record<string, any>) => petIds.get(row.petId) ?? (() => { throw incomplete(); })();
    for (const row of data.careTasks) taskIds.set(row.id, (await db.insert(careTasks).values({ ...strip(row), petId: petId(row) } as never).returning().get()).id);
    const fail = (): never => { throw incomplete(); };
    // Leaf tables need no new ids back, so insert them in chunks instead of one round-trip per row.
    const chunked = async (table: Parameters<typeof db.insert>[0], rows: Record<string, any>[]) => { for (let i = 0; i < rows.length; i += 200) await db.insert(table).values(rows.slice(i, i + 200) as never).run(); };
    await chunked(taskLogs, data.taskLogs.map(row => ({ ...strip(row), taskId: taskIds.get(row.taskId) ?? fail() })));
    for (const [table, rows] of [[weights, data.weights], [vaccines, data.vaccines], [vetVisits, data.vetVisits], [medications, data.medications], [moods, data.moods]] as const) await chunked(table, rows.map(row => ({ ...strip(row), petId: petId(row) })));
    await chunked(documents, data.documents.map(row => ({ ...strip(row), petId: petId(row), uri: uriFor(row.uri, 'pet-documents') })));
    for (const row of data.healthNotes) await db.insert(petHealthNotes).values({ ...row, petId: petId(row) } as never).run();
  });
}
export type BackupSnapshot = Awaited<ReturnType<typeof backupSnapshot>>;
