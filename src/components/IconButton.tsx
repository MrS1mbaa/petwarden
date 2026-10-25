import { StyleSheet } from 'react-native';
import { PressScale } from './PressScale';
import { Icon, type IconName } from './Icon';
import { SoftSurface } from './SoftSurface';
import { tokens } from '../theme/theme';

export function IconButton({ name, label, onPress, disabled = false }: { name: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return <SoftSurface raised radius={tokens.radius.icon}><PressScale accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={styles.button}><Icon name={name} /></PressScale></SoftSurface>;
}
const styles = StyleSheet.create({ button: { width: tokens.size.touch, height: tokens.size.touch, borderRadius: tokens.radius.icon } });
