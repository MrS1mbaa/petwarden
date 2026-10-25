import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { listDocuments, saveDocument, renameDocument, deleteDocument, type PetDocument } from '../../db/repositories/documents';
import { useActivePet } from '../pets/store';
import { pickPhotoAsset } from '../pets/pickPhoto';
import { copy } from '../../lib/copy';
import { successHaptic } from '../../lib/haptics';
import { persistDocument, removeDocumentFile, openDocument } from './storage';
import { documentTitle, supportedMime, validateAsset, mimeForName } from './model';
export type PickedFile = { uri: string; name: string; mime?: string };
export function useDocuments() {
  const pet = useActivePet();
  const [snapshot, setSnapshot] = useState<{ petId: number; documents: PetDocument[] } | null>(null), [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const generation = useRef(0), lock = useRef(false);
  const load = useCallback(async () => {
    if (!pet) return;
    const request = ++generation.current;
    try { const documents = await listDocuments(pet.id); if (generation.current === request) { setSnapshot({ petId: pet.id, documents }); setError(null); } }
    catch { if (generation.current === request) setError(copy.documents.loadError); }
  }, [pet]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  const chooseFile = async (): Promise<PickedFile | null> => {
    const result = await DocumentPicker.getDocumentAsync({ type: supportedMime, copyToCacheDirectory: true, multiple: false, base64: true });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    if (asset.size != null) validateAsset(asset.mimeType || mimeForName(asset.name), asset.size);
    const uri = asset.base64 ?? asset.uri;
    if (Platform.OS === 'web' && asset.base64 && asset.uri.startsWith('blob:')) URL.revokeObjectURL(asset.uri);
    return { uri, name: asset.name, mime: asset.mimeType || mimeForName(asset.name) };
  };
  const choosePhoto = async (): Promise<PickedFile | null> => pickPhotoAsset();
  const save = async (existing: PetDocument | null, title: string, file: PickedFile | null) => {
    documentTitle(title);
    if (!pet || lock.current) return false;
    lock.current = true; setBusy(true);
    let persisted: string | null = null;
    try {
      if (existing) await renameDocument(pet.id, existing.id, title);
      else { if (!file) throw new Error(copy.documents.invalidFile); persisted = await persistDocument(file.uri, file.name, file.mime); await saveDocument(pet.id, title, persisted); }
      successHaptic(); await load(); return true;
    } catch (cause) { if (persisted) await removeDocumentFile(persisted).catch(() => {}); throw cause; }
    finally { lock.current = false; setBusy(false); }
  };
  const remove = async (record: PetDocument) => {
    if (!pet || lock.current) return false;
    lock.current = true; setBusy(true);
    try { const removed = await deleteDocument(pet.id, record.id); if (removed) await removeDocumentFile(removed.uri).catch(() => {}); await load(); successHaptic(); return true; }
    finally { lock.current = false; setBusy(false); }
  };
  const open = async (record: PetDocument) => { try { await openDocument(record.uri); } catch { setError(copy.documents.missing); } };
  return { pet, records: snapshot?.petId === pet?.id ? snapshot.documents : null, error, busy, refresh: load, chooseFile, choosePhoto, save, remove, open };
}
