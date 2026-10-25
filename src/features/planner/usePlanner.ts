import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useActivePet } from '../pets/store';
import { listPlannerDay, listPlannerWeekMarks } from '../../db/repositories/planner';
import type { Accent } from '../../theme/theme';
import { saveCare, deleteCare, type TodayTask } from '../../db/repositories/care';
import { setTaskDone } from '../../db/repositories/taskLogs';
import { localDate } from '../../lib/dates';
import { copy } from '../../lib/copy';
import { tokens } from '../../theme/theme';
import { successHaptic } from '../../lib/haptics';
import { syncReminders, snoozeReminder, useReminderState } from '../../notifications/service';
import { canCheckDate, shiftDate, weekFor, type PlannerRow, type CalendarCommand } from './model';
import type { CareDraft } from '../care/model';
import { saveVaccine, deleteVaccine } from '../../db/repositories/vaccines';
import { saveVetVisit, deleteVetVisit } from '../../db/repositories/vetVisits';
import { saveMedication, deleteMedication } from '../../db/repositories/medications';

type Snapshot = { petId: number; date: string; tasks: TodayTask[]; rows: PlannerRow[] };
export function usePlanner() {
  const pet = useActivePet();
  const [date, setDate] = useState(localDate), [today, setToday] = useState(localDate);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<number[]>([]), [saving, setSaving] = useState(false), [refreshing, setRefreshing] = useState(false);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [marks, setMarks] = useState<{ key: string; days: Record<string, Accent[]> } | null>(null);
  const generation = useRef(0), locks = useRef(new Set<number>()), saveLock = useRef(false);
  const key = `${pet?.id}.${date}`;
  const weekKey = `${pet?.id}.${weekFor(date)[0]}`;
  const load = useCallback(async () => {
    if (!pet) return;
    const request = ++generation.current;
    try {
      const week = weekFor(date);
      const [records, days] = await Promise.all([listPlannerDay(pet.id, date), listPlannerWeekMarks(pet.id, week)]);
      if (generation.current === request) { setSnapshot({ ...records, petId: pet.id, date }); setMarks({ key: `${pet.id}.${week[0]}`, days }); setError(null); }
    } catch { if (generation.current === request) setError({ key: `${pet.id}.${date}`, message: copy.plannerCare.loadError }); }
  }, [pet, date]);
  useFocusEffect(useCallback(() => {
    void load();
    const updateDay = () => setToday(localDate());
    updateDay();
    const timer = setInterval(updateDay, tokens.planner.dayPoll);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') { updateDay(); void load(); } });
    return () => { generation.current++; clearInterval(timer); subscription.remove(); };
  }, [load]));
  const data = snapshot?.petId === pet?.id && snapshot.date === date ? snapshot : null;
  const check = useCallback(async (task: TodayTask) => {
    if (!canCheckDate(date)) { setNotice(copy.plannerCare.futureCheck); return; }
    if (!pet || locks.current.has(task.id)) return;
    locks.current.add(task.id); setPending([...locks.current]); setNotice(null);
    try {
      await setTaskDone(pet.id, task.id, date, !task.done);
      if (!task.done) successHaptic();
      setSnapshot(previous => {
        if (previous?.petId !== pet.id || previous.date !== date) return previous;
        const updated = { ...task, done: !task.done };
        return { ...previous, tasks: previous.tasks.map(item => item.id === task.id ? updated : item), rows: previous.rows.map(row => row.kind === 'care' && row.task.id === task.id ? { ...row, task: updated } : row) };
      });
      setCelebration(task.done ? null : task.id);
    } catch { setNotice(copy.homeCare.saveError); }
    finally { locks.current.delete(task.id); setPending([...locks.current]); }
  }, [pet, date]);
  const mutate = async (work: () => Promise<unknown>) => {
    if (saveLock.current) return false;
    saveLock.current = true; setSaving(true); setNotice(null);
    try { await work(); await load(); await syncReminders(); successHaptic(); return true; }
    finally { saveLock.current = false; setSaving(false); }
  };
  const snooze = useCallback(async (task: TodayTask) => {
    if (date !== localDate()) { setNotice(copy.plannerCare.snoozeToday); return; }
    if (!pet || locks.current.has(task.id)) return;
    locks.current.add(task.id); setPending([...locks.current]);
    try { await snoozeReminder(task, pet.name); setNotice(copy.homeCare.snoozed); successHaptic(); }
    catch { const status = useReminderState.getState().status; setNotice(copy.reminders[status === 'enabled' ? 'failed' : status]); }
    finally { locks.current.delete(task.id); setPending([...locks.current]); }
  }, [pet, date]);
  const selectDate = useCallback((value: string) => { generation.current++; setDate(value); setNotice(null); setCelebration(null); }, []);
  const finishCelebration = useCallback(() => setCelebration(null), []);
  const saveHealth = (command: CalendarCommand) => pet ? mutate(async () => {
    switch (command.kind) {
      case 'vaccine': await saveVaccine(pet.id, command.id, command.draft); break;
      case 'visit': await saveVetVisit(pet.id, command.id, command.draft); break;
      case 'medication': await saveMedication(pet.id, command.id, command.draft); break;
    }
  }) : Promise.resolve(false);
  const removeHealth = (command: CalendarCommand) => pet && command.id !== null ? mutate(async () => {
    switch (command.kind) {
      case 'vaccine': await deleteVaccine(pet.id, command.id!); break;
      case 'visit': await deleteVetVisit(pet.id, command.id!); break;
      case 'medication': await deleteMedication(pet.id, command.id!); break;
    }
  }) : Promise.resolve(false);
  return { pet, date, today, week: weekFor(date), marks: marks?.key === weekKey ? marks.days : {}, data, error: error?.key === key ? error.message : null, pending, saving, refreshing, notice, check, snooze, selectDate, checkDisabled: date > today,
    saveHealth, removeHealth,
    moveWeek: (direction: number) => selectDate(shiftDate(date, direction * tokens.planner.weekDays)),
    goToday: () => selectDate(localDate()),
    saveTask: (id: number | null, draft: CareDraft) => pet ? mutate(() => saveCare(pet.id, id, draft)) : Promise.resolve(false),
    removeTask: (task: TodayTask) => pet ? mutate(() => deleteCare(pet.id, task.id)) : Promise.resolve(false),
    refresh: async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } },
    celebration, finishCelebration,
  };
}
