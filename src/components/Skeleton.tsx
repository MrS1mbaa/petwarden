import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { StaticCanvas } from './StaticCanvas';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';
import { useMotionPreference } from '../lib/motion';
export function Skeleton() {
  const { colors } = useTheme();
  const reduced = useMotionPreference();
  const [width, setWidth] = useState(0);
  const position = useSharedValue(-1);
  useEffect(() => {
    position.set(-1);
    if (!reduced) position.set(withRepeat(withTiming(1, { duration: tokens.motion.shimmerDuration, easing: Easing.inOut(Easing.cubic), reduceMotion: ReduceMotion.System }), -1, true));
    return () => cancelAnimation(position);
  }, [position, reduced]);
  const band = width * tokens.motion.shimmerWidthRatio;
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: (position.get() + 1) / 2 * (width + band) - band }] }));
  const drawing = useMemo(() => <Rect x={0} y={0} width={band} height={tokens.home.taskHeight}><LinearGradient start={vec(0, 0)} end={vec(band, 0)} colors={[colors.surface, colors.highlight, colors.surface]} /></Rect>, [band, colors.surface, colors.highlight]);
  return <View accessible={false} onLayout={event => setWidth(event.nativeEvent.layout.width)} style={[styles.card, { backgroundColor: colors.surface }]}>
    {!reduced && width > 0 && <Animated.View pointerEvents="none" style={[styles.band, { width: band }, animated]}><StaticCanvas accessible={false} style={{ width: band, height: tokens.home.taskHeight }}>{drawing}</StaticCanvas></Animated.View>}
  </View>;
}
const styles = StyleSheet.create({ band: { position: 'absolute', height: tokens.home.taskHeight }, card: { overflow: 'hidden', height: tokens.home.taskHeight, borderRadius: tokens.radius.icon, marginBottom: tokens.space.lg } });
