import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Path, RoundedRect } from '@shopify/react-native-skia';
import Animated, { Easing, ReduceMotion, cancelAnimation, interpolateColor, useAnimatedStyle, useDerivedValue, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { tokens } from '../theme/theme';
import { spring, useMotionPreference } from '../lib/motion';
import { PressScale } from './PressScale';
import { SoftSurface } from './SoftSurface';
import { CheckCelebration } from './CheckCelebration';

export function CheckButton({ done, disabled, label, onPress, celebrate, onFinish }: { done: boolean; disabled: boolean; label: string; onPress: () => void; celebrate: boolean; onFinish: () => void }) {
  const { colors } = useTheme();
  const reduced = useMotionPreference();
  const progress = useSharedValue(done ? 1 : 0), scale = useSharedValue(1), opacity = useSharedValue(1);
  const previous = useRef(done);
  useEffect(() => {
    cancelAnimation(progress); cancelAnimation(scale); cancelAnimation(opacity);
    const changed = done !== previous.current;
    if (reduced) {
      progress.set(done ? 1 : 0); scale.set(1); opacity.set(changed ? 0 : 1);
      if (changed) opacity.set(withTiming(1, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }));
    } else {
      opacity.set(1);
      progress.set(withTiming(done ? 1 : 0, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
      scale.set(done && changed ? withSequence(withSpring(tokens.home.checkPop, spring), withSpring(1, spring)) : 1);
    }
    previous.current = done;
    return () => { cancelAnimation(progress); cancelAnimation(scale); cancelAnimation(opacity); };
  }, [done, opacity, progress, reduced, scale]);
  useEffect(() => { if (celebrate && reduced) onFinish(); }, [celebrate, onFinish, reduced]);
  const fill = useDerivedValue(() => interpolateColor(progress.get(), [0, 1], [colors.surfaceRaised, colors.sage]));
  const tile = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(progress.get(), [0, 1], [colors.surfaceRaised, colors.sage]) }));
  const outlineOpacity = useDerivedValue(() => 1 - progress.get());
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ scale: scale.get() }] }));
  return <SoftSurface raised radius={tokens.radius.icon}><Animated.View style={[StyleSheet.absoluteFill, styles.tile, tile]} /><PressScale accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: done, disabled }} aria-checked={done} disabled={disabled} onPress={onPress} scaleTo={tokens.home.checkScale} style={styles.button}>
    <Animated.View style={animated}><Canvas style={styles.check} pointerEvents="none" accessible={false}>
      <RoundedRect x={1} y={1} width={22} height={22} r={8} color={fill} />
      <RoundedRect x={1} y={1} width={22} height={22} r={8} color={colors.textPrimary} style="stroke" strokeWidth={1.5} opacity={outlineOpacity} />
      <Path path="M6 12 L10 16 L18 8" color={colors.textSecondary} style="stroke" strokeWidth={1.7} strokeCap="round" strokeJoin="round" opacity={outlineOpacity} />
      <Path path="M5 12 L10 17 L19 7" color={colors.onSage} style="stroke" strokeWidth={2.6} strokeCap="round" strokeJoin="round" end={progress} />
    </Canvas></Animated.View>
  </PressScale>{done && celebrate && !reduced && <CheckCelebration onFinish={onFinish} />}</SoftSurface>;
}
const styles = StyleSheet.create({ tile: { borderRadius: tokens.radius.icon }, button: { width: tokens.home.checkWidth, height: tokens.home.taskHeight, borderRadius: tokens.radius.icon }, check: { width: tokens.size.icon, height: tokens.size.icon } });
