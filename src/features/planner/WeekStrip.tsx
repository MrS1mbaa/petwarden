import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { PressScale } from '../../components/PressScale';
import { SoftSurface } from '../../components/SoftSurface';
import { copy } from '../../lib/copy';
import { tokens, type Accent } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { calendarDate, dayLabel } from './model';

export function WeekStrip({ dates, selected, today, marks, onSelect }: { dates: string[]; selected: string; today: string; marks: Record<string, Accent[]>; onSelect: (date: string) => void }) {
  const { colors } = useTheme();
  // Bleeds to the screen edges so 48px days scroll instead of clipping on narrow phones.
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.row}>{dates.map(date => {
    const active = date === selected, value = calendarDate(date), isToday = date === today;
    const dots = marks[date] ?? [];
    return <View key={date} style={styles.cell}><SoftSurface raised={!active} color={active ? colors.ink : undefined} radius={tokens.radius.icon}>
      <PressScale accessibilityRole="button" accessibilityLabel={`${dayLabel(date)}${isToday ? `, ${copy.plannerCare.today}` : ''}`} accessibilityState={{ selected: active }} aria-pressed={active} onPress={() => onSelect(date)} style={styles.day}>
        <AppText variant="label" bold style={{ color: active ? colors.heroMuted : colors.textSecondary }}>{copy.plannerCare.weekdays[value.getDay()]}</AppText>
        <AppText variant="section" bold style={{ color: active ? colors.onInk : colors.textPrimary }}>{value.getDate()}</AppText>
        <View style={styles.dots}>{isToday ? <View style={[styles.today, { backgroundColor: colors.corgi }]} /> : dots.map(name => <View key={name} style={[styles.dot, { backgroundColor: colors[name] }]} />)}</View>
      </PressScale>
    </SoftSurface></View>;
  })}</ScrollView>;
}
const styles = StyleSheet.create({
  bleed: { marginHorizontal: -tokens.space.xl },
  row: { flexGrow: 1, justifyContent: 'space-between', gap: tokens.space.xs, paddingVertical: tokens.space.sm, paddingHorizontal: tokens.space.xl },
  cell: { width: tokens.planner.dayWidth },
  day: { minHeight: tokens.planner.dayHeight, borderRadius: tokens.radius.icon, paddingVertical: tokens.space.sm, gap: tokens.space.xs },
  dots: { flexDirection: 'row', gap: 2, height: tokens.size.progressDot, alignItems: 'center' },
  dot: { width: tokens.space.xs + 1, height: tokens.space.xs + 1, borderRadius: tokens.radius.pill },
  today: { width: tokens.size.progressDot, height: tokens.size.progressDot, borderRadius: tokens.radius.pill },
});
