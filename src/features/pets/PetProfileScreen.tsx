import { useRef, useState, type ReactNode, type RefObject } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { Icon, type IconName } from '../../components/Icon';
import { PillButton } from '../../components/PillButton';
import { PressScale } from '../../components/PressScale';
import { PawBackground } from '../../components/PawBackground';
import { ScreenEntrance } from '../../components/ScreenEntrance';
import { SoftSurface } from '../../components/SoftSurface';
import { copy, locale } from '../../lib/copy';
import { displayDate } from '../../lib/dates';
import { accent, tokens, type Accent } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { useReminderState } from '../../notifications/service';
import type { Pet } from '../../db/schema';
import { usePetProfile } from './usePetProfile';
import { useProfileSettings } from './useProfileSettings';
import { ProfileEditor } from './ProfileEditor';
import { PetImage } from './PetImage';
import { FormField } from '../../components/FormField';
import { ReminderSheet } from '../care/CareSheets';
import { petAge } from './age';
import { LanguagePicker } from '../../components/LanguagePicker';
import { useLanguage } from '../../lib/language';

const kilograms = (value: number) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(value);
type Sheet = 'editor' | 'reminders' | 'owner' | 'delete' | null;

export function PetProfileScreen() {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { pet, weight, loading, error, retry } = usePetProfile();
  const settings = useProfileSettings();
  const reminderStatus = useReminderState(state => state.status);
  useLanguage(state => state.language);
  const blurTarget = useRef<View | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  if (!pet) return null;
  const open = sheet !== null;
  const stats: { value: string; label: string; tone: Accent }[] = [
    { value: petAge(pet.birthDate, new Date()) ?? copy.missingValue, label: copy.profileSettings.age, tone: 'butter' },
    { value: weight === null ? copy.missingValue : kilograms(weight), label: copy.units.kg, tone: 'corgi' },
    { value: copy.onboarding.speciesLabels[pet.species], label: copy.petProfile.species, tone: 'sky' },
  ];
  const details = [
    { title: copy.petProfile.breed, value: pet.breed || copy.petProfile.unknownBreed },
    { title: copy.petProfile.birth, value: displayDate(pet.birthDate) },
    { title: copy.petProfile.weight, value: weight === null ? copy.missingValue : `${kilograms(weight)} ${copy.units.kg}` },
  ];
  return <View style={[styles.root, { backgroundColor: colors.bg }]}><BlurTargetView ref={blurTarget} style={styles.root} accessibilityElementsHidden={open} importantForAccessibility={open ? 'no-hide-descendants' : 'auto'} aria-hidden={open}>
    <PawBackground />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingTop: insets.top + tokens.space.xl, paddingBottom: insets.bottom + tokens.size.tabHeight + tokens.space.hero }]}>
      <ScreenEntrance style={styles.content}>
        <AppText variant="title" bold accessibilityRole="header">{copy.profile.title}</AppText>
        <PetSwitcher pets={settings.pets} activeId={pet.id} busy={settings.busy} onSelect={id => { void settings.switchPet(id).catch(() => {}); }} onAdd={settings.addPet} />
        <View style={styles.identity}>
          <View style={[styles.frame, { backgroundColor: colors.photoFrame }]}><View style={[styles.photo, { backgroundColor: colors.corgiSoft }]}><PetImage pet={pet} label={copy.petProfile.photo(pet.name)} iconSize={tokens.size.touch} iconColor={colors.corgiDeep} /></View></View>
          <AppText variant="title" bold accessibilityRole="header" style={styles.center}>{pet.name}</AppText>
          <AppText muted style={styles.center}>{pet.breed || copy.onboarding.speciesLabels[pet.species]}</AppText>
          <PillButton label={copy.profileSettings.edit} disabled={settings.busy} onPress={() => setSheet('editor')} />
        </View>
        <View style={styles.stats}>{stats.map(stat => <View key={stat.label} accessible accessibilityLabel={`${stat.label}: ${stat.value}`} style={[styles.stat, { backgroundColor: colors[`${stat.tone}Soft`] }]}><AppText variant="section" bold numberOfLines={1} adjustsFontSizeToFit>{stat.value}</AppText><AppText variant="label" muted numberOfLines={1} adjustsFontSizeToFit>{stat.label}</AppText></View>)}</View>
        <SoftSurface raised style={styles.details}>
          <AppText variant="section" bold>{copy.petProfile.details}</AppText>
          {details.map(row => <View key={row.title} style={[styles.detail, { borderTopColor: colors.surface }]}><AppText muted>{row.title}</AppText><AppText bold numberOfLines={2} style={styles.detailValue}>{row.value}</AppText></View>)}
          {loading && <ActivityIndicator color={colors.textPrimary} accessibilityLabel={copy.loading} />}
          {error && <><AppText accessibilityRole="alert" style={{ color: colors.error }}>{copy.databaseError}</AppText><PillButton label={copy.retry} onPress={retry} /></>}
        </SoftSurface>
        <View style={styles.group}>
          <AppText variant="label" muted accessibilityRole="header" style={styles.eyebrow}>{copy.profileSettings.settings.toUpperCase()}</AppText>
          <SoftSurface raised style={styles.settings}>
            <SettingRow icon="user" tone="corgi" title={copy.profileSettings.owner} value={settings.owner || copy.missingValue} onPress={() => setSheet('owner')} disabled={settings.busy} />
            <SettingRow icon="bell" tone="sage" title={copy.profileSettings.reminders} value={copy.profileSettings.reminderState[reminderStatus]} onPress={() => setSheet('reminders')} disabled={settings.busy} />
            <SettingRow icon="note" tone="sky" title={copy.language}><LanguagePicker onCard disabled={settings.busy} /></SettingRow>
            <SettingRow icon="sun" tone="butter" title={copy.theme}>
              <View accessibilityRole="radiogroup" style={[styles.segments, { backgroundColor: colors.surface }]}>{(['system', 'light', 'dark'] as const).map(choice => {
                const selected = mode === choice;
                return <PressScale key={choice} containerStyle={styles.segmentSlot} accessibilityRole="radio" accessibilityLabel={copy.themes[choice]} accessibilityState={{ selected, disabled: settings.busy }} aria-checked={selected} disabled={settings.busy} onPress={() => { void settings.changeTheme(choice).catch(() => {}); }} style={[styles.segment, selected && { backgroundColor: colors.ink }]}><AppText variant="label" bold numberOfLines={1} adjustsFontSizeToFit style={{ color: selected ? colors.onInk : colors.textSecondary, textAlign: 'center' }}>{copy.themes[choice]}</AppText></PressScale>;
              })}</View>
            </SettingRow>
            <SettingRow icon="download" tone="sky" title={settings.busy ? copy.profileSettings.exporting : copy.profileSettings.export} onPress={() => { void settings.exportBackup().catch(() => {}); }} disabled={settings.busy} />
            <SettingRow icon="upload" tone="sky" title={settings.busy ? copy.profileSettings.importing : copy.profileSettings.import} onPress={() => { void settings.importBackup().catch(() => {}); }} disabled={settings.busy} />
            <SettingRow icon="paw" tone="corgi" title={copy.profileSettings.about} value={copy.profileSettings.version} />
            <SettingRow icon="note" tone="sage" title={copy.profileSettings.privacy} onPress={() => router.push('/privacy')} />
            <SettingRow icon="note" tone="butter" title={copy.profileSettings.terms} onPress={() => router.push('/terms')} last />
          </SoftSurface>
          {settings.notice && <AppText accessibilityLiveRegion="polite">{settings.notice}</AppText>}
        </View>
        <PillButton label={copy.profileSettings.deletePet} selected={false} disabled={settings.busy} onPress={() => setSheet('delete')} />
        <AppText variant="label" muted style={styles.center}>{copy.profileSettings.aboutBody}</AppText>
        <AppText variant="label" bold muted style={styles.center}>{copy.onboarding.private}</AppText>
      </ScreenEntrance>
    </ScrollView></BlurTargetView>
    {sheet === 'editor' && <ProfileEditor key={pet.id} pet={pet} busy={settings.busy} blurTarget={blurTarget} onClose={() => setSheet(null)} onSave={settings.saveDetails} />}
    {sheet === 'reminders' && <ReminderSheet blurTarget={blurTarget} onClose={() => setSheet(null)} />}
    {sheet === 'delete' && <BottomSheet open title={copy.profileSettings.deletePetTitle(pet.name)} onClose={() => setSheet(null)} canClose={!settings.busy} blurTarget={blurTarget}>
      <AppText>{copy.profileSettings.deletePetBody}</AppText>
      <PillButton label={settings.busy ? copy.homeCare.saving : copy.homeCare.delete} disabled={settings.busy} onPress={() => { void settings.removePet().then(() => setSheet(null), () => {}); }} />
      <PillButton label={copy.homeCare.cancel} selected={false} disabled={settings.busy} onPress={() => setSheet(null)} />
    </BottomSheet>}
    {sheet === 'owner' && <OwnerSheet initial={settings.owner} busy={settings.busy} blurTarget={blurTarget} onClose={() => setSheet(null)} onSave={settings.saveOwner} />}
  </View>;
}
function PetSwitcher({ pets, activeId, busy, onSelect, onAdd }: { pets: Pet[]; activeId: number; busy: boolean; onSelect: (id: number) => void; onAdd: () => void }) {
  const { colors } = useTheme();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.switcher} accessibilityLabel={copy.profileSettings.pets}>
    {pets.map(item => {
      const selected = item.id === activeId;
      return <PressScale key={item.id} accessibilityRole="button" accessibilityLabel={selected ? copy.profileSettings.selectedPet(item.name) : copy.profileSettings.switchTo(item.name)} accessibilityState={{ selected, disabled: busy }} disabled={busy || selected} onPress={() => onSelect(item.id)} style={styles.switch}>
        <View style={[styles.ring, { borderColor: selected ? colors.corgi : 'transparent' }]}><View style={[styles.avatar, { backgroundColor: colors.corgiSoft, borderColor: colors.photoFrame }]}><PetImage pet={item} iconColor={colors.corgiDeep} /></View></View>
        <AppText variant="label" bold={selected} muted={!selected} numberOfLines={1} style={styles.switchName}>{item.name}</AppText>
      </PressScale>;
    })}
    <PressScale accessibilityRole="button" accessibilityLabel={copy.profileSettings.addPet} disabled={busy} onPress={onAdd} style={styles.switch}>
      <View style={[styles.add, { borderColor: colors.textMuted }]}><Icon name="plus" color={colors.textSecondary} /></View>
      <AppText variant="label" muted numberOfLines={1} style={styles.switchName}>{copy.profileSettings.addShort}</AppText>
    </PressScale>
  </ScrollView>;
}
function SettingRow({ icon, tone, title, value, detail, onPress, disabled = false, last = false, children }: { icon: IconName; tone: Accent; title: string; value?: string; detail?: string; onPress?: () => void; disabled?: boolean; last?: boolean; children?: ReactNode }) {
  const { colors } = useTheme();
  const palette = accent(colors, tone);
  const body = <>
    <View style={[styles.tile, { backgroundColor: palette.soft }]}><Icon name={icon} color={palette.deep} /></View>
    <View style={styles.grow}><AppText bold>{title}</AppText>{detail ? <AppText variant="label" muted>{detail}</AppText> : null}</View>
    {value ? <AppText muted numberOfLines={1} style={styles.value}>{value}</AppText> : null}
    {onPress && <Icon name="chevronRight" color={colors.textSecondary} />}
  </>;
  const divider = !last && { borderBottomColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth * 2 };
  // A control (like the theme switch) sits under its label so it gets the full card width.
  if (children) return <View style={[styles.stacked, divider]}><View style={styles.setting}>{body}</View>{children}</View>;
  return onPress ? <PressScale accessibilityRole="button" accessibilityLabel={value ? `${title}: ${value}` : title} disabled={disabled} onPress={onPress} style={[styles.setting, divider]}>{body}</PressScale> : <View style={[styles.setting, divider]}>{body}</View>;
}
function OwnerSheet({ initial, busy, blurTarget, onClose, onSave }: { initial: string; busy: boolean; blurTarget: RefObject<View | null>; onClose: () => void; onSave: (name: string) => Promise<boolean> }) {
  const [name, setName] = useState(initial);
  return <BottomSheet open title={copy.profileSettings.owner} onClose={onClose} canClose={!busy} blurTarget={blurTarget}>
    <FormField label={copy.profileSettings.owner} placeholder={copy.profileSettings.ownerHint} value={name} onChangeText={setName} maxLength={40} editable={!busy} autoFocus />
    <PillButton primary label={busy ? copy.homeCare.saving : copy.homeCare.save} disabled={busy} onPress={() => { void onSave(name).then(saved => { if (saved) onClose(); }, () => {}); }} />
  </BottomSheet>;
}
const avatar = tokens.size.touch + tokens.space.sm;
const styles = StyleSheet.create({
  root: { flex: 1 }, grow: { flex: 1 }, fill: { width: '100%', height: '100%' }, center: { textAlign: 'center' },
  scroll: { paddingHorizontal: tokens.space.xl, alignItems: 'center', flexGrow: 1 },
  content: { width: '100%', maxWidth: tokens.size.pageMaxWidth, gap: tokens.space.xl },
  bleed: { marginHorizontal: -tokens.space.xl },
  switcher: { paddingHorizontal: tokens.space.xl, gap: tokens.space.md },
  switch: { width: avatar + tokens.space.lg, gap: tokens.space.xs },
  ring: { width: avatar + tokens.space.sm, height: avatar + tokens.space.sm, borderRadius: tokens.radius.pill, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: avatar - 2, height: avatar - 2, borderRadius: tokens.radius.pill, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  add: { width: avatar + tokens.space.sm, height: avatar + tokens.space.sm, borderRadius: tokens.radius.pill, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  switchName: { textAlign: 'center', maxWidth: avatar + tokens.space.lg },
  identity: { alignItems: 'center', gap: tokens.space.sm },
  frame: { padding: tokens.home.heroPhotoFrame, borderRadius: tokens.radius.card, marginBottom: tokens.space.sm },
  photo: { width: tokens.size.photo + tokens.space.lg, height: tokens.size.photo + tokens.space.lg, borderRadius: tokens.radius.card - tokens.home.heroPhotoFrame, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: tokens.space.md },
  stat: { flex: 1, borderRadius: tokens.radius.icon, padding: tokens.space.md, alignItems: 'center', gap: tokens.space.xs },
  details: { padding: tokens.space.xl, gap: tokens.space.md },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: tokens.space.lg, paddingTop: tokens.space.md, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  detailValue: { flex: 1, textAlign: 'right' },
  group: { gap: tokens.space.sm }, eyebrow: { letterSpacing: 0.6 },
  settings: { paddingHorizontal: tokens.space.lg },
  setting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: tokens.space.md, paddingVertical: tokens.space.md, minHeight: tokens.size.touch + tokens.space.lg },
  tile: { width: tokens.size.touch - tokens.space.sm, height: tokens.size.touch - tokens.space.sm, borderRadius: tokens.home.careTileRadius, alignItems: 'center', justifyContent: 'center' },
  value: { maxWidth: '40%' },
  segments: { flexDirection: 'row', borderRadius: tokens.radius.pill, padding: tokens.space.xs },
  segment: { flex: 1, borderRadius: tokens.radius.pill, paddingHorizontal: tokens.space.sm },
  segmentSlot: { flex: 1 },
  stacked: { paddingBottom: tokens.space.md },
});
