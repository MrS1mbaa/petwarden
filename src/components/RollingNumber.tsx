import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Text as SkiaText, useFont, type SkFont } from '@shopify/react-native-skia';
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';
import { useMotionPreference } from '../lib/motion';
import { rollingColumns } from '../lib/rollingDigits';
import { AppText } from './AppText';

type Variant = 'title' | 'wellness' | 'label';
export function RollingNumber({ text, suffix = '', label, variant = 'title', fullWidth = true }: { text: string; suffix?: string; label?: string; variant?: Variant; fullWidth?: boolean }) {
  const { colors } = useTheme(), reduced = useMotionPreference();
  // Skia ignores the system font size, so scale by hand (layouts are tested up to 200 %).
  const grow = Math.min(useWindowDimensions().fontScale, 2);
  const base = variant === 'wellness' ? { fontSize: tokens.home.wellnessValue, lineHeight: tokens.home.wellnessLineHeight, baseline: tokens.home.wellnessNumberBaseline } : variant === 'label' ? { ...tokens.type.label, baseline: tokens.motion.labelNumberBaseline } : { ...tokens.type.title, baseline: tokens.chart.numberBaseline };
  const spec = { fontSize: base.fontSize * grow, lineHeight: base.lineHeight * grow, baseline: base.baseline * grow };
  const font = useFont(variant === 'label' ? require('../../assets/fonts/SpaceGrotesk-Medium.otf') : require('../../assets/fonts/SpaceGrotesk-Bold.otf'), spec.fontSize);
  const [pair, setPair] = useState({ previous: text, target: text });
  if (pair.target !== text) setPair({ previous: pair.target, target: text });
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(1), opacity = useSharedValue(1);
  const complete = useCallback((target: string) => setPair(current => current.target === target && current.previous !== target ? { previous: target, target: target } : current), []);
  useLayoutEffect(() => {
    cancelAnimation(progress); cancelAnimation(opacity);
    if (pair.previous === pair.target) { progress.set(1); opacity.set(1); return; }
    const target = pair.target;
    if (reduced) {
      progress.set(1); opacity.set(0);
      opacity.set(withTiming(1, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }, done => { if (done) scheduleOnRN(complete, target); }));
    } else {
      opacity.set(1); progress.set(0);
      progress.set(withTiming(1, { duration: tokens.chart.numberDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }, done => { if (done) scheduleOnRN(complete, target); }));
    }
    return () => { cancelAnimation(progress); cancelAnimation(opacity); };
  }, [complete, opacity, pair.target, pair.previous, progress, reduced]);
  const faded = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const columns = useMemo(() => rollingColumns(pair.previous, pair.target), [pair.previous, pair.target]);
  const advance = useMemo(() => font ? Math.max(...font.getGlyphWidths(font.getGlyphIDs('0123456789,.'))) + tokens.motion.digitGap : 0, [font]);
  const positioned = useMemo(() => {
    return columns.reduce<{ from: string; to: string; x: number; advance: number }[]>((items, column) => {
      const cell = font && (column.from === ',' || column.to === ',' || column.from === '.' || column.to === '.') ? textWidth(font, column.to === '.' || column.from === '.' ? '.' : ',') + tokens.motion.digitGap : advance;
      const previous = items.at(-1);
      return [...items, { ...column, x: previous ? previous.x + previous.advance : 0, advance: cell }];
    }, []);
  }, [advance, columns, font]);
  const last = positioned.at(-1);
  const suffixX = (last ? last.x + last.advance : 0) + (suffix ? tokens.space.sm : 0);
  const totalWidth = suffixX + (font ? textWidth(font, suffix) : 0);
  const scale = totalWidth > 0 ? Math.min(1, width / totalWidth) : 1;
  if (!font) return <AppText variant={variant === 'label' ? 'label' : 'title'} bold={variant !== 'label'}>{text}{suffix ? ` ${suffix}` : ''}</AppText>;
  return <View accessible={!!label} accessibilityLabel={label} onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ height: spec.lineHeight, width: fullWidth ? '100%' : totalWidth }}><Animated.View style={[styles.fill, faded]}>{width > 0 && <Canvas style={styles.fill} accessible={false}><Group transform={[{ translateY: spec.lineHeight * (1 - scale) / 2 }, { scale }]} clip={{ x: 0, y: 0, width: totalWidth, height: spec.lineHeight }}>{positioned.map((column, index) => <RollingGlyph key={index} {...column} height={spec.lineHeight} baseline={spec.baseline} font={font} progress={progress} color={variant === 'label' ? colors.textSecondary : colors.textPrimary} />)}{suffix && <SkiaText text={suffix} x={suffixX} y={spec.baseline} font={font} color={colors.textPrimary} />}</Group></Canvas>}</Animated.View></View>;
}
function RollingGlyph({ from, to, x, advance, height, baseline, font, progress, color }: { from: string; to: string; x: number; advance: number; height: number; baseline: number; font: SkFont; progress: SharedValue<number>; color: string }) {
  const oldY = useDerivedValue(() => baseline - progress.get() * height), newY = useDerivedValue(() => baseline + (1 - progress.get()) * height);
  const oldX = x + (advance - textWidth(font, from)) / 2, newX = x + (advance - textWidth(font, to)) / 2;
  return from === to ? <SkiaText text={to} x={newX} y={baseline} font={font} color={color} /> : <><SkiaText text={from} x={oldX} y={oldY} font={font} color={color} /><SkiaText text={to} x={newX} y={newY} font={font} color={color} /></>;
}
const styles = StyleSheet.create({ fill: { width: '100%', height: '100%' } });

function textWidth(font: SkFont, text: string) { return font.getGlyphWidths(font.getGlyphIDs(text)).reduce((sum, width) => sum + width, 0); }
