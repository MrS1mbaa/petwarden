import { ScreenEntrance } from '../../components/ScreenEntrance';
import { memo, useRef, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { SoftSurface } from '../../components/SoftSurface';
import { PillButton } from '../../components/PillButton';
import { IconButton } from '../../components/IconButton';
import { PressScale } from '../../components/PressScale';
import { IntroMotion } from '../../components/IntroMotion';
import { PawBackground } from '../../components/PawBackground';
import { Skeleton } from '../../components/Skeleton';
import { accent, tokens, type Accent } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { copy, locale } from '../../lib/copy';
import { useLanguage } from '../../lib/language';
import { displayDate, localDate } from '../../lib/dates';
import { dateInput } from './model';
import { useHealth, type HealthCommand, type HealthRow, type HealthSection } from './useHealth';
import { HealthEditor } from './HealthEditor';
import { WeightChart } from './WeightChart';
import { AnimatedWeight } from './AnimatedWeight';
import { useReminderState } from '../../notifications/service';
import { ReminderSheet } from '../care/CareSheets';
import { router } from 'expo-router';

type Filter = 'all' | HealthSection['kind'] | 'notes';
const filters: Filter[] = ['all', 'weight', 'vaccine', 'visit', 'medication', 'notes'];
const sectionStyle: Record<HealthSection['kind'], { icon: IconName; tone: Accent }> = {
  weight: { icon: 'weight', tone: 'corgi' }, vaccine: { icon: 'syringe', tone: 'blush' }, visit: { icon: 'stethoscope', tone: 'blush' }, medication: { icon: 'pill', tone: 'sky' },
};
const signedKg = (value: number) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(value);

export function HealthScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const health = useHealth();
  useLanguage(state => state.language);
  const reminders = useReminderState();
  const blurTarget = useRef<View | null>(null);
  const [editor, setEditor] = useState<HealthCommand | null>(null);
  const [showReminders, setShowReminders] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const date = dateInput(localDate());
  if (!health.pet) return null;
  const add = (kind: HealthCommand['kind']) => {
    switch (kind) {
      case 'weight': setEditor({ kind, id: null, draft: { value: '', date } }); break;
      case 'vaccine': setEditor({ kind, id: null, draft: { name: '', givenAt: '', nextDueAt: '', notes: '' } }); break;
      case 'visit': setEditor({ kind, id: null, draft: { date, clinic: '', reason: '', notes: '' } }); break;
      case 'medication': setEditor({ kind, id: null, draft: { name: '', dose: '', times: '08:00', startDate: date, endDate: '' } }); break;
      case 'notes': setEditor({ kind, id: null, draft: health.data?.notes ?? { allergies: '', notes: '' } }); break;
    }
  };
  const weights = health.data?.weights ?? [];
  const latest = weights.at(-1), previous = weights.at(-2);
  const sections = health.sections.filter(section => filter === 'all' || filter === section.kind);
  const sectionTitle = (kind: HealthCommand['kind']) => <View style={styles.section}><AppText variant="section" bold accessibilityRole="header">{copy.healthRecords[kind]}</AppText><IconButton name="plus" label={copy.healthRecords.addFor(copy.healthRecords[kind])} onPress={() => add(kind)} /></View>;
  const header = <View>
    <IntroMotion><View style={styles.heading}><View style={styles.grow}><AppText variant="title" bold accessibilityRole="header">{copy.health.title}</AppText><AppText muted>{copy.healthRecords.subtitle(health.pet.name)}</AppText></View><IconButton name="bell" label={copy.reminders.bell} onPress={() => setShowReminders(true)} /></View></IntroMotion>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.filters} accessibilityLabel={copy.healthRecords.filter}>
      {filters.map(item => <PillButton key={item} toggle compact label={copy.healthRecords.filters[item]} selected={filter === item} onPress={() => setFilter(item)} />)}
    </ScrollView>
    {health.error ? <SoftSurface style={styles.card}><AppText accessibilityRole="alert" style={{ color: colors.error }}>{health.error}</AppText><PillButton label={copy.retry} onPress={() => void health.refresh()} /></SoftSurface> : !health.data ? <View style={styles.loading}><Skeleton /><Skeleton /><Skeleton /></View> : null}
  </View>;
  const showNotes = health.data && !health.error && (filter === 'all' || filter === 'notes');
  const footer = health.data && !health.error ? <View>
    {showNotes && <>{sectionTitle('notes')}<SoftSurface raised><PressScale accessibilityRole="button" accessibilityLabel={copy.healthRecords.notes} onPress={() => add('notes')} style={styles.notes}>
      <NoteLine icon="bone" tone="corgi" label={copy.healthRecords.allergies} value={health.data.notes.allergies || copy.healthRecords.noAllergies} />
      <NoteLine icon="note" tone="butter" label={copy.healthRecords.filters.notes} value={health.data.notes.notes || copy.healthRecords.noNotes} />
    </PressScale></SoftSurface></>}
    {filter === 'all' && <SoftSurface raised style={styles.documents}><PressScale accessibilityRole="button" accessibilityLabel={copy.documents.open} onPress={() => router.push('/documents')} style={styles.row}>
      <Tile icon="folder" tone="sky" /><View style={styles.grow}><AppText bold>{copy.documents.title}</AppText><AppText variant="label" muted>{copy.healthRecords.documentsDetail}</AppText></View><Icon name="chevronRight" color={colors.textSecondary} />
    </PressScale></SoftSurface>}
  </View> : null;
  return <View style={[styles.root, { backgroundColor: colors.bg }]}>
    <BlurTargetView ref={blurTarget} style={styles.root} accessibilityElementsHidden={editor !== null || showReminders} importantForAccessibility={editor || showReminders ? 'no-hide-descendants' : 'auto'} aria-hidden={editor !== null || showReminders}><ScreenEntrance style={styles.root}>
      <PawBackground />
      <SectionList sections={health.error ? [] : sections} keyExtractor={row => row.key} stickySectionHeadersEnabled={false} contentContainerStyle={[styles.page, { paddingTop: insets.top + tokens.space.xl, paddingBottom: insets.bottom + tokens.size.tabHeight + tokens.space.hero }]} showsVerticalScrollIndicator={false} ListHeaderComponent={header} ListFooterComponent={footer} renderItem={({ item, section }) => <RecordCard row={item} kind={section.kind} onEdit={setEditor} />} renderSectionHeader={({ section }) => <View>
        {sectionTitle(section.kind)}
        {section.kind === 'weight' && health.data && <SoftSurface raised style={styles.card}>
          <View style={styles.weightTop}>
            <View style={styles.grow}><AppText variant="label" muted style={styles.eyebrow}>{(latest ? displayDate(latest.date) : copy.healthRecords.weight).toUpperCase()}</AppText><AnimatedWeight value={latest?.valueKg ?? null} /></View>
            {latest && previous && latest.valueKg !== previous.valueKg && <View style={[styles.chip, { backgroundColor: colors.corgiSoft }]}><AppText variant="label" bold accessibilityLabel={copy.healthRecords.change(signedKg(latest.valueKg - previous.valueKg))} style={{ color: colors.corgiDeep }}>{`${signedKg(latest.valueKg - previous.valueKg)} kg`}</AppText></View>}
          </View>
          {weights.length ? <WeightChart records={weights} /> : <AppText muted>{copy.healthRecords.emptyWeight}</AppText>}
        </SoftSurface>}
        {section.kind === 'medication' && reminders.status === 'enabled' && <>{reminders.limited && <AppText style={styles.hint}>{copy.healthRecords.reminderLimit}</AppText>}{reminders.renewBy && <AppText style={styles.hint}>{copy.healthRecords.reminderRenew(displayDate(reminders.renewBy))}</AppText>}</>}
        {section.data.length === 0 && section.kind !== 'weight' && <SoftSurface style={styles.emptyCard}><AppText muted>{copy.healthRecords.empty}</AppText></SoftSurface>}
      </View>} />
    </ScreenEntrance></BlurTargetView>
    {showReminders && <ReminderSheet blurTarget={blurTarget} onClose={() => setShowReminders(false)} />}
    {editor && <HealthEditor command={editor} busy={health.saving} blurTarget={blurTarget} onClose={() => setEditor(null)} onSave={health.save} onDelete={() => health.remove(editor)} />}
  </View>;
}
function Tile({ icon, tone, onSoft = false }: { icon: IconName; tone: Accent; onSoft?: boolean }) {
  const { colors } = useTheme();
  const palette = accent(colors, tone);
  return <View style={[styles.tile, { backgroundColor: onSoft ? colors.surfaceRaised : palette.soft }]}><Icon name={icon} color={palette.deep} /></View>;
}
function NoteLine({ icon, tone, label, value }: { icon: IconName; tone: Accent; label: string; value: string }) {
  return <View style={styles.row}><Tile icon={icon} tone={tone} /><View style={styles.grow}><AppText variant="label" muted>{label}</AppText><AppText bold>{value}</AppText></View></View>;
}
const RecordCard = memo(function RecordCard({ row, kind, onEdit }: { row: HealthRow; kind: HealthSection['kind']; onEdit: (command: HealthCommand) => void }) {
  const { colors } = useTheme();
  const look = sectionStyle[kind];
  // Medication currently in use gets the full sky tint, like the mockup; everything else stays on white.
  const highlighted = kind === 'medication' && row.statusTone === 'sage';
  const status = row.statusTone ? accent(colors, row.statusTone) : null;
  return <View style={styles.record}><SoftSurface raised={!highlighted} color={highlighted ? colors.skySoft : undefined}><PressScale accessibilityRole="button" accessibilityLabel={copy.healthRecords.editRecord(row.title)} onPress={() => onEdit(row.command)} style={styles.recordBody}>
    <Tile icon={look.icon} tone={look.tone} onSoft={highlighted} />
    <View style={styles.grow}>
      <AppText bold>{row.title}</AppText>
      {row.status ? <View style={[styles.chip, { backgroundColor: highlighted ? colors.surfaceRaised : status?.soft ?? colors.surface }]}><AppText variant="label" bold style={{ color: status?.deep ?? colors.textSecondary }}>{row.status}</AppText></View> : null}
      <AppText variant="label" muted>{row.detail}</AppText>
      {row.notes ? <AppText variant="label">{row.notes}</AppText> : null}
    </View>
    <Icon name="chevronRight" color={colors.textSecondary} />
  </PressScale></SoftSurface></View>;
});
const styles = StyleSheet.create({
  root: { flex: 1 }, grow: { flex: 1 },
  page: { width: '100%', maxWidth: tokens.size.pageMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.space.xl },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space.md },
  bleed: { marginHorizontal: -tokens.space.xl, marginTop: tokens.space.lg },
  filters: { gap: tokens.space.sm, paddingHorizontal: tokens.space.xl, paddingVertical: tokens.space.sm },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: tokens.space.xl, marginBottom: tokens.space.md },
  card: { padding: tokens.space.xl, gap: tokens.space.md },
  weightTop: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space.md },
  eyebrow: { letterSpacing: 0.6 },
  chip: { borderRadius: tokens.radius.pill, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.xs, alignSelf: 'flex-start', marginVertical: tokens.space.xs },
  record: { paddingTop: tokens.space.md },
  recordBody: { padding: tokens.space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: tokens.space.md },
  tile: { width: tokens.home.careTile, height: tokens.home.careTile, borderRadius: tokens.home.careTileRadius, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: tokens.space.md },
  notes: { padding: tokens.space.xl, gap: tokens.space.lg, alignItems: 'stretch' },
  documents: { marginTop: tokens.space.xl, padding: tokens.space.lg },
  emptyCard: { padding: tokens.space.lg },
  hint: { marginBottom: tokens.space.sm },
  loading: { marginTop: tokens.space.xl },
});
