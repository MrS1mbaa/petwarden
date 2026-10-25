import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { copy } from '../../lib/copy';
import { mimeForName, validateAsset, validateDataUri } from './model';
import { writeBackup, type BackupPlan } from './backupModel';
const ownedDirectory = () => new Directory(Paths.document, 'pet-documents');
export async function persistDocument(uri: string, name: string, mime?: string) {
  const source = new File(uri), type = mime || mimeForName(name);
  validateAsset(type, source.size);
  const directory = ownedDirectory(); directory.create({ idempotent: true, intermediates: true });
  const extension = type === 'application/pdf' ? 'pdf' : type.split('/')[1];
  const destination = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
  await source.copy(destination); // SDK 57: copy() is async
  return destination.uri;
}
export async function removeDocumentFile(uri: string) {
  if (!uri.startsWith(ownedDirectory().uri.replace(/\/$/, '') + '/')) return;
  const file = new File(uri); if (file.exists) file.delete();
}
function readableAsset(uri: string) {
  const file = new File(uri), mime = mimeForName(file.name);
  if (!file.exists) throw new Error(copy.documents.missing);
  validateAsset(mime, file.size);
  return { file, mime };
}
export async function assetSize(uri: string) { return readableAsset(uri).file.size; }
export async function restoreAsset(dataUri: string, folder: 'pet-photos' | 'pet-documents') {
  const { mime } = validateDataUri(dataUri);
  const directory = new Directory(Paths.document, folder); directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2)}.${mime === 'application/pdf' ? 'pdf' : mime.split('/')[1]}`);
  file.create(); file.write(dataUri.slice(dataUri.indexOf(',') + 1), { encoding: 'base64' });
  return file.uri;
}
export const readText = (uri: string) => new File(uri).text();
export async function openDocument(uri: string) {
  if (!new File(uri).exists || !await Sharing.isAvailableAsync()) throw new Error(copy.documents.missing);
  await Sharing.shareAsync(uri, { mimeType: mimeForName(new File(uri).name), dialogTitle: copy.documents.share });
}
// Streams the backup to a cache file (one asset in memory at a time), then hands it to the share sheet.
export async function exportBackupFile(plan: BackupPlan, name: string) {
  if (!await Sharing.isAvailableAsync()) throw new Error(copy.profileSettings.exportError);
  const file = new File(Paths.cache, name); file.create({ overwrite: true });
  await writeBackup(plan, async uri => { const { file: source, mime } = readableAsset(uri); return { mime, base64: await source.base64() }; }, chunk => file.write(chunk, { append: true }));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: copy.profileSettings.backup });
}
// Pickers copy every chosen file into the cache and exports leave a full unencrypted backup there; neither is needed after use.
export function clearTransientFiles() {
  for (const name of ['DocumentPicker', 'ImagePicker']) { const directory = new Directory(Paths.cache, name); if (directory.exists) directory.delete(); }
  for (const item of new Directory(Paths.cache).list()) if (item instanceof File && /^petwarden-\d{4}-\d{2}-\d{2}\.json$/.test(item.name)) item.delete();
}
