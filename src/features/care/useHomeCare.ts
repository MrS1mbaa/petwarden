import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listCare, saveCare, deleteCare, type TodayTask } from '../../db/repositories/care';
import { setTaskDone } from '../../db/repositories/taskLogs';
import { getMood, saveMood } from '../../db/repositories/moods';
import { latestWeight } from '../../db/repositories/weights';
import { nextVetVisit } from '../../db/repositories/vetVisits';
import { readSetting } from '../../db/repositories/settings';
import { updatePetIdentity } from '../../db/repositories/pets';
import { useActivePet, usePetStore } from '../pets/store';
import { localDate } from '../../lib/dates';
import { copy } from '../../lib/copy';
import { successHaptic } from '../../lib/haptics';
import { syncReminders, snoozeReminder, useReminderState } from '../../notifications/service';
import type { CareDraft, Mood } from './model';

type Snapshot = { petId: number; date: string; tasks: TodayTask[]; mood: Mood | null; weight: number | null; vetDate: string | null; vetReason: string | null; owner: string | null };
export function useHomeCare() {
  const pet = useActivePet();
  const [date, setDate] = useState(localDate);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<number | null>(null);
  const generation = useRef(0), locks = useRef(new Set<number>()), saveLock = useRef(false);
  const load = useCallback(async () => {
    if (!pet) return;
    const request = ++generation.current;
    try {
      const [tasks, mood, weight, vet, owner] = await Promise.all([listCare(pet.id, date), getMood(pet.id, date), latestWeight(pet.id), nextVetVisit(pet.id, date), readSetting('ownerName')]);
      if (request !== generation.current) return;
      setSnapshot({ petId: pet.id, date, tasks, mood, weight: weight?.valueKg ?? null, vetDate: vet?.date ?? null, vetReason: vet?.reason ?? null, owner });
      setError(null);
    } catch { if (request === generation.current) setError(copy.homeCare.loadError); }
  }, [date, pet]);
  useFocusEffect(useCallback(() => {
    setDate(localDate());
    void load();
    const checkDate = () => setDate(localDate());
    const timer = setInterval(checkDate, 60_000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') { checkDate(); void load(); } });
    return () => { generation.current++; clearInterval(timer); subscription.remove(); };
  }, [load]));
  useEffect(() => () => { generation.current++; }, []);
  const data = snapshot?.petId === pet?.id && snapshot.date === date ? snapshot : null;
  const refresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  const check = useCallback(async (task: TodayTask) => {
    const today = localDate();
    if (today !== date) { setDate(today); setNotice(copy.dayChanged); return; }
    if (!pet || locks.current.has(task.id)) return;
    locks.current.add(task.id); setPending([...locks.current]); setNotice(null);
    try {
      await setTaskDone(pet.id, task.id, date, !task.done);
      if (!task.done) successHaptic();
      setSnapshot(previous => previous?.petId === pet.id && previous.date === date ? { ...previous, tasks: previous.tasks.map(item => item.id === task.id ? { ...item, done: !task.done } : item) } : previous);
      setCelebration(task.done ? null : task.id);
    } catch { setNotice(copy.homeCare.saveError); }
    finally { locks.current.delete(task.id); setPending([...locks.current]); }
  }, [date, pet]);
  const mutate = useCallback(async (work: () => Promise<unknown>, reschedule = true) => {
    if (saveLock.current) return false;
    saveLock.current = true; setSaving(true); setNotice(null);
    try { await work(); await load(); if (reschedule) await syncReminders(); successHaptic(); return true; }
    finally { saveLock.current = false; setSaving(false); }
  }, [load]);
  const changeMood = (mood: Mood) => {
    const today = localDate();
    if (today !== date) setDate(today);
    return pet ? mutate(() => saveMood(pet.id, today, mood), false) : Promise.resolve(false);
  };
  const saveTask = (id: number | null, draft: CareDraft) => pet ? mutate(() => saveCare(pet.id, id, draft)) : Promise.resolve(false);
  const removeTask = (task: TodayTask) => pet ? mutate(() => deleteCare(pet.id, task.id)) : Promise.resolve(false);
  const rename = (name: string, breed: string) => pet ? mutate(async () => {
    const updated = await updatePetIdentity(pet.id, name, breed);
    const state = usePetStore.getState();
    state.setPets(state.pets.map(item => item.id === updated.id ? updated : item), state.activePetId);
  }) : Promise.resolve(false);
  const snooze = useCallback(async (task: TodayTask) => {
    if (!pet || locks.current.has(task.id)) return;
    locks.current.add(task.id); setPending([...locks.current]);
    try { await snoozeReminder(task, pet.name); setNotice(copy.homeCare.snoozed); successHaptic(); }
    catch { const status = useReminderState.getState().status; setNotice(copy.reminders[status === 'enabled' ? 'failed' : status]); }
    finally { locks.current.delete(task.id); setPending([...locks.current]); }
  }, [pet]);
  const finishCelebration = useCallback(() => setCelebration(null), []);
  return { pet, data, loading: data === null && !error, error, notice, pending, saving, refreshing, refresh, check, changeMood, saveTask, removeTask, rename, snooze, celebration, finishCelebration };
}
