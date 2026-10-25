import { useEffect, type PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { spring, useMotionPreference } from '../lib/motion';
import { tokens } from '../theme/theme';

export function IntroMotion({ children, style, delay = 0, offset = tokens.size.screenSlide, scaleFrom = 1, startWhen = true }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; delay?: number; offset?: number; scaleFrom?: number; startWhen?: boolean }>) {
  const reduced = useMotionPreference();
  const opacity = useSharedValue(0);
  const y = useSharedValue(reduced || !startWhen ? 0 : offset);
  const scale = useSharedValue(reduced ? 1 : scaleFrom);
  useEffect(() => {
    const stop = () => { cancelAnimation(opacity); cancelAnimation(y); cancelAnimation(scale); };
    stop();
    if (!startWhen) { opacity.set(0); y.set(0); scale.set(1); return stop; }
    const wait = reduced ? 0 : delay;
    y.set(reduced ? 0 : offset); scale.set(reduced ? 1 : scaleFrom);
    opacity.set(withDelay(wait, withTiming(1, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never })));
    y.set(withDelay(wait, withSpring(0, spring)));
    scale.set(withDelay(wait, withSpring(1, spring)));
    return stop;
  }, [delay, offset, opacity, reduced, scale, scaleFrom, startWhen, y]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ translateY: y.get() }, { scale: scale.get() }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
