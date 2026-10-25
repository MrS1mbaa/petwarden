import { useCallback, useLayoutEffect, useRef, type PropsWithChildren } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { spring, useMotionPreference } from '../lib/motion';
import { tokens } from '../theme/theme';

export function ScreenEntrance({ children, style, offsetFrom = tokens.size.screenSlide }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; offsetFrom?: number }>) {
  const reduced = useMotionPreference();
  const startOffset = useRef(offsetFrom);
  useLayoutEffect(() => { startOffset.current = offsetFrom; }, [offsetFrom]);
  const opacity = useSharedValue(0);
  const offset = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    opacity.set(0);
    offset.set(reduced ? 0 : startOffset.current);
    opacity.set(withTiming(1, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }));
    offset.set(withSpring(0, spring));
    return () => { cancelAnimation(opacity); cancelAnimation(offset); };
  }, [reduced, opacity, offset]));
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ translateY: offset.get() }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
