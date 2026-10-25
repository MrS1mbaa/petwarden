import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useLanguage } from '../../lib/language';
import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { IntroMotion } from '../../components/IntroMotion';
import { PawBackground } from '../../components/PawBackground';
import { PressScale } from '../../components/PressScale';
import { SoftSurface } from '../../components/SoftSurface';
import { accent, tokens, type Accent } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { copy } from '../../lib/copy';
import { usePetStore } from './store';

const chips: { key: keyof typeof copy.welcome.chips; icon: IconName; tone: Accent; side: 'left' | 'right' }[] = [
  { key: 'meals', icon: 'bone', tone: 'corgi', side: 'left' },
  { key: 'walks', icon: 'paw', tone: 'sage', side: 'right' },
  { key: 'vet', icon: 'stethoscope', tone: 'blush', side: 'left' },
];

function LetterRow({ text, size, start, color }: { text: string; size: number; start: number; color: string }) {
  return <View style={styles.letters} accessible accessibilityLabel={text}>
    {text.split('').map((letter, index) => <IntroMotion key={index} delay={(start + index) * tokens.splash.letterDelay}>
      <AppText bold accessible={false} style={{ fontSize: size, lineHeight: size * tokens.splash.titleLineHeight, color, letterSpacing: tokens.splash.titleTracking }}>{letter}</AppText>
    </IntroMotion>)}
  </View>;
}
export function WelcomeScreen() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const count = usePetStore(state => state.pets.length);
  useLanguage(state => state.language);
  const pageWidth = Math.min(width, tokens.size.pageMaxWidth);
  if (count > 0) return <Redirect href="/" />;
  const dogBottom = insets.bottom + tokens.splash.dogBottom;
  return <View style={[styles.screen, { backgroundColor: colors.bg }]}>
    <View style={[styles.stage, { width: pageWidth }]}>
      <View style={[styles.glow, { width: pageWidth * tokens.splash.glowOuter, height: pageWidth * tokens.splash.glowOuter, bottom: dogBottom - tokens.splash.glowBottom, backgroundColor: colors.corgiSoft }]} />
      <View style={[styles.glow, { width: pageWidth * tokens.splash.glowInner, height: pageWidth * tokens.splash.glowInner, bottom: dogBottom + tokens.space.xl, backgroundColor: colors.corgi, opacity: 0.18 }]} />
      <PawBackground />
      <View style={[styles.brand, { top: insets.top + tokens.space.lg }]} accessible accessibilityLabel={copy.welcome.logo}>
        <Image source={require('../../../assets/brand/app-icon.png')} contentFit="contain" style={styles.logo} />
        <AppText bold style={styles.wordmark}>{copy.appName.toUpperCase()}</AppText>
      </View>
      <View style={[styles.title, { top: insets.top + tokens.size.touch + tokens.space.xl + height * tokens.splash.titleTopRatio }]}>
        <LetterRow text={copy.welcome.firstLine} size={fit(copy.welcome.firstLine, pageWidth, tokens.splash.firstLineScale)} start={0} color={colors.textPrimary} />
        <LetterRow text={copy.welcome.secondLine} size={fit(copy.welcome.secondLine, pageWidth, tokens.splash.titleScale)} start={copy.welcome.firstLine.length} color={colors.corgi} />
      </View>
      <IntroMotion delay={tokens.splash.dogDelay} offset={tokens.splash.dogEnterOffset} style={[styles.dog, { bottom: dogBottom, height: height * tokens.splash.dogHeightRatio, width: pageWidth * tokens.splash.dogWidthRatio }]}>
        <Image source={require('../../../assets/illustrations/dog-corgi.webp')} contentFit="contain" contentPosition="bottom" accessibilityLabel={copy.welcome.dogLabel} style={styles.image} />
      </IntroMotion>
      {chips.map((chip, index) => {
        const palette = accent(colors, chip.tone);
        return <IntroMotion key={chip.key} delay={tokens.splash.buttonDelay - tokens.motion.stagger * (chips.length - index)} scaleFrom={tokens.splash.buttonScale} style={[styles.chip, { top: height * tokens.splash.chipTops[index], [chip.side]: tokens.space.lg }]}>
          <SoftSurface color={palette.soft} radius={tokens.radius.pill}><View style={styles.chipBody}><Icon name={chip.icon} size={tokens.space.lg + 2} color={palette.deep} /><AppText variant="label" bold style={{ color: palette.deep }}>{copy.welcome.chips[chip.key]}</AppText></View></SoftSurface>
        </IntroMotion>;
      })}
      <IntroMotion delay={tokens.splash.buttonDelay} scaleFrom={tokens.splash.buttonScale} style={[styles.cta, { bottom: insets.bottom + tokens.space.xl }]}>
        <SoftSurface color={colors.corgi} radius={tokens.radius.pill}><PressScale accessibilityRole="button" accessibilityLabel={copy.welcome.start} onPress={() => router.push('/onboarding')} style={styles.button}>
          <AppText bold style={[styles.start, { color: colors.onCorgi }]}>{copy.welcome.start}</AppText><Icon name="paw" color={colors.onCorgi} />
        </PressScale></SoftSurface>
        <View style={styles.private}><AppText variant="label" muted style={styles.center}>{copy.onboarding.private}</AppText></View>
      </IntroMotion>
    </View>
  </View>;
}
// Long words shrink so the title never runs off the screen; short ones keep the designed size.
const fit = (text: string, width: number, scale: number) => Math.min(width * scale, width * tokens.splash.titleMaxWidth / (text.length * tokens.splash.glyphWidth));
const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' }, stage: { flex: 1, overflow: 'hidden', alignItems: 'center' },
  glow: { position: 'absolute', alignSelf: 'center', borderRadius: tokens.radius.pill },
  brand: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  logo: { width: tokens.splash.logo, height: tokens.splash.logo, borderRadius: tokens.space.md },
  wordmark: { letterSpacing: 3 },
  title: { position: 'absolute', alignItems: 'center' }, letters: { flexDirection: 'row' },
  dog: { position: 'absolute' }, image: { flex: 1 },
  chip: { position: 'absolute' },
  chipBody: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xs, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm },
  cta: { position: 'absolute', left: tokens.space.xl, right: tokens.space.xl, gap: tokens.space.md },
  button: { minHeight: tokens.size.inputHeight, flexDirection: 'row', gap: tokens.space.md, borderRadius: tokens.radius.pill },
  start: { fontSize: tokens.type.section.fontSize - 3 },
  private: { alignItems: 'center' }, center: { textAlign: 'center' },
});
