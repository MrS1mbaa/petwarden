import { useRef } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { maskTime } from '../../lib/dateInput';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { DateField } from '../../components/DateField';
import { FormField } from '../../components/FormField';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { LanguagePicker } from '../../components/LanguagePicker';
import { useLanguage } from '../../lib/language';
import { PillButton } from '../../components/PillButton';
import { speciesList } from '../../db/species';
import { BreedField } from './BreedField';
import { PressScale } from '../../components/PressScale';
import { ScreenEntrance } from '../../components/ScreenEntrance';
import { SoftSurface } from '../../components/SoftSurface';
import { copy } from '../../lib/copy';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { useOnboarding } from './useOnboarding';
import { parseBirthDate } from './validation';

export function OnboardingScreen() {
  const { colors } = useTheme();
  useLanguage(state => state.language);
  const insets = useSafeAreaInsets();
  const photoRef = useRef<View | null>(null);
  const { draft, updateDraft, step, busy, photoBusy, error, next, back, choosePhoto } = useOnboarding(photoRef);
  return <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.bg }]} behavior="padding">
    <View style={[styles.top, { paddingTop: insets.top + tokens.space.md }]}>
      <IconButton name="chevronLeft" label={copy.onboarding.back} disabled={busy || photoBusy} onPress={back} />
      <View style={styles.dots} accessible accessibilityRole="progressbar" accessibilityLabel={copy.onboarding.progress(step + 1)} accessibilityValue={{ min: 1, max: 3, now: step + 1 }}>
        {[0, 1, 2].map(index => <View key={index} style={[styles.dot, { backgroundColor: index <= step ? colors.corgi : colors.surface }]} />)}
      </View>
    </View>
    {step === 2 && draft.photoUri && <View style={styles.finalPhoto}><View ref={photoRef} collapsable={false} style={[styles.photo, styles.photoFrame, { backgroundColor: colors.surface, borderColor: colors.photoFrame }]}><Image source={{ uri: draft.photoUri }} contentFit="cover" accessibilityLabel={copy.petProfile.photo(draft.name)} style={styles.image} /></View></View>}
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
      <ScreenEntrance key={step} style={styles.content}>
        <View style={styles.heading}><AppText variant="label" bold style={[styles.eyebrow, { color: colors.corgiDeep }]}>{copy.onboarding.progress(step + 1).toUpperCase()}</AppText><AppText variant="title" bold accessibilityRole="header">{copy.onboarding.titles[step]}</AppText><AppText muted>{copy.onboarding.descriptions[step]}</AppText></View>
        {step === 0 && <>
          <View style={styles.language}><AppText bold>{copy.languageHint}</AppText><LanguagePicker disabled={busy || photoBusy} /></View>
          <FormField editable={!busy && !photoBusy} label={copy.onboarding.name} placeholder={copy.onboarding.nameHint} value={draft.name} onChangeText={name => updateDraft({ name })} maxLength={40} autoCapitalize="words" returnKeyType="next" />
          <AppText bold>{copy.onboarding.species}</AppText>
          <View style={styles.segments}>{speciesList.map(species => <PillButton compact key={species} disabled={busy || photoBusy} toggle label={copy.onboarding.speciesLabels[species]} selected={draft.species === species} onPress={() => updateDraft({ species, breed: species === draft.species ? draft.breed : '', walksEnabled: species === 'dog' })} />)}</View>
          <BreedField editable={!busy && !photoBusy} species={draft.species} placeholder={copy.onboarding.breedHint} value={draft.breed} onChange={breed => updateDraft({ breed })} />
        </>}
        {step === 1 && <>
          <PressScale disabled={busy || photoBusy} accessibilityRole="button" accessibilityLabel={draft.photoUri ? copy.onboarding.changePhoto : copy.onboarding.photo} onPress={() => void choosePhoto()} style={styles.photoAction}>
            <View><View style={[styles.framed, { backgroundColor: colors.photoFrame }]}><View style={[styles.photo, styles.bigPhoto, { backgroundColor: colors.corgiSoft }]}>{draft.photoUri ? <Image source={{ uri: draft.photoUri }} style={styles.image} contentFit="cover" /> : <Icon name="paw" size={tokens.size.touch} color={colors.corgiDeep} />}</View></View>
              <View style={[styles.badge, { backgroundColor: colors.ink, borderColor: colors.bg }]}><Icon name="camera" color={colors.onInk} /></View></View>
            <AppText bold style={{ color: colors.corgiDeep }}>{draft.photoUri ? copy.onboarding.changePhoto : copy.onboarding.photo}</AppText><AppText variant="label" muted>{copy.onboarding.photoHint}</AppText>
          </PressScale>
          {draft.photoUri && <PillButton label={copy.onboarding.removePhoto} disabled={busy || photoBusy} selected={false} onPress={() => updateDraft({ photoUri: null })} />}
          <DateField editable={!busy && !photoBusy} label={copy.onboarding.birthDate} value={draft.birthDate} onChange={birthDate => updateDraft({ birthDate })} validate={parseBirthDate} />
          <FormField editable={!busy && !photoBusy} label={copy.onboarding.weight} placeholder={copy.onboarding.weightHint} value={draft.weight} onChangeText={weight => updateDraft({ weight })} keyboardType="decimal-pad" maxLength={8} />
          <View style={[styles.tip, { backgroundColor: colors.sageSoft }]}><Icon name="paw" size={tokens.space.lg + 2} color={colors.sageDeep} /><AppText variant="label" bold style={[styles.grow, { color: colors.sageDeep }]}>{copy.onboarding.optional}</AppText></View>
        </>}
        {step === 2 && <>
          <SoftSurface raised style={styles.schedule}><View style={styles.scheduleContent}>
            <FormField onCard editable={!busy && !photoBusy} label={copy.care.morning} placeholder={copy.onboarding.timeHint} value={draft.morning} onChangeText={morning => updateDraft({ morning: maskTime(morning) })} keyboardType="number-pad" maxLength={5} />
            <FormField onCard editable={!busy && !photoBusy} label={copy.care.evening} placeholder={copy.onboarding.timeHint} value={draft.evening} onChangeText={evening => updateDraft({ evening: maskTime(evening) })} keyboardType="number-pad" maxLength={5} />
            <AppText variant="label" muted>{copy.onboarding.daily}</AppText>
          </View></SoftSurface>
          <PillButton disabled={busy || photoBusy} toggle label={draft.walksEnabled ? copy.onboarding.walksOn : copy.onboarding.walksOff} selected={draft.walksEnabled} onPress={() => updateDraft({ walksEnabled: !draft.walksEnabled })} />
          {draft.walksEnabled && <FormField editable={!busy && !photoBusy} label={copy.care.walk} placeholder={copy.onboarding.timeHint} value={draft.walk} onChangeText={walk => updateDraft({ walk: maskTime(walk) })} keyboardType="number-pad" maxLength={5} />}
          <AppText variant="label" muted>{copy.onboarding.private}</AppText>
        </>}
        {error && <AppText accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ color: colors.error }}>{error}</AppText>}
      </ScreenEntrance>
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: insets.bottom + tokens.space.lg, backgroundColor: colors.bg }]}>
      <View style={styles.cta}><PillButton primary label={busy ? copy.onboarding.saving : step === 2 ? copy.onboarding.finish : copy.onboarding.next} disabled={busy || photoBusy} onPress={() => void next()} /></View>
    </View>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, top: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.lg, paddingHorizontal: tokens.space.xl, paddingBottom: tokens.space.lg },
  dots: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: tokens.space.xs + 2 }, dot: { flex: 1, height: tokens.size.progressDot, borderRadius: tokens.radius.pill },
  scroll: { paddingHorizontal: tokens.space.xl, paddingBottom: tokens.space.xl, alignItems: 'center', flexGrow: 1 },
  content: { width: '100%', maxWidth: tokens.size.pageMaxWidth, gap: tokens.space.xl }, heading: { gap: tokens.space.md, marginBottom: tokens.space.sm },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  segments: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }, language: { gap: tokens.space.sm }, segment: { flex: 1 }, eyebrow: { letterSpacing: 0.6 }, grow: { flex: 1 },
  framed: { padding: tokens.home.heroPhotoFrame, borderRadius: tokens.radius.card }, bigPhoto: { width: tokens.size.photo + tokens.space.hero, height: tokens.size.photo + tokens.space.hero },
  badge: { position: 'absolute', right: -tokens.space.sm, bottom: -tokens.space.sm, width: tokens.size.touch, height: tokens.size.touch, borderRadius: tokens.radius.pill, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, borderRadius: tokens.radius.icon, padding: tokens.space.lg },
  cta: { width: '100%', maxWidth: tokens.size.pageMaxWidth },
  finalPhoto: { alignItems: 'center', paddingBottom: tokens.space.lg }, photoFrame: { borderWidth: tokens.home.heroPhotoFrame },
  photoAction: { gap: tokens.space.sm, alignSelf: 'center', alignItems: 'center' }, photo: { width: tokens.size.photo, height: tokens.size.photo, borderRadius: tokens.radius.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, image: { width: '100%', height: '100%' },
  schedule: { padding: tokens.space.xl }, scheduleContent: { gap: tokens.space.lg },
  footer: { paddingHorizontal: tokens.space.xl, paddingTop: tokens.space.md, alignItems: 'center' },
});

