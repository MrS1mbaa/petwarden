import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { lightHaptic } from '../lib/haptics';
import { spring, useMotionPreference } from '../lib/motion';
import { tokens } from '../theme/theme';

export function PressScale({ children, onPressIn, onPressOut, style, containerStyle, scaleTo = tokens.motion.pressScale, ...props }: PressableProps & { scaleTo?: number; containerStyle?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);
  const reduced = useMotionPreference();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <Animated.View style={[containerStyle, animated]}>
    <Pressable {...props} style={state => [styles.target, typeof style === 'function' ? style(state) : style]}
      onPressIn={event => { lightHaptic(); scale.set(withSpring(reduced ? 1 : scaleTo, spring)); onPressIn?.(event); }}
      onPressOut={event => { scale.set(withSpring(1, spring)); onPressOut?.(event); }}>
      {children}
    </Pressable>
  </Animated.View>;
}
const styles = StyleSheet.create({ target: { minHeight: tokens.size.touch, minWidth: tokens.size.touch, justifyContent: 'center', alignItems: 'center' } });
