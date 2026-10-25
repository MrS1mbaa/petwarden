import { useEffect, type PropsWithChildren, type RefObject } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, ReduceMotion, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';
import { spring, useMotionPreference } from '../lib/motion';
import { lightHaptic } from '../lib/haptics';
import { copy } from '../lib/copy';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);
type Props = PropsWithChildren<{ open: boolean; title: string; onClose: () => void; canClose?: boolean; blurTarget?: RefObject<View | null> }>;
export function BottomSheet(props: Props) { return props.open ? <Sheet {...props} /> : null; }
function Sheet({ title, children, onClose, canClose = true, blurTarget }: Props) {
  const { colors, dark } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useMotionPreference();
  const hidden = height * tokens.sheet.hiddenRatio;
  const y = useSharedValue(reduced ? 0 : hidden);
  const fade = useSharedValue(0);
  const origin = useSharedValue(0);
  useEffect(() => {
    fade.set(withTiming(1, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }));
    y.set(withSpring(0, spring));
  }, [fade, y]);
  const close = () => {
    if (!canClose) return;
    lightHaptic();
    if (reduced) fade.set(withTiming(0, { duration: tokens.motion.fadeDuration, reduceMotion: ReduceMotion.Never }, finished => { if (finished) scheduleOnRN(onClose); }));
    else y.set(withSpring(hidden, spring, finished => { if (finished) scheduleOnRN(onClose); }));
  };
  const drag = Gesture.Pan().enabled(canClose).onBegin(() => { origin.set(y.get()); }).onUpdate(event => {
    const next = origin.get() + event.translationY;
    y.set(next < 0 ? next * tokens.sheet.rubber : next > hidden ? hidden + (next - hidden) * tokens.sheet.rubber : next);
  }).onEnd(event => {
    if (y.get() > tokens.sheet.dismissThreshold || event.velocityY > tokens.sheet.dismissVelocity) {
      if (reduced) scheduleOnRN(close);
      else y.set(withSpring(hidden, spring, finished => { if (finished) scheduleOnRN(onClose); }));
    } else y.set(withSpring(0, spring));
  });
  const panel = useAnimatedStyle(() => ({ opacity: fade.get(), transform: [{ translateY: y.get() }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, 1 - y.get() / hidden)) * fade.get() }));
  const blur = useAnimatedProps(() => ({ intensity: Math.max(0, Math.min(1, 1 - y.get() / hidden)) * tokens.sheet.blur }));
  return <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={close} accessibilityViewIsModal>
    <GestureHandlerRootView style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
        <AnimatedBlur pointerEvents="none" blurTarget={blurTarget} blurMethod="dimezisBlurViewSdk31Plus" tint={dark ? 'dark' : 'light'} animatedProps={blur} style={StyleSheet.absoluteFill} />
        <Pressable disabled={!canClose} accessibilityRole="button" accessibilityLabel={copy.homeCare.close} onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: tokens.sheet.dim }]} />
      </Animated.View>
      <KeyboardAvoidingView pointerEvents="box-none" style={styles.root} behavior="padding">
        <Animated.View style={[styles.panel, { maxHeight: height * tokens.sheet.maxHeightRatio, backgroundColor: colors.bg, paddingBottom: insets.bottom + tokens.space.xl }, panel]}>
          <GestureDetector gesture={drag}><View style={styles.header}>
            <View accessible={false} style={[styles.handle, { backgroundColor: colors.surface }]} />
            <View style={styles.title}><AppText variant="section" bold accessibilityRole="header" style={styles.heading}>{title}</AppText><IconButton name="close" label={copy.homeCare.close} disabled={!canClose} onPress={close} /></View>
          </View></GestureDetector>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  </Modal>;
}
const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'flex-end' }, panel: { width: '100%', maxWidth: tokens.size.pageMaxWidth, alignSelf: 'center', borderTopLeftRadius: tokens.radius.card, borderTopRightRadius: tokens.radius.card }, header: { paddingHorizontal: tokens.space.xl, paddingTop: tokens.space.md }, handle: { alignSelf: 'center', width: tokens.sheet.handleWidth, height: tokens.sheet.handleHeight, borderRadius: tokens.radius.pill, marginBottom: tokens.space.md }, title: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, paddingBottom: tokens.space.lg }, heading: { flex: 1 }, content: { paddingHorizontal: tokens.space.xl, gap: tokens.space.lg, paddingBottom: tokens.space.md } });
