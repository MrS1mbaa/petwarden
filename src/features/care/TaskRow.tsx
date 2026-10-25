import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { TodayTask } from '../../db/repositories/care';
import { accent, tokens, type Accent } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import type { TaskType } from './model';
import { spring, useMotionPreference } from '../../lib/motion';
import { copy } from '../../lib/copy';
import { AppText } from '../../components/AppText';
import { SoftSurface } from '../../components/SoftSurface';
import { PressScale } from '../../components/PressScale';
import { CheckButton } from '../../components/CheckButton';
import { CareIllustration } from '../../components/CareIllustration';
import { IconButton } from '../../components/IconButton';

const taskAccent: Record<TaskType, Accent> = { meal: 'corgi', walk: 'sage', other: 'butter' };

export const TaskRow = memo(function TaskRow({ task, pending, onCheck, onEdit, onDelete, onSnooze, celebrate, onFinish, checkDisabled = false, snoozeDisabled = false, subtitle }: { task: TodayTask; subtitle?: string; pending: boolean; onCheck: (task: TodayTask) => void; onEdit: (task: TodayTask) => void; onDelete: (task: TodayTask) => void; onSnooze: (task: TodayTask) => void; celebrate: boolean; onFinish: () => void; checkDisabled?: boolean; snoozeDisabled?: boolean }) {
  const reduced = useMotionPreference();
  const { colors } = useTheme();
  const x = useSharedValue(0), origin = useSharedValue(0), opacity = useSharedValue(task.done ? tokens.home.completedOpacity : 1);
  useEffect(() => { opacity.set(withTiming(task.done ? tokens.home.completedOpacity : 1, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never })); }, [opacity, task.done]);
  const pan = Gesture.Pan().enabled(!pending).activeOffsetX([-tokens.home.swipeThreshold, tokens.home.swipeThreshold]).failOffsetY([-tokens.home.swipeThreshold, tokens.home.swipeThreshold]).onBegin(() => { origin.set(x.get()); }).onUpdate(event => {
    const next = origin.get() + event.translationX, limit = tokens.home.swipeReveal;
    x.set(Math.abs(next) <= limit ? next : Math.sign(next) * (limit + (Math.abs(next) - limit) * tokens.home.swipeRubber));
  }).onEnd(() => { const target = Math.abs(x.get()) < tokens.home.swipeThreshold ? 0 : Math.sign(x.get()) * tokens.home.swipeReveal; x.set(reduced ? target : withSpring(target, spring)); });
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const dim = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const left = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, x.get() / tokens.home.swipeReveal)) }));
  const right = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, -x.get() / tokens.home.swipeReveal)) }));
  return <View style={styles.container}>
    <View style={styles.reveal} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden><Animated.View style={left}><IconButton name="clock" label={copy.homeCare.snooze} disabled={pending || snoozeDisabled} onPress={() => { x.set(withSpring(0, spring)); onSnooze(task); }} /></Animated.View><Animated.View style={right}><IconButton name="close" label={`${copy.homeCare.delete}: ${task.title}`} disabled={pending} onPress={() => onDelete(task)} /></Animated.View></View>
    <GestureDetector gesture={pan}><Animated.View style={[styles.row, slide]}>
      <Animated.View style={[styles.card, dim]}><SoftSurface raised={!task.done} radius={tokens.radius.icon}><PressScale disabled={pending} accessibilityRole="button" accessibilityLabel={copy.homeCare.editTask(task.title)} onPress={() => onEdit(task)} style={styles.task}>
        <View style={[styles.tile, { backgroundColor: accent(colors, taskAccent[task.type]).soft }]}><CareIllustration type={task.type} /></View><View style={styles.text}><AppText bold numberOfLines={2} style={task.done ? styles.completed : undefined}>{task.title}</AppText><AppText variant="label" muted={!task.done}>{subtitle ?? task.time}</AppText></View>
      </PressScale></SoftSurface></Animated.View>
      <CheckButton done={task.done} disabled={pending || checkDisabled} label={task.done ? copy.homeCare.unmark(task.title) : copy.homeCare.mark(task.title)} onPress={() => onCheck(task)} celebrate={celebrate} onFinish={onFinish} />
    </Animated.View></GestureDetector>
  </View>;
});
const styles = StyleSheet.create({ container: { width: '100%' }, reveal: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: tokens.space.md }, row: { flexDirection: 'row', gap: tokens.space.sm, alignItems: 'center' }, card: { flex: 1 }, task: { minHeight: tokens.home.taskHeight, flexDirection: 'row', justifyContent: 'flex-start', gap: tokens.space.md, paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm }, text: { flex: 1 }, tile: { width: tokens.home.careTile, height: tokens.home.careTile, borderRadius: tokens.home.careTileRadius, alignItems: 'center', justifyContent: 'center' }, completed: { textDecorationLine: 'line-through' } });
