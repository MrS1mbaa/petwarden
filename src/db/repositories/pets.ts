import { asc, eq } from 'drizzle-orm';
import { withDatabase, withTransaction } from '../client';
import { careTasks, documents, pets, settings, weights } from '../schema';
import { isSpecies } from '../species';
import { localDate } from '../../lib/dates';
import { copy } from '../../lib/copy';
import { validateDraft, parseBirthDate, type PetDraft } from '../../features/pets/validation';

export async function listPets() {
  return withDatabase(db => db.select().from(pets).orderBy(asc(pets.id)).all());
}
export function updatePetIdentity(id: number, name: string, breed: string) {
  const draft = { name: name.trim(), breed: breed.trim() };
  if (!draft.name || draft.name.length > 40) throw new Error(copy.onboarding.validation.name);
  if (draft.breed.length > 80) throw new Error(copy.onboarding.validation.breed);
  return withDatabase(async db => {
    const pet = await db.update(pets).set(draft).where(eq(pets.id, id)).returning().get();
    if (!pet) throw new Error('Ljubimac više nije dostupan.');
    return pet;
  });
}
export function updatePetDetails(id: number, draft: { name: string; species: PetDraft['species']; breed: string; birthDate: string; photoUri: string | null }) {
  const name = draft.name.trim(), breed = draft.breed.trim();
  if (!name || name.length > 40) throw new Error(copy.onboarding.validation.name);
  if (breed.length > 80) throw new Error(copy.onboarding.validation.breed);
  if (!isSpecies(draft.species)) throw new Error(copy.onboarding.validation.species);
  const birthDate = parseBirthDate(draft.birthDate);
  return withDatabase(async db => {
    const pet = await db.update(pets).set({ name, breed, species: draft.species, birthDate, photoUri: draft.photoUri }).where(eq(pets.id, id)).returning().get();
    if (!pet) throw new Error('Ljubimac više nije dostupan.');
    return pet;
  });
}
// Cascade removes every child row; return the files so the caller can delete them.
export function deletePet(id: number) {
  return withTransaction(async tx => {
    const docs = await tx.select({ uri: documents.uri }).from(documents).where(eq(documents.petId, id)).all();
    const pet = await tx.delete(pets).where(eq(pets.id, id)).returning().get();
    if (!pet) throw new Error('Ljubimac više nije dostupan.');
    return { photoUri: pet.photoUri, documentUris: docs.map(doc => doc.uri) };
  });
}
export async function createPet(draft: PetDraft, photoUri: string | null) {
  const input = validateDraft(draft);
  return withTransaction(async tx => {
    const pet = await tx.insert(pets).values({ name: input.name, species: input.species, breed: input.breed, birthDate: input.birthDate, photoUri, createdAt: new Date().toISOString() }).returning().get();
    if (input.weight !== null) await tx.insert(weights).values({ petId: pet.id, valueKg: input.weight, date: localDate() }).run();
    const tasks = [
      { petId: pet.id, type: 'meal' as const, title: copy.care.morning, time: input.morning, repeatRule: 'daily', active: true },
      { petId: pet.id, type: 'meal' as const, title: copy.care.evening, time: input.evening, repeatRule: 'daily', active: true },
    ];
    await tx.insert(careTasks).values(tasks).run();
    if (input.walk) await tx.insert(careTasks).values({ petId: pet.id, type: 'walk', title: copy.care.walk, time: input.walk, repeatRule: 'daily', active: true }).run();
    await tx.insert(settings).values({ key: 'activePetId', value: String(pet.id) }).onConflictDoUpdate({ target: settings.key, set: { value: String(pet.id) } }).run();
    return pet;
  });
}
