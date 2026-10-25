import { AnimatedWeight } from '../health/AnimatedWeight';
import { RefreshPet } from '../../components/RefreshPet';
import { ScreenEntrance } from '../../components/ScreenEntrance';
import { EmptyPet } from '../../components/EmptyPet';
import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { copy, locale } from '../../lib/copy';
import { useLanguage } from '../../lib/language';
import { useHomeCare } from './useHomeCare';
import { useReminderState } from '../../notifications/service';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { PetImage } from '../pets/PetImage';
import { IconButton } from '../../components/IconButton';
import { SoftSurface } from '../../components/SoftSurface';
import { PawBackground } from '../../components/PawBackground';
import { PressScale } from '../../components/PressScale';
import { IntroMotion } from '../../components/IntroMotion';
import { PillButton } from '../../components/PillButton';
import { Skeleton } from '../../components/Skeleton';
import { TaskRow } from './TaskRow';
import { moodEmoji } from './model';
import { CareProgress } from './CareProgress';
import { petAge } from '../pets/age';
import { DeleteSheet, IdentitySheet, MoodSheet, ReminderSheet, TaskSheet } from './CareSheets';
import type { TodayTask } from '../../db/repositories/care';
import { usePhotoTarget } from '../pets/usePhotoFrame';

const shortDate = (date: Date) => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' }).format(date);

