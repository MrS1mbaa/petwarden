import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { syncReminders, useReminderState } from './service';
import { observeNotificationOpen } from './platform';
import { usePetStore } from '../features/pets/store';
import { writeSetting } from '../db/repositories/settings';

export function useReminderLifecycle(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    void syncReminders();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void syncReminders(); });
    let active = true;
    const stop = observeNotificationOpen(target => {
      void (async () => {
        if (target.petId != null) {
          if (!usePetStore.getState().pets.some(pet => pet.id === target.petId)) return;
          await writeSetting('activePetId', String(target.petId));
          if (!active) return;
          const state = usePetStore.getState();
          state.setPets(state.pets, target.petId);
        }
        if (active) router.replace(target.url);
      })().catch(() => useReminderState.setState({ status: 'failed' }));
    });
    return () => { active = false; subscription.remove(); stop(); };
  }, [ready]);
}
