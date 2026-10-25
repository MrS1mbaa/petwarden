import { useState, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { BottomSheet } from '../../components/BottomSheet';
import { FormField } from '../../components/FormField';
import { PillButton } from '../../components/PillButton';
import { AppText } from '../../components/AppText';
import { copy } from '../../lib/copy';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { mimeForName } from './model';
import type { PetDocument } from '../../db/repositories/documents';
import type { PickedFile } from './useDocuments';
type Props = { record: PetDocument | null; busy: boolean; blurTarget: RefObject<View | null>; onClose: () => void; onSave: (title: string, file: PickedFile | null) => Promise<boolean>; onDelete: () => Promise<boolean>; onOpen: () => void; chooseFile: () => Promise<PickedFile | null>; choosePhoto: () => Promise<PickedFile | null> };
export function DocumentEditor({ record, busy, blurTarget, onClose, onSave, onDelete, onOpen, chooseFile, choosePhoto }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(record?.title ?? ''), [file, setFile] = useState<PickedFile | null>(null), [picking, setPicking] = useState(false), [error, setError] = useState<string | null>(null), [confirm, setConfirm] = useState(false);
  const choose = async (picker: Props['chooseFile']) => { if (picking) return; setPicking(true); setError(null); try { const chosen = await picker(); if (chosen) { setFile(chosen); if (!title) setTitle(chosen.name.replace(/\.[^.]+$/, '').slice(0, 150)); } } catch (cause) { setError(cause instanceof Error && cause.message === copy.onboarding.photoPermission ? cause.message : copy.documents.invalidFile); } finally { setPicking(false); } };
  const save = async () => { try { if (await onSave(title, file)) onClose(); } catch (cause) { setError(cause instanceof Error && [copy.documents.invalidName, copy.documents.invalidFile].includes(cause.message as typeof copy.documents.invalidName) ? cause.message : copy.documents.saveError); } };
  const image = record && (record.uri.startsWith('data:image/') || mimeForName(record.uri).startsWith('image/'));
  return <BottomSheet open title={confirm ? copy.documents.removeTitle : record ? copy.documents.rename : copy.documents.add} onClose={onClose} canClose={!busy && !picking} blurTarget={blurTarget}>
    {confirm ? <><AppText>{copy.documents.removeBody}</AppText><PillButton label={copy.documents.remove} disabled={busy} onPress={() => { void onDelete().then(done => { if (done) onClose(); }, () => setError(copy.documents.saveError)); }} /><PillButton label={copy.homeCare.cancel} selected={false} disabled={busy} onPress={() => setConfirm(false)} /></> : <>
      {image && <Image source={{ uri: record.uri }} contentFit="contain" style={styles.preview} accessibilityLabel={record.title} />}
      <FormField label={copy.documents.name} placeholder={copy.documents.nameHint} value={title} onChangeText={setTitle} editable={!busy && !picking} maxLength={150} />
      {!record && <><AppText muted>{copy.documents.hint}</AppText><PillButton label={copy.documents.file} selected={false} disabled={busy || picking} onPress={() => void choose(chooseFile)} /><PillButton label={copy.documents.photo} selected={false} disabled={busy || picking} onPress={() => void choose(choosePhoto)} />{file && <AppText accessibilityLiveRegion="polite">{file.name || copy.documents.selected}</AppText>}</>}
      <PillButton label={busy ? copy.documents.saving : copy.documents.save} disabled={busy || picking} onPress={() => void save()} />
      {record && <><PillButton label={copy.documents.share} selected={false} disabled={busy} onPress={onOpen} /><PillButton label={copy.documents.remove} selected={false} disabled={busy} onPress={() => setConfirm(true)} /></>}
    </>}
    {error && <AppText accessibilityRole="alert" style={{ color: colors.error }}>{error}</AppText>}
  </BottomSheet>;
}
const styles = StyleSheet.create({ preview: { width: '100%', height: tokens.documents.previewHeight, borderRadius: tokens.radius.icon } });
