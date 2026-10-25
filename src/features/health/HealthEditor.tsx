import { useState, type RefObject } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { AppText } from '../../components/AppText';
import { FormField } from '../../components/FormField';
import { PillButton } from '../../components/PillButton';
import { useTheme } from '../../theme/ThemeProvider';
import { copy } from '../../lib/copy';
import { maskDate, maskTimes } from '../../lib/dateInput';
import { HealthValidationError } from './model';
import type { HealthCommand } from './useHealth';

const fields = { weight: ['value', 'date'], vaccine: ['name', 'givenAt', 'nextDueAt', 'notes'], visit: ['date', 'clinic', 'reason', 'notes'], medication: ['name', 'dose', 'times', 'startDate', 'endDate'], notes: ['allergies', 'notes'] } as const;
type Values = Record<string, string>;
const isDate = (field: string) => field.toLowerCase().includes('date') || field.endsWith('At');
function commandWithValues(command: HealthCommand, values: Values): HealthCommand {
  switch (command.kind) {
    case 'weight': return { ...command, draft: { value: values.value, date: values.date } };
    case 'vaccine': return { ...command, draft: { name: values.name, givenAt: values.givenAt, nextDueAt: values.nextDueAt, notes: values.notes } };
    case 'visit': return { ...command, draft: { date: values.date, clinic: values.clinic, reason: values.reason, notes: values.notes } };
    case 'medication': return { ...command, draft: { name: values.name, dose: values.dose, times: values.times, startDate: values.startDate, endDate: values.endDate } };
    case 'notes': return { ...command, draft: { allergies: values.allergies, notes: values.notes } };
  }
}
export function HealthEditor({ command, busy, blurTarget, onClose, onSave, onDelete }: { command: HealthCommand; busy: boolean; blurTarget: RefObject<View | null>; onClose: () => void; onSave: (command: HealthCommand) => Promise<boolean>; onDelete: () => Promise<boolean> }) {
  const { colors } = useTheme();
  const [values, setValues] = useState<Values>({ ...command.draft });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    try { if (await onSave(commandWithValues(command, values))) onClose(); }
    catch (cause) { setError(cause instanceof HealthValidationError ? copy.healthRecords.validation[cause.field] : copy.healthRecords.saveError); }
  };
  if (confirmDelete) return <BottomSheet open title={copy.healthRecords.deleteTitle} onClose={onClose} canClose={!busy} blurTarget={blurTarget}><AppText>{copy.healthRecords.deleteBody}</AppText>{error && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{error}</AppText>}<PillButton label={busy ? copy.homeCare.saving : copy.healthRecords.deleteRecord} disabled={busy} onPress={() => { void onDelete().then(deleted => { if (deleted) onClose(); }, () => setError(copy.healthRecords.saveError)); }} /><PillButton label={copy.homeCare.cancel} selected={false} disabled={busy} onPress={() => setConfirmDelete(false)} /></BottomSheet>;
  return <BottomSheet open title={command.id === null ? copy.healthRecords.add : copy.healthRecords.edit} onClose={onClose} canClose={!busy} blurTarget={blurTarget}>
    {fields[command.kind].map(field => <FormField key={field} label={copy.healthRecords.labels[field]} editable={!busy} value={values[field]} onChangeText={value => setValues(previous => ({ ...previous, [field]: isDate(field) ? maskDate(value) : field === 'times' ? maskTimes(value) : value }))} multiline={field === 'notes' || field === 'allergies'} maxLength={field === 'notes' ? 2000 : field === 'allergies' ? 1000 : field === 'value' ? 8 : field.toLowerCase().includes('date') || field.endsWith('At') ? 10 : 200} keyboardType={field === 'value' ? 'decimal-pad' : isDate(field) || field === 'times' ? 'number-pad' : 'default'} placeholder={field === 'times' ? copy.healthRecords.timeHint : field.toLowerCase().includes('date') || field.endsWith('At') ? copy.onboarding.dateHint : undefined} />)}
    {command.kind === 'medication' && <AppText muted variant="label">{copy.healthRecords.doseHint}</AppText>}
    {error && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{error}</AppText>}
    <PillButton label={busy ? copy.homeCare.saving : copy.homeCare.save} disabled={busy} onPress={() => void save()} />
    {command.id !== null && <PillButton label={copy.healthRecords.deleteRecord} selected={false} disabled={busy} onPress={() => { setError(null); setConfirmDelete(true); }} />}
  </BottomSheet>;
}
