import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { useActivePet } from '../pets/store';
import { listWeights, saveWeight, deleteWeight, type Weight } from '../../db/repositories/weights';
import { listVaccines, saveVaccine, deleteVaccine, type Vaccine } from '../../db/repositories/vaccines';
import { listVetVisits, saveVetVisit, deleteVetVisit, type VetVisit } from '../../db/repositories/vetVisits';
import { listMedications, saveMedication, deleteMedication, type Medication } from '../../db/repositories/medications';
import { readHealthNotes, saveHealthNotes } from '../../db/repositories/healthNotes';
import { successHaptic } from '../../lib/haptics';
import { copy } from '../../lib/copy';
import { syncReminders } from '../../notifications/service';
import { dateInput, medicationStatus, medicationTimes, vaccineStatus, type WeightDraft, type VaccineDraft, type VisitDraft, type MedicationDraft, type NotesDraft } from './model';
import { displayDate, localDate } from '../../lib/dates';
import type { Accent } from '../../theme/theme';

const vaccineTone = { overdue: 'blush', due: 'butter', given: 'sage', unscheduled: null } as const satisfies Record<ReturnType<typeof vaccineStatus>, Accent | null>;
const medicationTone = { planned: 'sky', active: 'sage', ended: null } as const satisfies Record<ReturnType<typeof medicationStatus>, Accent | null>;

export type HealthCommand = { kind: 'weight'; id: number | null; draft: WeightDraft } | { kind: 'vaccine'; id: number | null; draft: VaccineDraft } | { kind: 'visit'; id: number | null; draft: VisitDraft } | { kind: 'medication'; id: number | null; draft: MedicationDraft } | { kind: 'notes'; id: null; draft: NotesDraft };
type Snapshot = { petId: number; weights: Weight[]; vaccines: Vaccine[]; visits: VetVisit[]; medications: Medication[]; notes: NotesDraft };
export type HealthRow = { key: string; title: string; detail: string; status?: string; statusTone?: Accent | null; notes?: string; command: HealthCommand };
export type HealthSection = { key: string; kind: 'weight' | 'vaccine' | 'visit' | 'medication'; data: HealthRow[] };
function sectionsFor(data: Snapshot, today: string): HealthSection[] {
  return [
    { key: 'weight', kind: 'weight', data: data.weights.slice().reverse().map(record => ({ key: `weight.${record.id}`, title: copy.healthRecords.kilograms(record.valueKg), detail: displayDate(record.date), command: { kind: 'weight', id: record.id, draft: { value: String(record.valueKg).replace('.', ','), date: dateInput(record.date) } } })) },
    { key: 'vaccine', kind: 'vaccine', data: data.vaccines.map(record => ({ key: `vaccine.${record.id}`, title: record.name, status: copy.healthRecords.vaccineStatus[vaccineStatus(record, today)], statusTone: vaccineTone[vaccineStatus(record, today)], detail: copy.healthRecords.vaccineDates(displayDate(record.givenAt), displayDate(record.nextDueAt)), notes: record.notes, command: { kind: 'vaccine', id: record.id, draft: { name: record.name, givenAt: dateInput(record.givenAt), nextDueAt: dateInput(record.nextDueAt), notes: record.notes } } })) },
    { key: 'visit', kind: 'visit', data: data.visits.map(record => ({ key: `visit.${record.id}`, title: record.reason, detail: [displayDate(record.date), record.clinic].filter(Boolean).join(' · '), notes: record.notes, command: { kind: 'visit', id: record.id, draft: { date: dateInput(record.date), clinic: record.clinic, reason: record.reason, notes: record.notes } } })) },
    { key: 'medication', kind: 'medication', data: data.medications.map(record => ({ key: `medication.${record.id}`, title: record.name, status: copy.healthRecords.medicationStatus[medicationStatus(record, today)], statusTone: medicationTone[medicationStatus(record, today)], detail: [record.dose, medicationTimes(record.schedule).join(' · '), copy.healthRecords.dateRange(displayDate(record.startDate), displayDate(record.endDate))].join('\n'), command: { kind: 'medication', id: record.id, draft: { name: record.name, dose: record.dose, times: medicationTimes(record.schedule).join(', '), startDate: dateInput(record.startDate), endDate: dateInput(record.endDate) } } })) },
  ];
}
export function useHealth() {
  const pet = useActivePet();
  const [today, setToday] = useState(localDate);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const generation = useRef(0), lock = useRef(false);
  const load = useCallback(async () => {
    if (!pet) return;
    const request = ++generation.current;
    try {
      const [weights, vaccines, visits, medications, notes] = await Promise.all([listWeights(pet.id), listVaccines(pet.id), listVetVisits(pet.id), listMedications(pet.id), readHealthNotes(pet.id)]);
      if (generation.current === request) { setSnapshot({ petId: pet.id, weights, vaccines, visits, medications, notes }); setError(null); }
    } catch { if (generation.current === request) setError(copy.healthRecords.loadError); }
  }, [pet]);
  useFocusEffect(useCallback(() => {
    setToday(localDate()); void load();
    const timer = setInterval(() => setToday(localDate()), 60_000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') { setToday(localDate()); void load(); } });
    return () => { generation.current++; clearInterval(timer); subscription.remove(); };
  }, [load]));
  const save = async (command: HealthCommand) => {
    if (!pet || lock.current) return false;
    lock.current = true; setSaving(true);
    try {
      switch (command.kind) {
        case 'weight': await saveWeight(pet.id, command.id, command.draft); break;
        case 'vaccine': await saveVaccine(pet.id, command.id, command.draft); break;
        case 'visit': await saveVetVisit(pet.id, command.id, command.draft); break;
        case 'medication': await saveMedication(pet.id, command.id, command.draft); break;
        case 'notes': await saveHealthNotes(pet.id, command.draft); break;
      }
      successHaptic(); await load(); if (command.kind !== 'notes' && command.kind !== 'weight') await syncReminders(); return true;
    } finally { lock.current = false; setSaving(false); }
  };
  const data = snapshot?.petId === pet?.id ? snapshot : null;
  const remove = async (command: HealthCommand) => {
    if (!pet || command.id === null || lock.current) return false;
    lock.current = true; setSaving(true);
    try {
      switch (command.kind) {
        case 'weight': await deleteWeight(pet.id, command.id); break;
        case 'vaccine': await deleteVaccine(pet.id, command.id); break;
        case 'visit': await deleteVetVisit(pet.id, command.id); break;
        case 'medication': await deleteMedication(pet.id, command.id); break;
      }
      await load(); if (command.kind !== 'weight') await syncReminders(); successHaptic(); return true;
    } finally { lock.current = false; setSaving(false); }
  };
  const sections = useMemo(() => data ? sectionsFor(data, today) : [], [data, today]);
  return { pet, data, sections, error, saving, refresh: load, save, remove };
}
