import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { readSetting, writeSetting } from '../../db/repositories/settings';
import { deletePet, updatePetDetails } from '../../db/repositories/pets';
import { removeDocumentFile } from '../documents/storage';
import { useActivePet, usePetStore } from './store';
import { hydratePets } from './service';
import { persistPhoto, removePhoto } from './photoStorage';
import type { Species } from '../../db/species';
import { copy } from '../../lib/copy';
import { successHaptic } from '../../lib/haptics';
import { syncReminders } from '../../notifications/service';
import { exportBackup, importBackup } from '../documents/backup';
import { PetValidationError } from './validation';
import { useTheme } from '../../theme/ThemeProvider';
import type { ThemeMode } from '../../theme/theme';
export type DetailsDraft = { name: string; species: Species; breed: string; birthDate: string; photoUri: string | null };
export function useProfileSettings() {
  const pet = useActivePet(), pets = usePetStore(state => state.pets), { setMode } = useTheme();
  const [owner, setOwner] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState<string | null>(null);
  const lock = useRef(false);
  useFocusEffect(useCallback(() => { let active = true; void readSetting('ownerName').then(value => { if (active) setOwner(value ?? ''); }, () => { if (active) setNotice(copy.profileSettings.saveError); }); return () => { active = false; }; }, []));
  const perform = async (work: () => Promise<unknown>, message: string = copy.profileSettings.saved) => {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setNotice(null);
    try { const result = await work(); successHaptic(); setNotice(typeof result === 'string' ? result : message); return true; }
    catch (cause) { setNotice(cause instanceof Error && [copy.profileSettings.exportLimit, copy.profileSettings.importInvalid].includes(cause.message) ? cause.message : message === copy.profileSettings.exportDone ? copy.profileSettings.exportError : copy.profileSettings.saveError); throw cause; }
    finally { lock.current = false; setBusy(false); }
  };
  const switchPet = (id: number) => perform(async () => {
    if (!pets.some(item => item.id === id)) throw new Error(copy.profileSettings.switchError);
    await writeSetting('activePetId', String(id)); usePetStore.getState().setPets(pets, id);
  });
  const saveOwner = (name: string) => perform(async () => {
    if (name.trim().length > 40) throw new Error(copy.profileSettings.ownerInvalid);
    await writeSetting('ownerName', name.trim()); setOwner(name.trim());
  });
  const saveDetails = (draft: DetailsDraft) => perform(async () => {
    if (!pet) throw new Error(copy.profileSettings.saveError);
    let photo: string | null = draft.photoUri;
    const changed = photo !== pet.photoUri;
    if (changed && photo) photo = await persistPhoto(photo);
    try {
      const updated = await updatePetDetails(pet.id, { ...draft, photoUri: photo });
      const state = usePetStore.getState(); state.setPets(state.pets.map(item => item.id === pet.id ? updated : item), state.activePetId);
    } catch (cause) { if (changed && photo) await removePhoto(photo).catch(() => {}); if (cause instanceof PetValidationError) throw new Error(copy.onboarding.validation[cause.field]); throw cause; }
    if (changed && pet.photoUri) await removePhoto(pet.photoUri).catch(() => {});
    await syncReminders();
  });
  const removePet = () => perform(async () => {
    if (!pet) throw new Error(copy.profileSettings.saveError);
    const { photoUri, documentUris } = await deletePet(pet.id);
    const rest = usePetStore.getState().pets.filter(item => item.id !== pet.id);
    if (rest[0]) await writeSetting('activePetId', String(rest[0].id));
    usePetStore.getState().setPets(rest, rest[0]?.id ?? null);
    // Rows are already gone; leftover files are best-effort cleanup.
    if (photoUri) await removePhoto(photoUri).catch(() => {});
    await Promise.all(documentUris.map(uri => removeDocumentFile(uri).catch(() => {})));
    await syncReminders();
  });
  const addPet = () => { usePetStore.getState().resetDraft(); router.push({ pathname: '/onboarding', params: { add: '1' } }); };
  return { pet, pets, owner, busy, notice, switchPet, saveOwner, saveDetails, removePet, addPet, changeTheme: (mode: ThemeMode) => perform(() => setMode(mode)), exportBackup: () => perform(exportBackup, copy.profileSettings.exportDone), importBackup: () => perform(async () => { if (!await importBackup()) return ''; await hydratePets(); await syncReminders(); }, copy.profileSettings.importDone) };
}
