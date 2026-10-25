import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group, Line, Path, RoundedRect, Text as SkiaText, useFont, vec } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Easing, ReduceMotion, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { AppText } from '../../components/AppText';
import { PillButton } from '../../components/PillButton';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { useMotionPreference } from '../../lib/motion';
import { lightHaptic } from '../../lib/haptics';
import { displayDate } from '../../lib/dates';
import { copy } from '../../lib/copy';
import { chartGeometry, nearestPoint, type Measurement } from './chart';

export const WeightChart = memo(function WeightChart({ records }: { records: Measurement[] }) {
  const { colors } = useTheme();
  const reduced = useMotionPreference();
  const [width, setWidth] = useState(0), [selected, setSelected] = useState(0);
  const chart = useMemo(() => chartGeometry(records, width, tokens.chart.height, tokens.chart.padding, tokens.chart.limit), [records, width]);
  const font = useFont(require('../../../assets/fonts/SpaceGrotesk-Medium.otf'), tokens.type.label.fontSize);
  const end = useSharedValue(reduced ? 1 : 0), index = useSharedValue(0), touchX = useSharedValue(0), touching = useSharedValue(0);
  const points = chart.points;
  const labels = useMemo(() => points.map(point => `${copy.healthRecords.kilograms(point.valueKg)} · ${displayDate(point.date)}`), [points]);
  useEffect(() => {
    const latest = Math.max(points.length - 1, 0);
    index.set(latest); setSelected(latest);
    end.set(reduced ? 1 : 0);
    if (!reduced) end.set(withTiming(1, { duration: tokens.chart.drawDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [end, index, points, reduced]);
  const cursorX = useDerivedValue(() => points[index.get()]?.x ?? 0);
  const cursorY = useDerivedValue(() => points[index.get()]?.y ?? 0);
  const tooltipX = useDerivedValue(() => Math.max(0, Math.min(width - tokens.chart.tooltipWidth, touchX.get() - tokens.chart.tooltipWidth / 2)));
  const textX = useDerivedValue(() => tooltipX.get() + tokens.space.md);
  const label = useDerivedValue(() => labels[index.get()] ?? '');
  const select = (next: number) => {
    const safe = Math.max(0, Math.min(points.length - 1, next));
    index.set(safe); setSelected(safe);
  };
  const pan = useMemo(() => Gesture.Pan().activeOffsetX([-tokens.space.sm, tokens.space.sm]).failOffsetY([-tokens.space.md, tokens.space.md]).onStart(event => {
    touching.set(1); touchX.set(event.x);
    const next = nearestPoint(points, event.x);
    index.set(next); scheduleOnRN(setSelected, next); scheduleOnRN(lightHaptic);
  }).onUpdate(event => {
    touchX.set(event.x);
    const next = nearestPoint(points, event.x);
    if (next !== index.get()) { index.set(next); scheduleOnRN(setSelected, next); scheduleOnRN(lightHaptic); }
  }).onFinalize(() => touching.set(0)), [index, points, touchX, touching]);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.root}>
    {points.length > 0 && width > 0 && <GestureDetector gesture={pan}><View accessible={false} style={styles.canvas}>
      <Canvas style={styles.canvas} accessible={false}>
        {[tokens.chart.padding, tokens.chart.height / 2, tokens.chart.height - tokens.chart.padding].map(y => <Line key={y} p1={vec(tokens.chart.padding, y)} p2={vec(width - tokens.chart.padding, y)} color={colors.surface} strokeWidth={tokens.chart.gridStroke} />)}
        {points.length > 1 && <Path path={chart.path} style="stroke" strokeWidth={tokens.chart.stroke} strokeCap="round" strokeJoin="round" color={colors.corgi} end={end} />}
        {points.map(point => <Circle key={point.id} cx={point.x} cy={point.y} r={tokens.chart.pointRadius} color={colors.corgi} />)}
        <Circle cx={cursorX} cy={cursorY} r={tokens.chart.selectedRadius} color={colors.corgi} />
        <Circle cx={cursorX} cy={cursorY} r={tokens.chart.pointRadius} color={colors.surfaceRaised} />
        <Group opacity={touching}><RoundedRect x={tooltipX} y={tokens.chart.tooltipTop} width={tokens.chart.tooltipWidth} height={tokens.chart.tooltipHeight} r={tokens.radius.icon} color={colors.ink} />{font && <SkiaText text={label} font={font} x={textX} y={tokens.chart.tooltipBaseline} color={colors.onInk} />}</Group>
      </Canvas>
    </View></GestureDetector>}
    <View style={styles.axis}><AppText muted variant="label">{points.length ? displayDate(points[0].date) : copy.missingValue}</AppText><AppText muted variant="label">{points.length > 1 ? displayDate(points.at(-1)!.date) : ''}</AppText></View>
    <AppText variant="label" muted>{copy.healthRecords.chartHint}</AppText>
    {points.length > 0 && <><AppText accessibilityLiveRegion="polite" bold>{labels[selected] ?? labels.at(-1)}</AppText><View style={styles.controls}><PillButton compact onCard label={copy.healthRecords.previousPoint} selected={false} disabled={selected <= 0} onPress={() => select(selected - 1)} /><PillButton compact onCard label={copy.healthRecords.nextPoint} selected={false} disabled={selected >= points.length - 1} onPress={() => select(selected + 1)} /></View></>}
  </View>;
});
const styles = StyleSheet.create({ root: { gap: tokens.space.sm }, canvas: { height: tokens.chart.height, width: '100%' }, axis: { flexDirection: 'row', justifyContent: 'space-between', gap: tokens.space.sm }, controls: { flexDirection: 'row', gap: tokens.space.sm, flexWrap: 'wrap' } });
