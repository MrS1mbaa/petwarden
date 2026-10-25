import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { usePhotoTransition } from '../features/pets/photoTransition';
import { interpolatePhotoFrame, localPhotoFrame } from '../features/pets/photoGeometry';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';
import { spring, useMotionPreference } from '../lib/motion';

export function PhotoTransitionOverlay() {
  const root = useRef<View | null>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const pending = usePhotoTransition(state => state.pending);
  const measure = useCallback(() => root.current?.measureInWindow((x, y) => setOrigin({ x, y })), []);
  useLayoutEffect(measure, [measure, pending?.key]);
  return <View ref={root} onLayout={measure} pointerEvents="none" accessible={false} style={styles.root}>{pending && <MovingPhoto key={pending.key} pending={pending} origin={origin} />}</View>;
}
function MovingPhoto({ pending, origin }: { pending: NonNullable<ReturnType<typeof usePhotoTransition.getState>['pending']>; origin: { x: number; y: number } }) {
  const { colors } = useTheme();
  const reduced = useMotionPreference();
  const [loaded, setLoaded] = useState(false);
  const progress = useSharedValue(0), opacity = useSharedValue(1);
  const key = pending.key;
  const finish = useCallback(() => usePhotoTransition.getState().finish(key), [key]);
  useEffect(() => {
    const timeout = setTimeout(() => usePhotoTransition.getState().finish(key), tokens.motion.photoTransitionTimeout);
    return () => { clearTimeout(timeout); cancelAnimation(progress); cancelAnimation(opacity); };
  }, [key, opacity, progress]);
  useLayoutEffect(() => {
    if (!pending.to || !loaded) return;
    if (reduced) {
      progress.set(1); opacity.set(0);
      opacity.set(withTiming(1, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }, done => { if (done) scheduleOnRN(finish); }));
    } else progress.set(withSpring(1, spring, done => { if (done) scheduleOnRN(finish); }));
  }, [finish, loaded, opacity, pending.to, progress, reduced]);
  const animated = useAnimatedStyle(() => {
    const from = localPhotoFrame(pending.from, origin), to = localPhotoFrame(pending.to ?? pending.from, origin);
    const frame = interpolatePhotoFrame(from, to, progress.get());
    return { width: frame.width, height: frame.height, opacity: loaded ? opacity.get() : 0, transform: [{ translateX: frame.x }, { translateY: frame.y }] };
  });
  return <Animated.View testID="pet-photo-transition" style={[styles.photo, { backgroundColor: colors.surface, borderColor: colors.photoFrame }, animated]}><Image source={{ uri: pending.uri }} contentFit="cover" transition={0} onLoad={() => setLoaded(true)} onError={finish} style={styles.fill} /></Animated.View>;
}
const styles = StyleSheet.create({ root: { ...StyleSheet.absoluteFill, zIndex: tokens.motion.photoOverlayLayer }, photo: { position: 'absolute', top: 0, left: 0, borderRadius: tokens.radius.card, borderWidth: tokens.home.heroPhotoFrame, overflow: 'hidden' }, fill: { width: '100%', height: '100%' } });