type Sheet = { kind: 'mood' | 'identity' | 'reminders' } | { kind: 'task'; task: TodayTask | null } | { kind: 'delete'; task: TodayTask } | null;
export function HomeScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const home = useHomeCare();
  useLanguage(state => state.language);
  const photoRef = useRef<View | null>(null);
  const photoTarget = usePhotoTarget(home.pet?.id, photoRef);
  const reminderStatus = useReminderState(state => state.status);
  const blurTarget = useRef<View | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const edit = useCallback((task: TodayTask) => setSheet({ kind: 'task', task }), []);
  const remove = useCallback((task: TodayTask) => setSheet({ kind: 'delete', task }), []);
  const close = () => setSheet(null);
  if (!home.pet) return null;
  const pet = home.pet;
  const tasks = home.data?.tasks ?? [];
  const done = tasks.filter(task => task.done).length;
  const age = petAge(pet.birthDate, new Date());
  const facts = [age, home.data?.weight == null ? null : `${new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(home.data.weight)} ${copy.units.kg}`].filter((fact): fact is string => fact !== null);
  const header = <View>{home.refreshing && <RefreshPet />}
    <View style={styles.header}>
      <PressScale accessibilityRole="button" accessibilityLabel={copy.profile.title} onPress={() => router.push('/profile')}>
        <View style={[styles.avatar, { backgroundColor: colors.surface }]}><PetImage pet={pet} /></View>
      </PressScale>
      <View style={styles.greeting}><AppText variant="section" bold>{home.data?.owner ? copy.homeCare.greetingOwner(home.data.owner) : copy.homeCare.greeting}</AppText><AppText variant="label" muted>{copy.homeCare.today(pet.name)}</AppText></View>
      <IconButton name="bell" label={copy.reminders.bell} onPress={() => setSheet({ kind: 'reminders' })} />
    </View>
    <IntroMotion offset={-tokens.size.screenSlide} startWhen={photoTarget.measured} style={styles.heroEntrance}>
      <View style={[styles.hero, { backgroundColor: colors.hero }]}>
        <View ref={photoRef} onLayout={photoTarget.measure} collapsable={false} style={[styles.heroPhoto, { backgroundColor: colors.corgiSoft, borderColor: colors.photoFrame }]}><PressScale accessibilityRole="button" accessibilityLabel={copy.petProfile.photo(pet.name)} onPress={() => router.push('/profile')} style={styles.fill} containerStyle={styles.fill}>
          <PetImage pet={pet} iconSize={tokens.size.touch} iconColor={colors.textPrimary} style={{ opacity: photoTarget.transferring ? 0 : 1 }} />
        </PressScale></View>
        <View style={styles.heroText}>
          <View style={styles.name}><AppText variant="title" bold accessibilityRole="header" numberOfLines={1} style={[styles.petName, { color: colors.onHero }, width < tokens.home.compactBreakpoint && styles.compactName]}>{pet.name}</AppText><PressScale accessibilityRole="button" accessibilityLabel={copy.homeCare.editPet} onPress={() => setSheet({ kind: 'identity' })}><Icon name="edit" color={colors.heroMuted} /></PressScale></View>
          <AppText numberOfLines={1} style={{ color: colors.heroMuted }}>{pet.breed || copy.onboarding.speciesLabels[pet.species]}</AppText>
          {facts.length > 0 && <View style={styles.facts}>{facts.map(fact => <View key={fact} style={[styles.fact, { backgroundColor: colors.heroChip }]}><AppText variant="label" bold style={{ color: colors.heroMuted }}>{fact}</AppText></View>)}</View>}
        </View>
        <View style={styles.mood}><SoftSurface raised radius={tokens.radius.pill}><PressScale accessibilityRole="button" accessibilityLabel={copy.homeCare.mood} onPress={() => setSheet({ kind: 'mood' })} style={styles.moodButton}>
          <IntroMotion key={`${pet.id}.${home.data?.mood ?? ''}`} scaleFrom={tokens.splash.buttonScale}><View style={styles.moodContent}><View style={[styles.moodFace, { backgroundColor: colors.butterSoft }]}><AppText>{home.data?.mood ? moodEmoji[home.data.mood] : '🙂'}</AppText></View><AppText bold>{home.data?.mood ? copy.moods[home.data.mood] : copy.homeCare.mood}</AppText></View></IntroMotion><Icon name="bone" />
        </PressScale></SoftSurface></View>
      </View>
    </IntroMotion>
    {tasks.length > 0 && <IntroMotion delay={tokens.motion.stagger} style={styles.progress}><CareProgress done={done} total={tasks.length} /></IntroMotion>}
    <View style={styles.sectionHeader}><AppText variant="section" bold>{copy.homeCare.list}</AppText><IconButton name="plus" label={copy.homeCare.add} onPress={() => setSheet({ kind: 'task', task: null })} /></View>
    {(home.notice || reminderStatus === 'failed') && <AppText accessibilityLiveRegion="polite" style={styles.notice}>{home.notice || copy.reminders.failed}</AppText>}
  </View>;
  const footer = <View style={styles.wellnessSection}>
    <View style={styles.wellnessHeader}><AppText variant="section" bold style={styles.sectionText}>{copy.homeCare.wellness(pet.name)}</AppText><IconButton name="edit" label={copy.homeCare.editHealth} onPress={() => router.push('/health')} /></View>
    <IntroMotion delay={tokens.motion.stagger * 4} style={styles.wellnessRow}>
      <View style={styles.wellnessCell}><SoftSurface raised><PressScale accessibilityRole="button" accessibilityLabel={copy.homeCare.weight} onPress={() => router.push('/health')} style={styles.wellnessCard}>
        <View style={[styles.statTile, { backgroundColor: colors.corgiSoft }]}><Icon name="weight" color={colors.corgiDeep} /></View><View style={styles.wellnessText}><AnimatedWeight compact value={home.data?.weight ?? null} /><AppText variant="label" bold>{home.data?.weight == null ? copy.homeCare.noWeight : copy.homeCare.weight}</AppText></View>
      </PressScale></SoftSurface></View>
      <View style={styles.wellnessCell}><SoftSurface color={colors.blushSoft}><PressScale accessibilityRole="button" accessibilityLabel={copy.homeCare.vet} onPress={() => router.push('/health')} style={styles.wellnessCard}>
        <View style={[styles.statTile, { backgroundColor: colors.surfaceRaised }]}><Icon name="stethoscope" color={colors.blushDeep} /></View><View style={styles.wellnessText}><AppText bold style={styles.value}>{home.data?.vetDate ? shortDate(new Date(`${home.data.vetDate}T12:00:00`)).toUpperCase() : copy.missingValue}</AppText><AppText variant="label" bold numberOfLines={1} style={{ color: colors.blushDeep }}>{home.data?.vetDate ? home.data.vetReason || copy.homeCare.vet : copy.homeCare.noVet}</AppText></View>
      </PressScale></SoftSurface></View>
    </IntroMotion>
  </View>;
  const empty = home.loading ? <View accessibilityLabel={copy.loading}><Skeleton /><Skeleton /><Skeleton /></View> : home.error ? <View style={styles.empty}><AppText accessibilityRole="alert" style={{ color: colors.error }}>{home.error}</AppText><PillButton label={copy.retry} onPress={() => void home.refresh()} /></View> : <SoftSurface style={styles.empty}><EmptyPet /><AppText bold>{copy.homeCare.empty}</AppText><AppText muted>{copy.homeCare.emptyDetail}</AppText><PillButton primary label={copy.homeCare.add} onPress={() => setSheet({ kind: 'task', task: null })} /></SoftSurface>;
  return <View style={[styles.root, { backgroundColor: colors.bg }]}>
    <BlurTargetView ref={blurTarget} style={styles.root} importantForAccessibility={sheet ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={sheet !== null} aria-hidden={sheet !== null}><ScreenEntrance style={styles.root} offsetFrom={photoTarget.transferring ? 0 : tokens.size.screenSlide}>
      <PawBackground />
      <FlatList data={home.data?.tasks ?? []} keyExtractor={item => String(item.id)} contentContainerStyle={[styles.list, { paddingTop: insets.top + tokens.space.xl, paddingBottom: insets.bottom + tokens.size.tabHeight + tokens.space.hero }]} showsVerticalScrollIndicator={false} ListHeaderComponent={header} ListFooterComponent={footer} ListEmptyComponent={empty} ItemSeparatorComponent={TaskGap} refreshControl={<RefreshControl refreshing={home.refreshing} onRefresh={() => void home.refresh()} tintColor={colors.textPrimary} accessibilityLabel={copy.homeCare.refresh} />} renderItem={({ item, index }) => <IntroMotion delay={tokens.motion.stagger * (index + 1)}><TaskRow task={item} pending={home.pending.includes(item.id)} onCheck={home.check} onEdit={edit} onDelete={remove} onSnooze={home.snooze} celebrate={home.celebration === item.id} onFinish={home.finishCelebration} /></IntroMotion>} />
    </ScreenEntrance></BlurTargetView>
    {sheet?.kind === 'mood' && <MoodSheet onClose={close} blurTarget={blurTarget} busy={home.saving} mood={home.data?.mood ?? null} onSelect={home.changeMood} />}
    {sheet?.kind === 'task' && <TaskSheet onClose={close} blurTarget={blurTarget} busy={home.saving} task={sheet.task} onSave={home.saveTask} onDelete={() => { if (sheet.task) setSheet({ kind: 'delete', task: sheet.task }); }} onSnooze={() => { if (sheet.task) { void home.snooze(sheet.task); close(); } }} />}
    {sheet?.kind === 'identity' && <IdentitySheet onClose={close} blurTarget={blurTarget} busy={home.saving} pet={pet} onSave={home.rename} />}
    {sheet?.kind === 'delete' && <DeleteSheet onClose={close} blurTarget={blurTarget} busy={home.saving} onDelete={() => home.removeTask(sheet.task)} />}
    {sheet?.kind === 'reminders' && <ReminderSheet onClose={close} blurTarget={blurTarget} />}
  </View>;
}
function TaskGap() { return <View style={styles.taskGap} />; }
const styles = StyleSheet.create({ root: { flex: 1 }, list: { width: '100%', maxWidth: tokens.size.pageMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.space.xl }, header: { flexDirection: 'row', gap: tokens.space.md, alignItems: 'center' }, avatar: { width: tokens.home.avatar, height: tokens.home.avatar, borderRadius: tokens.radius.pill, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }, fill: { width: '100%', height: '100%' }, greeting: { flex: 1 }, heroEntrance: { marginTop: tokens.home.heroTopGap }, hero: { minHeight: tokens.home.heroHeight, borderRadius: tokens.radius.card, paddingTop: tokens.space.lg, paddingBottom: tokens.space.xl, paddingRight: tokens.space.md }, heroPhoto: { position: 'absolute', left: tokens.home.heroPhotoInset, top: tokens.home.heroPhotoTop, width: tokens.home.heroPhoto, height: tokens.home.heroPhoto, borderWidth: tokens.home.heroPhotoFrame, borderRadius: tokens.radius.card, overflow: 'hidden' }, heroText: { marginLeft: tokens.home.heroTextLeft, gap: tokens.space.xs, minHeight: tokens.home.heroPhoto + tokens.home.heroPhotoTop + tokens.space.sm }, facts: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm, marginTop: tokens.space.xs }, fact: { borderRadius: tokens.radius.pill, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.xs }, moodContent: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm }, moodFace: { width: tokens.space.xxl, height: tokens.space.xxl, borderRadius: tokens.radius.pill, alignItems: 'center', justifyContent: 'center' }, progress: { marginTop: tokens.home.heroTopGap }, statTile: { width: tokens.home.careTile, height: tokens.home.careTile, borderRadius: tokens.home.careTileRadius, alignItems: 'center', justifyContent: 'center' }, name: { flexDirection: 'row', alignItems: 'center' }, petName: { flex: 1 }, compactName: { fontSize: tokens.home.compactNameSize, lineHeight: tokens.home.compactNameLineHeight }, mood: { marginTop: tokens.space.md, marginLeft: tokens.home.heroPhotoInset }, moodButton: { paddingHorizontal: tokens.space.lg, gap: tokens.space.md, flexDirection: 'row', justifyContent: 'space-between' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.space.xl, marginBottom: tokens.space.md }, notice: { marginBottom: tokens.space.md }, taskGap: { height: tokens.space.md }, wellnessSection: { marginTop: tokens.space.lg }, wellnessHeader: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, marginBottom: tokens.space.md }, sectionText: { flex: 1 }, wellnessRow: { flexDirection: 'row', gap: tokens.space.lg }, wellnessCell: { flex: 1 }, wellnessText: { width: '100%' }, wellnessCard: { minHeight: tokens.home.wellnessHeight, padding: tokens.space.lg, alignItems: 'flex-start', justifyContent: 'space-between' }, value: { fontSize: tokens.home.wellnessValue, lineHeight: tokens.home.wellnessLineHeight }, empty: { padding: tokens.space.xl, gap: tokens.space.md } });
