import { localDate } from '../../lib/dates';
import * as DocumentPicker from 'expo-document-picker';
import { backupSnapshot, restoreSnapshot } from '../../db/repositories/backup';
import { copy } from '../../lib/copy';
import { removePhoto } from '../pets/photoStorage';
import { assetSize, exportBackupFile, readText, removeDocumentFile, restoreAsset } from './storage';
import { maxBackupBytes } from './model';
import { backupPlan } from './backupModel';
import { parseBackup } from './restoreModel';
export async function exportBackup() {
  await exportBackupFile(await backupPlan(await backupSnapshot(), assetSize), `petwarden-${localDate()}.json`);
}
// Returns false when the user cancels the picker. Files are written first and removed again if the database insert fails.
export async function importBackup() {
  const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  const file = picked.canceled ? null : picked.assets[0];
  if (!file) return false;
  if (file.size != null && file.size > maxBackupBytes * 2) throw new Error(copy.profileSettings.importInvalid);
  const { data, assets } = parseBackup(await readText(file.uri));
  const stored = new Map<string, string>();
  const put = async (ref: string, folder: 'pet-photos' | 'pet-documents') => { const key = `${folder}:${ref}`; if (!stored.has(key)) stored.set(key, await restoreAsset(assets[ref], folder)); };
  try {
    for (const pet of data.pets) if (pet.photoUri) await put(pet.photoUri as string, 'pet-photos');
    for (const doc of data.documents) await put(doc.uri as string, 'pet-documents');
    await restoreSnapshot(data, (ref, folder) => stored.get(`${folder}:${ref}`) as string);
  } catch (cause) {
    await Promise.all([...stored.values()].map(uri => Promise.all([removePhoto(uri), removeDocumentFile(uri)]).catch(() => {})));
    throw cause;
  }
  return true;
}
