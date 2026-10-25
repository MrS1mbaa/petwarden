import { StyleSheet, View } from 'react-native';
import { EmptyPet } from './EmptyPet';
import { AppText } from './AppText';
import { copy } from '../lib/copy';
import { tokens } from '../theme/theme';

export function RefreshPet() {
  return <View accessibilityLiveRegion="polite" style={styles.row}><EmptyPet /><AppText muted>{copy.refreshing}</AppText></View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.space.md, paddingVertical: tokens.space.sm } });
