import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { Easing, ReduceMotion, cancelAnimation, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useMotionPreference } from '../lib/motion';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';

const paw = 'M12 18 Q18 10 24 18 L31 28 Q34 35 25 35 Q18 32 11 35 Q2 35 5 28 Z M3 15 C-2 7 4 4 7 10 C12 18 5 22 3 15 Z M10 8 C7 -1 14 -3 16 5 C19 14 11 16 10 8 Z M21 5 C23 -3 30 -1 28 8 C27 16 19 14 21 5 Z M30 10 C34 4 40 7 36 15 C33 22 26 18 30 10 Z';
const trail = [{ x: 190, y: 24, angle: -0.35 }, { x: 240, y: 66, angle: 0.1 }, { x: 150, y: 104, angle: -0.5 }, { x: 208, y: 157, angle: -0.15 }, { x: 110, y: 206, angle: -0.6 }];
function Paw({ point, index, color }: { point: typeof trail[number]; index: number; color: string }) {
  const reduced = useMotionPreference();
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.set(withDelay(reduced ? 0 : index * tokens.motion.stagger, withTiming(tokens.decoration.pawOpacity, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never })));
    return () => cancelAnimation(opacity);
  }, [index, opacity, reduced]);
  return <Group opacity={opacity} transform={[{ translateX: point.x }, { translateY: point.y }, { rotate: point.angle }]}><Path path={paw} color={color} /></Group>;
}
export function PawBackground() {
  const { colors } = useTheme();
  // No looping drift: it kept the UI at 120 fps / ~40% CPU while idle (measured on device).
  return <View pointerEvents="none" accessible={false} style={styles.canvas}><Canvas pointerEvents="none" accessible={false} style={styles.fill}>
    {trail.map((point, index) => <Paw key={point.y} point={point} index={index} color={colors.paw} />)}
  </Canvas></View>;
}
const styles = StyleSheet.create({ fill: { flex: 1 }, canvas: { position: 'absolute', top: 0, right: 0, width: tokens.size.pawCanvasHeight, height: tokens.size.pawCanvasHeight } });
