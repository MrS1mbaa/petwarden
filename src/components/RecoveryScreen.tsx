import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { PillButton } from './PillButton';
import { useTheme } from '../theme/ThemeProvider';
import { tokens } from '../theme/theme';

export function RecoveryScreen({ title, body, action, onPress }: { title: string; body?: string; action: string; onPress: () => void }) {
  const { colors } = useTheme();
  return <View style={[styles.root, { backgroundColor: colors.bg }]}>
    <AppText variant="title" bold accessibilityRole="header">{title}</AppText>
    {body && <AppText muted>{body}</AppText>}
    <PillButton label={action} onPress={onPress} />
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: tokens.space.xl, gap: tokens.space.xl } });
