import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { copy, languages } from '../lib/copy';
import { changeLanguage, useLanguage } from '../lib/language';
import { tokens } from '../theme/theme';
import { PillButton } from './PillButton';

// Each option is written in its own language, so it reads correctly whichever one is active.
export function LanguagePicker({ disabled = false, onCard = false }: { disabled?: boolean; onCard?: boolean }) {
  const language = useLanguage(state => state.language);
  const [busy, setBusy] = useState(false);
  return <View accessibilityRole="radiogroup" accessibilityLabel={copy.languageHint} style={styles.row}>
    {languages.map(item => <View key={item} style={styles.slot}><PillButton toggle onCard={onCard} label={copy.languages[item]} selected={language === item} disabled={disabled || busy}
      onPress={() => { if (item === language) return; setBusy(true); void changeLanguage(item).catch(() => {}).finally(() => setBusy(false)); }} /></View>)}
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: tokens.space.sm }, slot: { flex: 1 } });
