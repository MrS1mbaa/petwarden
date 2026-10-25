import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { latestWeight } from '../../db/repositories/weights';
import { useActivePet } from './store';

type Result = { petId: number; weight: number | null; error: boolean };
export function usePetProfile() {
  const pet = useActivePet();
  const petId = pet?.id;
  const [result, setResult] = useState<Result | null>(null);
  const load = useCallback(async () => {
    if (petId === undefined) return;
    try { const row = await latestWeight(petId); setResult({ petId, weight: row?.valueKg ?? null, error: false }); }
    catch { setResult({ petId, weight: null, error: true }); }
  }, [petId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const current = result?.petId === petId ? result : null;
  return { pet, weight: current?.weight ?? null, loading: current === null, error: current?.error ?? false, retry: () => void load() };
}
