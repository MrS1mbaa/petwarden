import { useEffect, useState, type ComponentProps } from 'react';
import { useLanguage } from '../lib/language';
import { StyleSheet, View } from 'react-native';
import type { Tabs } from 'expo-router';
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { PressScale } from './PressScale';
import { SoftSurface } from './SoftSurface';
import { spring, useMotionPreference } from '../lib/motion';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';

const icons: Record<string, IconName> = { index: 'home', planner: 'planner', health: 'health', profile: 'profile' };
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const reduced = useMotionPreference();
  useLanguage(state => state.language);
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(0);
  const stretch = useSharedValue(1);
  const slot = Math.max(0, width - tokens.size.tabInset * 2) / state.routes.length;
  useEffect(() => {
    offset.set(reduced ? state.index * slot : withSpring(state.index * slot, spring));
    stretch.set(reduced ? 1 : withSequence(withSpring(tokens.motion.tabStretch, spring), withSpring(1, spring)));
    return () => { cancelAnimation(offset); cancelAnimation(stretch); };
  }, [state.index, slot, offset, stretch, reduced]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }, { scaleX: stretch.get() }] }));
  return <View pointerEvents="box-none" style={[styles.anchor, { bottom: Math.max(insets.bottom, tokens.space.lg), left: Math.max(insets.left, tokens.space.xl), right: Math.max(insets.right, tokens.space.xl) }]}>
    <SoftSurface raised radius={tokens.radius.pill} style={styles.surface} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.row}>
        {width > 0 && <Animated.View pointerEvents="none" style={[styles.pill, { width: slot, backgroundColor: colors.ink }, pill]} />}
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;
          return <View key={route.key} style={styles.slot}>
            <PressScale accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} aria-selected={selected}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }} style={styles.tab}>
              <TabContent icon={icons[route.name] ?? 'paw'} label={label} selected={selected} />
            </PressScale>
          </View>;
        })}
      </View>
    </SoftSurface>
  </View>;
}
function TabContent({ icon, label, selected }: { icon: IconName; label: string; selected: boolean }) {
  const { colors } = useTheme(), reduced = useMotionPreference();
  const scale = useSharedValue(1), opacity = useSharedValue(1);
  useEffect(() => {
    scale.set(selected && !reduced ? withSequence(withSpring(tokens.motion.tabBounce, spring), withSpring(1, spring)) : 1);
    opacity.set(0);
    opacity.set(withTiming(1, { duration: tokens.motion.fadeDuration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }));
    return () => { cancelAnimation(scale); cancelAnimation(opacity); };
  }, [selected, reduced, scale, opacity]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <><Animated.View style={iconStyle}><Icon name={icon} color={selected ? colors.onInk : colors.textSecondary} /></Animated.View><Animated.View style={labelStyle}><AppText variant="label" numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ color: selected ? colors.onInk : colors.textPrimary }}>{label}</AppText></Animated.View></>;
}
const styles = StyleSheet.create({
  anchor: { position: 'absolute', alignItems: 'center' },
  surface: { width: '100%', maxWidth: tokens.size.tabMaxWidth, minHeight: tokens.size.tabHeight },
  row: { padding: tokens.size.tabInset, flexDirection: 'row', alignItems: 'center' },
  slot: { flex: 1 }, tab: { minHeight: tokens.size.tabPillHeight, gap: tokens.space.xs, paddingVertical: tokens.space.sm },
  pill: { position: 'absolute', left: tokens.size.tabInset, top: tokens.size.tabInset, height: tokens.size.tabPillHeight, borderRadius: tokens.radius.pill },
});
