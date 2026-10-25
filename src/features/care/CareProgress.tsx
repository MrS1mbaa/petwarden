import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Path } from '@shopify/react-native-skia';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from '../../components/AppText';
import { SoftSurface } from '../../components/SoftSurface';
import { useMotionPreference } from '../../lib/motion';
import { copy } from '../../lib/copy';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';

const size = tokens.home.ring, stroke = tokens.home.ringStroke, radius = (size - stroke) / 2;
// Starts at 12 o'clock so trimming with `end` fills clockwise.
const ring = `M ${size / 2} ${stroke / 2} A ${radius} ${radius} 0 1 1 ${size / 2} ${size - stroke / 2} A ${radius} ${radius} 0 1 1 ${size / 2} ${stroke / 2}`;

export function CareProgress({ done, total }: { done: number; total: number }) {
  const { colors } = useTheme();
  const reduced = useMotionPreference();
  const ratio = total > 0 ? done / total : 0;
  const progress = useSharedValue(reduced ? ratio : 0);
  useEffect(() => {
    progress.set(reduced ? ratio : withTiming(ratio, { duration: tokens.chart.drawDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [progress, ratio, reduced]);
  const bar = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return <SoftSurface raised accessible accessibilityRole="progressbar" accessibilityLabel={copy.homeCare.progressLabel(done, total)} accessibilityValue={{ min: 0, max: total, now: done }} style={styles.card}>
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="label" muted style={styles.eyebrow}>{copy.homeCare.care.toUpperCase()}</AppText>
        <AppText variant="section" bold>{done === total ? copy.homeCare.allDone : copy.homeCare.progress(done, total)}</AppText>
      </View>
      <View style={styles.ring}>
        <Canvas style={StyleSheet.absoluteFill} accessible={false} pointerEvents="none">
          <Path path={ring} color={colors.corgiSoft} style="stroke" strokeWidth={stroke} />
          <Path path={ring} color={colors.corgi} style="stroke" strokeWidth={stroke} strokeCap="round" end={progress} />
        </Canvas>
        <AppText variant="label" bold>{`${Math.round(ratio * 100)}%`}</AppText>
      </View>
    </View>
    <View style={[styles.track, { backgroundColor: colors.corgiSoft }]}><Animated.View style={[styles.fill, { backgroundColor: colors.corgi }, bar]} /></View>
  </SoftSurface>;
}
const styles = StyleSheet.create({
  card: { padding: tokens.space.xl, gap: tokens.space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.lg },
  text: { flex: 1, gap: tokens.space.xs }, eyebrow: { letterSpacing: 0.6 },
  ring: { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
  track: { height: tokens.home.progressHeight, borderRadius: tokens.radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: tokens.radius.pill },
});
