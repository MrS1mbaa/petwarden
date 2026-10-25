import { createPet, listPets } from '../../db/repositories/pets';
import { readSetting } from '../../db/repositories/settings';
import { persistPhoto, removePhoto } from './photoStorage';
import { validateDraft, type PetDraft } from './validation';
import { usePetStore } from './store';
import { syncReminders } from '../../notifications/service';

export async function hydratePets() {
  const pets = await listPets();
  const requested = Number(await readSetting('activePetId'));
  const active = pets.find(pet => pet.id === requested)?.id ?? pets[0]?.id ?? null;
  usePetStore.getState().setPets(pets, active);
}
export async function saveOnboarding(draft: PetDraft) {
  validateDraft(draft);
  let photo: string | null = null;
  let committed = false;
  try {
    photo = draft.photoUri ? await persistPhoto(draft.photoUri) : null;
    const pet = await createPet(draft, photo);
    committed = true;
    const store = usePetStore.getState();
    store.setPets([...store.pets, pet], pet.id);
    store.resetDraft();
    await syncReminders();
    return pet;
  } catch (error) {
    if (photo && !committed) await removePhoto(photo).catch(() => {});
    throw error;
  }
}
