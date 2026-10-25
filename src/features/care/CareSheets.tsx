import { useState, type RefObject } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { maskTime } from '../../lib/dateInput';
import { BottomSheet } from '../../components/BottomSheet';
import { AppText } from '../../components/AppText';
import { FormField } from '../../components/FormField';
import { PillButton } from '../../components/PillButton';
import { BreedField } from '../pets/BreedField';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { MoodSelector } from './MoodSelector';
import { copy } from '../../lib/copy';
import { type CareDraft, type Mood } from './model';
import { toggleReminders, syncReminders, useReminderState } from '../../notifications/service';
import type { TodayTask } from '../../db/repositories/care';
import type { Pet } from '../../db/schema';
import { careError } from './errors';
import { displayDate } from '../../lib/dates';
import { RepeatPicker } from '../planner/RepeatPicker';

type SheetBase = { onClose: () => void; blurTarget: RefObject<View | null>; busy: boolean };
export function MoodSheet({ onClose, blurTarget, busy, mood, onSelect }: SheetBase & { mood: Mood | null; onSelect: (mood: Mood) => Promise<boolean> }) {
  const { colors } = useTheme();
  const [error, setError] = useState(false);
  return <BottomSheet open title={copy.moods.title} onClose={onClose} canClose={!busy} blurTarget={blurTarget}>
    <AppText muted>{copy.moods.hint}</AppText><MoodSelector selected={mood} disabled={busy} onSelect={item => { setError(false); void onSelect(item).then(saved => { if (saved) onClose(); else setError(true); }, () => setError(true)); }} />
    {error && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{copy.homeCare.saveError}</AppText>}
  </BottomSheet>;
}
export function TaskSheet({ task, onClose, blurTarget, busy, onSave, onDelete, onSnooze, canSnooze = true }: SheetBase & { task: TodayTask | null; onSave: (id: number | null, draft: CareDraft) => Promise<boolean>; onDelete: () => void; onSnooze: () => void; canSnooze?: boolean }) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<CareDraft>(() => task ? { title: task.title, type: task.type, time: task.time, repeatRule: task.repeatRule } : { title: '', type: 'meal', time: '08:00', repeatRule: 'daily' });
  const [error, setError] = useState<string | null>(null);
  const save = async () => { try { if (await onSave(task?.id ?? null, draft)) onClose(); } catch (cause) { setError(careError(cause)); } };
  return <BottomSheet open title={task ? copy.homeCare.editTask(task.title) : copy.homeCare.add} onClose={onClose} canClose={!busy} blurTarget={blurTarget}>
    <FormField editable={!busy} label={copy.homeCare.taskTitle} placeholder={copy.homeCare.taskHint} value={draft.title} onChangeText={title => setDraft({ ...draft, title })} maxLength={80} />
    <AppText bold>{copy.homeCare.taskType}</AppText><View style={styles.choices}>{(['meal', 'walk', 'other'] as const).map(type => <PillButton key={type} toggle label={copy.homeCare.types[type]} selected={draft.type === type} disabled={busy} onPress={() => setDraft({ ...draft, type })} />)}</View>
    <FormField editable={!busy} label={copy.homeCare.taskTime} placeholder={copy.onboarding.timeHint} value={draft.time} onChangeText={time => setDraft({ ...draft, time: maskTime(time) })} keyboardType="number-pad" maxLength={5} />
    <RepeatPicker rule={draft.repeatRule} disabled={busy} onChange={repeatRule => setDraft({ ...draft, repeatRule })} />
    {task && <AppText muted variant="label">{copy.plannerCare.sharedSchedule}</AppText>}
    {error && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{error}</AppText>}
    <PillButton label={busy ? copy.homeCare.saving : copy.homeCare.save} disabled={busy} onPress={() => void save()} />
    {task && <View style={styles.choices}><PillButton label={copy.homeCare.snooze} selected={false} disabled={busy || !canSnooze} onPress={onSnooze} /><PillButton label={copy.homeCare.delete} selected={false} disabled={busy} onPress={onDelete} /></View>}
  </BottomSheet>;
}
export function IdentitySheet({ pet, onClose, blurTarget, busy, onSave }: SheetBase & { pet: Pet; onSave: (name: string, breed: string) => Promise<boolean> }) {
  const { colors } = useTheme();
  const [name, setName] = useState(pet.name), [breed, setBreed] = useState(pet.breed), [error, setError] = useState<string | null>(null);
  const save = async () => { try { if (await onSave(name, breed)) onClose(); } catch (cause) { setError(careError(cause)); } };
  return <BottomSheet open title={copy.homeCare.editTitle} onClose={onClose} canClose={!busy} blurTarget={blurTarget}>
    <FormField label={copy.onboarding.name} editable={!busy} value={name} onChangeText={setName} maxLength={40} />
    <BreedField species={pet.species} editable={!busy} value={breed} onChange={setBreed} />
    {error && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{error}</AppText>}
    <PillButton label={busy ? copy.homeCare.saving : copy.homeCare.save} disabled={busy} onPress={() => void save()} />
  </BottomSheet>;
}
export function DeleteSheet({ onClose, blurTarget, busy, onDelete }: SheetBase & { onDelete: () => Promise<boolean> }) {
  const { colors } = useTheme();
  const [error, setError] = useState(false);
  return <BottomSheet open title={copy.homeCare.deleteTitle} onClose={onClose} canClose={!busy} blurTarget={blurTarget}>
    <AppText>{copy.homeCare.deleteBody}</AppText>
    {error && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{copy.homeCare.saveError}</AppText>}
    <PillButton label={busy ? copy.homeCare.saving : copy.homeCare.delete} disabled={busy} onPress={() => { void onDelete().then(saved => { if (saved) onClose(); }, () => setError(true)); }} />
    <PillButton label={copy.homeCare.cancel} selected={false} disabled={busy} onPress={onClose} />
  </BottomSheet>;
}
export function ReminderSheet({ onClose, blurTarget }: Omit<SheetBase, 'busy'>) {
  const { status, busy, renewBy, limited } = useReminderState();
  return <BottomSheet open title={copy.reminders.title} onClose={onClose} canClose={!busy} blurTarget={blurTarget}>
    <AppText>{copy.reminders.body}</AppText><AppText muted accessibilityLiveRegion="polite">{copy.reminders[status]}</AppText>
    {status === 'enabled' && limited && <AppText>{copy.healthRecords.reminderLimit}</AppText>}
    {status === 'enabled' && renewBy && <AppText>{copy.healthRecords.reminderRenew(displayDate(renewBy))}</AppText>}
    {status !== 'unsupported' && <AppText variant="label" muted>{copy.healthRecords.appointmentTime}</AppText>}
    {status !== 'unsupported' && <PillButton label={busy ? copy.reminders.busy : status === 'enabled' ? copy.reminders.disable : copy.reminders.enable} disabled={busy} onPress={() => void toggleReminders(status !== 'enabled')} />}
    {status === 'denied' && <PillButton label={copy.reminders.settings} selected={false} onPress={() => { void Linking.openSettings().catch(() => {}); }} />}
    {status === 'failed' && <PillButton label={copy.reminders.retry} selected={false} onPress={() => void syncReminders()} />}
    {status !== 'unsupported' && <AppText variant="label" muted>{copy.reminders.approximate}</AppText>}
  </BottomSheet>;
}
const styles = StyleSheet.create({ choices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.md }, mood: { minWidth: tokens.size.emptyIllustration, padding: tokens.space.md, borderRadius: tokens.radius.icon, gap: tokens.space.sm } });
