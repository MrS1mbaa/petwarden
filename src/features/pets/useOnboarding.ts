import { useEffect, useRef, useState, type RefObject } from 'react';
import { Keyboard, Platform, type View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { copy } from '../../lib/copy';
import { readSetting } from '../../db/repositories/settings';
import { toggleReminders } from '../../notifications/service';
import { usePetStore } from './store';
import { saveOnboarding } from './service';
import { PetValidationError, validateStep } from './validation';
import { measurePhotoFrame } from './usePhotoFrame';
import { usePhotoTransition } from './photoTransition';

export function useOnboarding(photoRef: RefObject<View | null>) {
  const adding = useLocalSearchParams<{ add?: string }>().add === '1';
  const draft = usePetStore(state => state.draft);
  const updateDraft = usePetStore(state => state.updateDraft);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  // The only permission the app needs: asked once, here, on the first onboarding.
  useEffect(() => { if (!adding) void readSetting('remindersEnabled').then(value => value === null ? toggleReminders(true) : undefined).catch(() => {}); }, [adding]);
  async function next() {
    if (saving.current || photoBusy) return;
    setError(null);
    try {
      validateStep(draft, step);
      Keyboard.dismiss();
      if (step < 2) { setStep(step + 1); return; }
      saving.current = true;
      setBusy(true);
      const frame = draft.photoUri ? await measurePhotoFrame(photoRef) : null;
      const pet = await saveOnboarding(draft);
      if (frame && pet.photoUri) usePhotoTransition.getState().begin(pet.id, pet.photoUri, frame);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/');
    } catch (error) {
      Keyboard.dismiss(); // the message sits below the fields; an open keyboard would hide it
      setError(error instanceof PetValidationError ? copy.onboarding.validation[error.field] : copy.onboarding.saveError);
    } finally { saving.current = false; setBusy(false); }
  }
  async function choosePhoto() {
    if (photoBusy || saving.current) return;
    setError(null); setPhotoBusy(true);
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { setError(copy.onboarding.photoPermission); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, allowsMultipleSelection: false });
      if (!result.canceled && result.assets[0]) updateDraft({ photoUri: result.assets[0].uri });
    } catch { setError(copy.onboarding.photoError); }
    finally { setPhotoBusy(false); }
  }
  function back() {
    if (saving.current || photoBusy) return;
    setError(null); Keyboard.dismiss();
    if (step > 0) setStep(step - 1); else router.replace(adding ? '/profile' : '/welcome');
  }
  return { draft, updateDraft, step, busy, photoBusy, error, next, back, choosePhoto };
}
