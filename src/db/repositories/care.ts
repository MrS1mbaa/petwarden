import { and, asc, eq } from 'drizzle-orm';
import { withDatabase } from '../client';
import { careTasks, taskLogs, pets } from '../schema';
import { occursOn, validateCare, type CareDraft } from '../../features/care/model';

export type CareTask = typeof careTasks.$inferSelect;
export type TodayTask = CareTask & { done: boolean };
export function listCare(petId: number, date: string): Promise<TodayTask[]> {
  return withDatabase(async db => {
    const rows = await db.select({ task: careTasks, doneAt: taskLogs.doneAt }).from(careTasks).leftJoin(taskLogs, and(eq(taskLogs.taskId, careTasks.id), eq(taskLogs.date, date))).where(and(eq(careTasks.petId, petId), eq(careTasks.active, true))).orderBy(asc(careTasks.time), asc(careTasks.id)).all();
    return rows.filter(row => occursOn(row.task.repeatRule, date)).map(row => ({ ...row.task, done: row.doneAt !== null }));
  });
}
export function listReminderTasks() {
  return withDatabase(db => db.select({ task: careTasks, petName: pets.name }).from(careTasks).innerJoin(pets, eq(pets.id, careTasks.petId)).where(eq(careTasks.active, true)).orderBy(asc(careTasks.id)).all());
}
export function saveCare(petId: number, id: number | null, draft: CareDraft) {
  const input = validateCare(draft);
  return withDatabase(async db => {
    if (id === null) return db.insert(careTasks).values({ ...input, petId, active: true }).returning().get();
    const task = await db.update(careTasks).set(input).where(and(eq(careTasks.id, id), eq(careTasks.petId, petId))).returning().get();
    if (!task) throw new Error('Obaveza više nije dostupna.');
    return task;
  });
}
export function deleteCare(petId: number, id: number) {
  return withDatabase(async db => { await db.delete(careTasks).where(and(eq(careTasks.id, id), eq(careTasks.petId, petId))).run(); });
}
