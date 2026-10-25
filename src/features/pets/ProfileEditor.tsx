import { useState, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { BottomSheet } from '../../components/BottomSheet';
import { DateField } from '../../components/DateField';
import { FormField } from '../../components/FormField';
import { PillButton } from '../../components/PillButton';
import { speciesList } from '../../db/species';
import { BreedField } from './BreedField';
import { AppText } from '../../components/AppText';
import { copy } from '../../lib/copy';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { displayDate } from '../../lib/dates';
import type { Pet } from '../../db/schema';
import type { DetailsDraft } from './useProfileSettings';
import { pickPhoto } from './pickPhoto';
import { parseBirthDate } from './validation';

export function ProfileEditor({ pet, busy, blurTarget, onClose, onSave }: { pet: Pet; busy: boolean; blurTarget: RefObject<View | null>; onClose: () => void; onSave: (draft: DetailsDraft) => Promise<boolean> }) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<DetailsDraft>({ name: pet.name, species: pet.species, breed: pet.breed, birthDate: pet.birthDate ? displayDate(pet.birthDate).replace(/\.$/, '') : '', photoUri: pet.photoUri });
  const [picking, setPicking] = useState(false), [error, setError] = useState<string | null>(null);
  const choose = async () => { if (picking) return; setPicking(true); setError(null); try { const photoUri = await pickPhoto(); if (photoUri) setDraft(previous => ({ ...previous, photoUri })); } catch (cause) { setError(cause instanceof Error && cause.message === copy.onboarding.photoPermission ? cause.message : copy.onboarding.photoError); } finally { setPicking(false); } };
  const save = async () => { try { if (await onSave(draft)) onClose(); } catch (cause) { const allowed: readonly string[] = Object.values(copy.onboarding.validation); setError(cause instanceof Error && allowed.includes(cause.message) ? cause.message : copy.profileSettings.saveError); } };
  return <BottomSheet open title={copy.profileSettings.edit} onClose={onClose} canClose={!busy && !picking} blurTarget={blurTarget}>
    <FormField editable={!busy && !picking} label={copy.onboarding.name} value={draft.name} onChangeText={name => setDraft({ ...draft, name })} maxLength={40} />
    <View style={styles.choices}>{speciesList.map(species => <PillButton compact key={species} toggle disabled={busy || picking} label={copy.onboarding.speciesLabels[species]} selected={draft.species === species} onPress={() => setDraft({ ...draft, species, breed: species === draft.species ? draft.breed : '' })} />)}</View>
    <BreedField editable={!busy && !picking} species={draft.species} value={draft.breed} onChange={breed => setDraft({ ...draft, breed })} />
    <DateField editable={!busy && !picking} label={copy.onboarding.birthDate} value={draft.birthDate} onChange={birthDate => setDraft({ ...draft, birthDate })} validate={parseBirthDate} />
    {draft.photoUri && <Image source={{ uri: draft.photoUri }} style={styles.photo} contentFit="cover" accessibilityLabel={copy.petProfile.photo(draft.name)} />}
    <PillButton selected={false} label={draft.photoUri ? copy.onboarding.changePhoto : copy.onboarding.photo} disabled={busy || picking} onPress={() => void choose()} />
    {draft.photoUri && <PillButton selected={false} label={copy.onboarding.removePhoto} disabled={busy || picking} onPress={() => setDraft({ ...draft, photoUri: null })} />}
    {error && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{error}</AppText>}
    <PillButton label={busy ? copy.homeCare.saving : copy.homeCare.save} disabled={busy || picking} onPress={() => void save()} />
  </BottomSheet>;
}
const styles = StyleSheet.create({ choices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm }, photo: { width: tokens.size.photo, height: tokens.size.photo, borderRadius: tokens.radius.card, alignSelf: 'center' } });
