import { RefreshPet } from '../../components/RefreshPet';
import { useLanguage } from '../../lib/language';
import { ScreenEntrance } from '../../components/ScreenEntrance';
import { EmptyPet } from '../../components/EmptyPet';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { PillButton } from '../../components/PillButton';
import { PressScale } from '../../components/PressScale';
import { SoftSurface } from '../../components/SoftSurface';
import { PawBackground } from '../../components/PawBackground';
import { IntroMotion } from '../../components/IntroMotion';
import { Skeleton } from '../../components/Skeleton';
import { accent, tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { useMotionPreference } from '../../lib/motion';
import { copy } from '../../lib/copy';
import { TaskRow } from '../care/TaskRow';
import { TaskSheet, DeleteSheet, ReminderSheet } from '../care/CareSheets';
import type { TodayTask } from '../../db/repositories/care';
import { usePlanner } from './usePlanner';
import { dayLabel, healthAccent, monthLabel, repeatLabel, timeline, type HealthEvent, type CalendarCommand, type DayPart } from './model';
import { WeekStrip } from './WeekStrip';
import { HealthEditor } from '../health/HealthEditor';
import { dateInput } from '../health/model';

type Sheet = { kind: 'task'; task: TodayTask | null } | { kind: 'delete'; task: TodayTask } | { kind: 'health'; command: CalendarCommand } | { kind: 'reminders' } | null;
const eventIcons = { vaccine: 'syringe', visit: 'stethoscope', medication: 'pill' } as const;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function PlannerScreen() {
  const planner = usePlanner(), { colors } = useTheme(), insets = useSafeAreaInsets();
  useLanguage(state => state.language);
  const blurTarget = useRef<View | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const edit = useCallback((task: TodayTask) => setSheet({ kind: 'task', task }), []);
  const remove = useCallback((task: TodayTask) => setSheet({ kind: 'delete', task }), []);
  const editHealth = useCallback((command: CalendarCommand) => setSheet({ kind: 'health', command }), []);
  const close = () => setSheet(null);
  if (!planner.pet) return null;
  const tasks = planner.data?.tasks ?? [];
  const done = tasks.filter(task => task.done).length;
  const addVisit = () => setSheet({ kind: 'health', command: { kind: 'visit', id: null, draft: { date: dateInput(planner.date), clinic: '', reason: '', notes: '' } } });
  const header = <View>{planner.refreshing && <RefreshPet />}
    <IntroMotion><View style={styles.heading}><View style={styles.grow}><AppText variant="title" bold accessibilityRole="header">{copy.planner.title}</AppText><AppText muted>{copy.plannerCare.subtitle(planner.pet.name)}</AppText></View><IconButton name="bell" label={copy.reminders.bell} onPress={() => setSheet({ kind: 'reminders' })} /></View></IntroMotion>
    <View style={styles.month}>
      <IconButton name="chevronLeft" label={copy.plannerCare.previous} onPress={() => planner.moveWeek(-1)} />
      <AppText variant="section" bold style={styles.monthLabel} accessibilityRole="header">{monthLabel(planner.date)}</AppText>
      <IconButton name="chevronRight" label={copy.plannerCare.next} onPress={() => planner.moveWeek(1)} />
      <PillButton compact label={copy.plannerCare.today} selected={planner.date !== planner.today} onPress={planner.goToday} />
    </View>
    <WeekStrip dates={planner.week} selected={planner.date} today={planner.today} marks={planner.marks} onSelect={planner.selectDate} />
    <SoftSurface raised style={styles.summary}>
      <View style={styles.summaryRow}>
        <View style={styles.grow}><AppText variant="section" bold>{capitalize(dayLabel(planner.date))}</AppText><AppText variant="label" muted>{tasks.length ? copy.plannerCare.progress(done, tasks.length) : copy.plannerCare.noTasks}</AppText></View>
        <PressScale accessibilityRole="button" accessibilityLabel={copy.plannerCare.addVisit} onPress={addVisit} style={[styles.visit, { backgroundColor: colors.blushSoft }]}><Icon name="stethoscope" size={tokens.space.lg + 2} color={colors.blushDeep} /><AppText variant="label" bold style={{ color: colors.blushDeep }}>{copy.plannerCare.addVisit}</AppText></PressScale>
      </View>
      {tasks.length > 0 && <DayProgress ratio={done / tasks.length} label={copy.plannerCare.summary(done, tasks.length)} />}
    </SoftSurface>
    {planner.checkDisabled && <AppText muted variant="label" style={styles.notice}>{copy.plannerCare.futureCheck}</AppText>}
    {planner.notice && <AppText accessibilityLiveRegion="polite" style={styles.notice}>{planner.notice}</AppText>}
  </View>;
  const empty = planner.error ? <SoftSurface style={styles.empty}><AppText accessibilityRole="alert" style={{ color: colors.error }}>{planner.error}</AppText><PillButton label={copy.retry} onPress={() => void planner.refresh()} /></SoftSurface> : !planner.data ? <View accessibilityLabel={copy.loading}><Skeleton /><Skeleton /><Skeleton /></View> : <SoftSurface style={styles.empty}><EmptyPet /><AppText bold>{copy.plannerCare.empty}</AppText><AppText muted>{copy.plannerCare.emptyDetail}</AppText><PillButton primary label={copy.homeCare.add} onPress={() => setSheet({ kind: 'task', task: null })} /><PillButton label={copy.health.title} selected={false} onPress={() => router.push('/health')} /></SoftSurface>;
  const items = planner.error ? [] : timeline(planner.data?.rows ?? []);
  return <View style={[styles.root, { backgroundColor: colors.bg }]}><BlurTargetView ref={blurTarget} style={styles.root} accessibilityElementsHidden={sheet !== null} importantForAccessibility={sheet ? 'no-hide-descendants' : 'auto'} aria-hidden={sheet !== null}><ScreenEntrance style={styles.root}>
    <PawBackground /><FlatList data={items} keyExtractor={item => item.key} contentContainerStyle={[styles.page, { paddingTop: insets.top + tokens.space.xl, paddingBottom: insets.bottom + tokens.size.tabHeight + tokens.space.hero + tokens.size.touch }]} showsVerticalScrollIndicator={false} ListHeaderComponent={header} ListEmptyComponent={empty} ItemSeparatorComponent={Gap} refreshControl={<RefreshControl refreshing={planner.refreshing} onRefresh={() => void planner.refresh()} tintColor={colors.textPrimary} accessibilityLabel={copy.plannerCare.refresh} />} renderItem={({ item, index }) => item.kind === 'part' ? <PartLabel part={item.part} /> : <IntroMotion key={`${planner.date}.${item.key}`} delay={tokens.motion.stagger * Math.min(index, tokens.planner.weekDays)}><View style={styles.timed}>
      <AppText variant="label" bold muted style={styles.gutter}>{item.kind === 'care' ? item.task.time : item.time ?? ''}</AppText>
      <View style={styles.grow}>{item.kind === 'care' ? <TaskRow task={item.task} subtitle={`${copy.homeCare.types[item.task.type]} · ${repeatLabel(item.task.repeatRule)}`} pending={planner.pending.includes(item.task.id)} checkDisabled={planner.checkDisabled} snoozeDisabled={planner.date !== planner.today} onCheck={planner.check} onEdit={edit} onDelete={remove} onSnooze={planner.snooze} celebrate={planner.celebration === item.task.id} onFinish={planner.finishCelebration} /> : <EventCard event={item} onEdit={editHealth} />}</View>
    </View></IntroMotion>} />
  </ScreenEntrance></BlurTargetView>
    <View pointerEvents="box-none" style={[styles.fab, { bottom: Math.max(insets.bottom, tokens.space.lg) + tokens.size.tabHeight + tokens.space.lg, right: Math.max(insets.right, tokens.space.xl) }]}>
      <SoftSurface color={colors.corgi} radius={tokens.radius.pill}><PressScale accessibilityRole="button" accessibilityLabel={copy.homeCare.add} onPress={() => setSheet({ kind: 'task', task: null })} style={styles.fabButton}><Icon name="plus" size={tokens.size.icon + 4} color={colors.onCorgi} /></PressScale></SoftSurface>
    </View>
    {sheet?.kind === 'task' && <TaskSheet key={sheet.task?.id ?? 'new'} task={sheet.task} blurTarget={blurTarget} onClose={close} busy={planner.saving} canSnooze={planner.date === planner.today} onSave={planner.saveTask} onDelete={() => { if (sheet.task) setSheet({ kind: 'delete', task: sheet.task }); }} onSnooze={() => { if (sheet.task) { void planner.snooze(sheet.task); close(); } }} />}
    {sheet?.kind === 'delete' && <DeleteSheet blurTarget={blurTarget} onClose={close} busy={planner.saving} onDelete={() => planner.removeTask(sheet.task)} />}
    {sheet?.kind === 'reminders' && <ReminderSheet blurTarget={blurTarget} onClose={close} />}
    {sheet?.kind === 'health' && <HealthEditor command={sheet.command} busy={planner.saving} blurTarget={blurTarget} onClose={close} onSave={command => command.kind === 'vaccine' || command.kind === 'visit' || command.kind === 'medication' ? planner.saveHealth(command) : Promise.resolve(false)} onDelete={() => planner.removeHealth(sheet.command)} />}
  </View>;
}
function DayProgress({ ratio, label }: { ratio: number; label: string }) {
  const { colors } = useTheme();
  const reduced = useMotionPreference();
  const progress = useSharedValue(reduced ? ratio : 0);
  useEffect(() => { progress.set(reduced ? ratio : withTiming(ratio, { duration: tokens.chart.drawDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System })); }, [progress, ratio, reduced]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={[styles.track, { backgroundColor: colors.corgiSoft }]}><Animated.View style={[styles.fill, { backgroundColor: colors.corgi }, fill]} /></View>;
}
function PartLabel({ part }: { part: DayPart }) {
  return <AppText variant="label" muted accessibilityRole="header" style={styles.part}>{copy.plannerCare.parts[part].toUpperCase()}</AppText>;
}
const EventCard = memo(function EventCard({ event, onEdit }: { event: HealthEvent; onEdit: (command: CalendarCommand) => void }) {
  const { colors } = useTheme();
  const tone = accent(colors, healthAccent[event.type]);
  return <SoftSurface color={tone.soft} radius={tokens.radius.icon}><PressScale accessibilityRole="button" accessibilityLabel={`${copy.plannerCare.openHealth}: ${event.title}`} onPress={() => onEdit(event.command)} style={styles.event}>
    <View style={[styles.eventTile, { backgroundColor: colors.surfaceRaised }]}><Icon name={eventIcons[event.type]} color={tone.deep} /></View>
    <View style={styles.grow}><AppText bold numberOfLines={2}>{event.title}</AppText>{event.detail ? <AppText variant="label" bold numberOfLines={1} style={{ color: tone.deep }}>{event.detail}</AppText> : null}</View>
    <View style={[styles.chip, { backgroundColor: colors.surfaceRaised }]}><AppText variant="label" bold style={{ color: tone.deep }}>{copy.plannerCare[event.type]}</AppText></View>
  </PressScale></SoftSurface>;
});
function Gap() { return <View style={styles.gap} />; }
const styles = StyleSheet.create({
  root: { flex: 1 }, grow: { flex: 1 },
  page: { width: '100%', maxWidth: tokens.size.pageMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.space.xl },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space.md },
  month: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, marginTop: tokens.space.xl },
  monthLabel: { flex: 1, textAlign: 'center' },
  summary: { padding: tokens.space.xl, gap: tokens.space.lg, marginTop: tokens.space.md, marginBottom: tokens.space.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  visit: { flexDirection: 'row', gap: tokens.space.xs, borderRadius: tokens.radius.pill, paddingHorizontal: tokens.space.md },
  track: { height: tokens.home.progressHeight, borderRadius: tokens.radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: tokens.radius.pill },
  notice: { marginTop: tokens.space.sm },
  part: { letterSpacing: 0.6, marginTop: tokens.space.lg },
  timed: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  gutter: { width: tokens.size.touch - tokens.space.sm },
  gap: { height: tokens.space.md },
  empty: { padding: tokens.space.xl, gap: tokens.space.md, marginTop: tokens.space.lg },
  event: { padding: tokens.space.md, flexDirection: 'row', gap: tokens.space.md, alignItems: 'center', justifyContent: 'flex-start' },
  eventTile: { width: tokens.home.careTile, height: tokens.home.careTile, borderRadius: tokens.home.careTileRadius, alignItems: 'center', justifyContent: 'center' },
  chip: { borderRadius: tokens.radius.pill, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.xs },
  fab: { position: 'absolute' },
  fabButton: { width: tokens.size.inputHeight, height: tokens.size.inputHeight, borderRadius: tokens.radius.pill },
});
