import { ScrollView, StyleSheet } from 'react-native';
import { FormField } from '../../components/FormField';
import { PillButton } from '../../components/PillButton';
import type { Species } from '../../db/species';
import { copy } from '../../lib/copy';
import { tokens } from '../../theme/theme';
import { breedSuggestions } from './breeds';

// Free-text breed field with tappable suggestions that depend on the chosen species.
export function BreedField({ species, value, onChange, editable, placeholder }: { species: Species; value: string; onChange: (breed: string) => void; editable: boolean; placeholder?: string }) {
  const suggestions = breedSuggestions(species, value);
  return <>
    <FormField editable={editable} label={copy.onboarding.breed} placeholder={placeholder} value={value} onChangeText={onChange} maxLength={80} autoCapitalize="words" />
    {editable && suggestions.length > 0 && <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {suggestions.map(name => <PillButton compact key={name} selected={false} label={name} onPress={() => onChange(name)} />)}
    </ScrollView>}
  </>;
}
const styles = StyleSheet.create({ row: { gap: tokens.space.sm, paddingVertical: tokens.space.xs } });
