import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { IconButton } from '../../components/IconButton';
import { PawBackground } from '../../components/PawBackground';
import { SoftSurface } from '../../components/SoftSurface';
import { copy } from '../../lib/copy';
import { useLanguage } from '../../lib/language';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';

// Plain, scrollable text page shared by the privacy policy and the terms of use.
export function LegalScreen({ kind, onBack = () => router.replace('/profile') }: { kind: 'privacy' | 'terms'; onBack?: () => void }) {
  const { colors } = useTheme(), insets = useSafeAreaInsets();
  useLanguage(state => state.language);
  const page = copy.legal[kind];
  return <View style={[styles.root, { backgroundColor: colors.bg }]}>
    <PawBackground />
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + tokens.space.xl, paddingBottom: insets.bottom + tokens.space.hero }]}>
      <View style={styles.page}>
        <View style={styles.row}>
          <IconButton name="chevronLeft" label={copy.onboarding.back} onPress={onBack} />
          <AppText variant="section" bold accessibilityRole="header" style={styles.grow}>{page.title}</AppText>
        </View>
        <AppText variant="label" muted>{page.updated}</AppText>
        {page.sections.map(section => <SoftSurface key={section.h} raised style={styles.card}>
          <AppText bold accessibilityRole="header">{section.h}</AppText>
          <AppText muted>{section.p}</AppText>
        </SoftSurface>)}
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, grow: { flex: 1 },
  scroll: { paddingHorizontal: tokens.space.xl, alignItems: 'center' },
  page: { width: '100%', maxWidth: tokens.size.pageMaxWidth, gap: tokens.space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  card: { padding: tokens.space.xl, gap: tokens.space.sm },
});
