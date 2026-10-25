import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { PawBackground } from '../../components/PawBackground';
import { PillButton } from '../../components/PillButton';
import { SoftSurface } from '../../components/SoftSurface';
import { copy } from '../../lib/copy';
import { useLanguage } from '../../lib/language';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { LegalScreen } from './LegalScreen';
import { acceptTerms } from './terms';

// Shown before anything else until the current terms are accepted with an explicit tick.
export function TermsGate() {
  const { colors } = useTheme(), insets = useSafeAreaInsets();
  useLanguage(state => state.language);
  const [reading, setReading] = useState<'terms' | 'privacy' | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const gate = copy.legal.gate;
  if (reading) return <LegalScreen kind={reading} onBack={() => setReading(null)} />;
  const accept = () => {
    setBusy(true); setFailed(false);
    acceptTerms().catch(() => { setFailed(true); setBusy(false); });
  };
  return <View style={[styles.root, { backgroundColor: colors.bg }]}>
    <PawBackground />
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + tokens.space.xl, paddingBottom: insets.bottom + tokens.space.xl }]}>
      <View style={styles.page}>
        <AppText variant="title" bold accessibilityRole="header">{gate.title}</AppText>
        <AppText muted>{gate.intro}</AppText>
        <SoftSurface raised style={styles.card}>
          {gate.points.map(point => <View key={point} style={styles.point}>
            <AppText bold accessible={false}>•</AppText>
            <AppText style={styles.grow}>{point}</AppText>
          </View>)}
        </SoftSurface>
        <View style={styles.links}>
          <PillButton compact selected={false} label={gate.readTerms} onPress={() => setReading('terms')} />
          <PillButton compact selected={false} label={gate.readPrivacy} onPress={() => setReading('privacy')} />
        </View>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} aria-checked={checked} accessibilityLabel={gate.accept}
          onPress={() => setChecked(value => !value)} style={styles.checkRow} hitSlop={tokens.space.sm}>
          <View style={[styles.box, { borderColor: colors.textPrimary, backgroundColor: checked ? colors.ink : 'transparent' }]}>
            {checked && <AppText bold accessible={false} style={{ color: colors.onInk }}>✓</AppText>}
          </View>
          <AppText style={styles.grow}>{gate.accept}</AppText>
        </Pressable>
        {failed && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{gate.saveError}</AppText>}
        <View style={!checked || busy ? styles.disabled : undefined}>
          <PillButton primary label={gate.continue} disabled={!checked || busy} onPress={accept} />
        </View>
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, grow: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: tokens.space.xl, alignItems: 'center' },
  page: { width: '100%', maxWidth: tokens.size.pageMaxWidth, gap: tokens.space.lg },
  card: { padding: tokens.space.xl, gap: tokens.space.md },
  point: { flexDirection: 'row', gap: tokens.space.sm },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, minHeight: tokens.size.touch },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
});
