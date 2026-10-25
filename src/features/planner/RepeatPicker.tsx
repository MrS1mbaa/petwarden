import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { PillButton } from '../../components/PillButton';
import { copy } from '../../lib/copy';
import { tokens } from '../../theme/theme';
import { repeatDays } from '../care/model';

const daysOfWeek = [1, 2, 3, 4, 5, 6, 0];
export function RepeatPicker({ rule, disabled, onChange }: { rule: string; disabled: boolean; onChange: (rule: string) => void }) {
  const mode = rule === 'daily' || rule === 'weekdays' ? rule : 'custom';
  let days: number[] = [];
  try { days = repeatDays(rule); } catch {}
  return <View style={styles.root}><AppText bold>{copy.plannerCare.repeat}</AppText><View style={styles.row}>
    {(['daily', 'weekdays', 'custom'] as const).map(item => <PillButton key={item} compact toggle selected={mode === item} disabled={disabled} label={item === 'daily' ? copy.plannerCare.daily : item === 'weekdays' ? copy.plannerCare.workdays : copy.plannerCare.custom} onPress={() => onChange(item === 'custom' ? JSON.stringify(days) : item)} />)}
  </View>{mode === 'custom' && <View style={styles.row}>{daysOfWeek.map(day => <PillButton key={day} compact toggle label={copy.plannerCare.dayNames[day]} selected={days.includes(day)} disabled={disabled} onPress={() => onChange(JSON.stringify(days.includes(day) ? days.filter(item => item !== day) : [...days, day].sort()))} />)}</View>}</View>;
}
const styles = StyleSheet.create({ root: { gap: tokens.space.sm }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm } });
