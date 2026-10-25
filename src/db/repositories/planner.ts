import { listCare } from './care';
import { listVaccines } from './vaccines';
import { listVetVisits } from './vetVisits';
import { listMedications } from './medications';
import { dayEntries, rowAccents } from '../../features/planner/model';

export async function listPlannerDay(petId: number, date: string) {
  const [tasks, vaccines, visits, medications] = await Promise.all([listCare(petId, date), listVaccines(petId), listVetVisits(petId), listMedications(petId)]);
  return { tasks, rows: dayEntries(date, tasks, vaccines, visits, medications) };
}
export async function listPlannerWeekMarks(petId: number, dates: string[]) {
  const [vaccines, visits, medications] = await Promise.all([listVaccines(petId), listVetVisits(petId), listMedications(petId)]);
  const tasks = await Promise.all(dates.map(date => listCare(petId, date)));
  return Object.fromEntries(dates.map((date, index) => [date, rowAccents(dayEntries(date, tasks[index], vaccines, visits, medications))]));
}
