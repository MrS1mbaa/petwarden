import { StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { PressScale } from './PressScale';
import { useTheme } from '../theme/ThemeProvider';
import { tokens } from '../theme/theme';

export function PillButton({ label, onPress, selected = true, disabled = false, toggle = false, compact = false, primary = false, onCard = false }: { label: string; onPress: () => void; selected?: boolean; disabled?: boolean; toggle?: boolean; compact?: boolean; primary?: boolean; onCard?: boolean }) {
  const { colors } = useTheme();
  return <PressScale disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, ...(toggle ? { selected } : {}) }} aria-pressed={toggle ? selected : undefined} onPress={onPress}
    style={[styles.button, compact && styles.compact, { backgroundColor: primary ? colors.corgi : selected ? colors.ink : onCard ? colors.surface : colors.surfaceRaised }]}>
    <AppText bold style={{ color: primary ? colors.onCorgi : selected ? colors.onInk : colors.textPrimary }}>{label}</AppText>
  </PressScale>;
}
const styles = StyleSheet.create({ compact: { paddingHorizontal: tokens.space.md }, button: { borderRadius: tokens.radius.pill, paddingHorizontal: tokens.space.xl, paddingVertical: tokens.space.md } });
