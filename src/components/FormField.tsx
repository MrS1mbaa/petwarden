import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { tokens } from '../theme/theme';
import { AppText } from './AppText';

export function FormField({ label, onCard = false, error, ...props }: TextInputProps & { label: string; onCard?: boolean; error?: string | null }) {
  const { colors, fontsReady } = useTheme();
  return <View style={styles.field}>
    <AppText bold>{label}</AppText>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.textPrimary, backgroundColor: onCard ? colors.surface : colors.surfaceRaised, fontFamily: fontsReady ? tokens.font.medium : undefined }]} />
    {error ? <AppText variant="label" accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.error }}>{error}</AppText> : null}
  </View>;
}
const styles = StyleSheet.create({ field: { gap: tokens.space.sm }, input: { minHeight: tokens.size.inputHeight, borderRadius: tokens.radius.icon, paddingHorizontal: tokens.space.lg, paddingVertical: tokens.space.md, ...tokens.type.body } });
