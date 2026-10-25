import { and, eq, gte, isNotNull, isNull, or } from 'drizzle-orm';
import { withDatabase } from '../client';
import { medications, pets, vaccines, vetVisits } from '../schema';

export function listHealthReminders(date: string) {
  return withDatabase(async db => {
    const vaccineRows = await db.select({ id: vaccines.id, name: vaccines.name, date: vaccines.nextDueAt, petId: pets.id, petName: pets.name }).from(vaccines).innerJoin(pets, eq(pets.id, vaccines.petId)).where(and(isNotNull(vaccines.nextDueAt), gte(vaccines.nextDueAt, date))).all();
    const visits = await db.select({ id: vetVisits.id, name: vetVisits.reason, date: vetVisits.date, petId: pets.id, petName: pets.name }).from(vetVisits).innerJoin(pets, eq(pets.id, vetVisits.petId)).where(gte(vetVisits.date, date)).all();
    const medicationRows = await db.select({ medication: medications, petName: pets.name }).from(medications).innerJoin(pets, eq(pets.id, medications.petId)).where(or(isNull(medications.endDate), gte(medications.endDate, date))).all();
    return { vaccines: vaccineRows.flatMap(row => row.date ? [{ ...row, date: row.date }] : []), visits, medications: medicationRows };
  });
}
