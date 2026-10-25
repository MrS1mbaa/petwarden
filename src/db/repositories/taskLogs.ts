import { and, eq } from 'drizzle-orm';
import { withTransaction } from '../client';
import { careTasks, taskLogs } from '../schema';
import { canCheckDate } from '../../features/planner/model';
import { occursOn } from '../../features/care/model';
import { copy } from '../../lib/copy';

export function setTaskDone(petId: number, taskId: number, date: string, done: boolean) {
  if (!canCheckDate(date)) throw new Error(copy.plannerCare.futureCheck);
  return withTransaction(async db => {
    const task = await db.select({ id: careTasks.id, repeatRule: careTasks.repeatRule }).from(careTasks).where(and(eq(careTasks.id, taskId), eq(careTasks.petId, petId), eq(careTasks.active, true))).get();
    if (!task) throw new Error('Obaveza više nije dostupna.');
    if (!occursOn(task.repeatRule, date)) throw new Error(copy.homeCare.saveError);
    if (done) await db.insert(taskLogs).values({ taskId, date, doneAt: new Date().toISOString() }).onConflictDoNothing({ target: [taskLogs.taskId, taskLogs.date] }).run();
    else await db.delete(taskLogs).where(and(eq(taskLogs.taskId, taskId), eq(taskLogs.date, date))).run();
  });
}
