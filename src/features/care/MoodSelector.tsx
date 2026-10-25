import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { AppText } from '../../components/AppText';
import { PressScale } from '../../components/PressScale';
import { useTheme } from '../../theme/ThemeProvider';
import { tokens } from '../../theme/theme';
import { spring, useMotionPreference } from '../../lib/motion';
import { lightHaptic } from '../../lib/haptics';
import { copy } from '../../lib/copy';
import { moodChoices, moodEmoji, type Mood } from './model';
import { moodAtPoint, type MoodBounds } from './moodHit';

export function MoodSelector({ selected, disabled, onSelect }: { selected: Mood | null; disabled: boolean; onSelect: (mood: Mood) => void }) {
  const bounds = useSharedValue<(MoodBounds | null)[]>(moodChoices.map(() => null));
  const hover = useSharedValue(-1);
  const chooseIndex = (index: number) => { const mood = moodChoices[index]; if (mood && !disabled) onSelect(mood); };
  const track = (x: number, y: number) => {
    'worklet';
    const next = moodAtPoint(bounds.get(), x, y);
    if (next !== hover.get()) { hover.set(next); if (next >= 0) scheduleOnRN(lightHaptic); }
  };
  const drag = Gesture.Pan().enabled(!disabled).minDistance(tokens.space.sm)
    .onBegin(event => track(event.x, event.y))
    .onUpdate(event => track(event.x, event.y))
    .onEnd((_event, success) => { if (success && hover.get() >= 0) scheduleOnRN(chooseIndex, hover.get()); })
    .onFinalize(() => hover.set(-1));
  return <GestureDetector gesture={drag}><View style={styles.choices} collapsable={false}>{moodChoices.map((mood, index) => <View key={mood} onLayout={event => { const next = [...bounds.get()]; next[index] = event.nativeEvent.layout; bounds.set(next); }}><MoodChoice mood={mood} index={index} hover={hover} selected={selected === mood} disabled={disabled} onPress={() => onSelect(mood)} /></View>)}</View></GestureDetector>;
}

function MoodChoice({ mood, index, hover, selected, disabled, onPress }: { mood: Mood; index: number; hover: SharedValue<number>; selected: boolean; disabled: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const reduced = useMotionPreference();
  const scale = useSharedValue(1);
  useAnimatedReaction(() => hover.get() === index, active => { scale.set(withSpring(active && !reduced ? tokens.sheet.moodScale : 1, spring)); }, [reduced]);
  useEffect(() => () => cancelAnimation(scale), [scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <Animated.View style={animated}><PressScale aria-pressed={selected} accessibilityRole="button" accessibilityLabel={copy.moods[mood]} accessibilityState={{ selected }} disabled={disabled} onPress={onPress} style={[styles.mood, { backgroundColor: selected ? colors.ink : colors.surfaceRaised }]}><AppText variant="title">{moodEmoji[mood]}</AppText><AppText variant="label" bold style={{ color: selected ? colors.onInk : colors.textPrimary }}>{copy.moods[mood]}</AppText></PressScale></Animated.View>;
}
const styles = StyleSheet.create({ choices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.md, paddingVertical: tokens.space.sm }, mood: { minWidth: tokens.size.emptyIllustration, padding: tokens.space.md, borderRadius: tokens.radius.icon, gap: tokens.space.sm } });
