import { Directory, File, Paths } from 'expo-file-system';
import { mimeForName, validateAsset } from '../documents/model';
import { copy } from '../../lib/copy';

export async function persistPhoto(uri: string): Promise<string> {
  const directory = new Directory(Paths.document, 'pet-photos');
  directory.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  const mime = mimeForName(source.name) || 'image/jpeg';
  if (!mime.startsWith('image/')) throw new Error(copy.documents.invalidFile);
  validateAsset(mime, source.size);
  const extension = ['.png', '.jpg', '.jpeg', '.webp', '.heic', '.heif'].includes(source.extension.toLowerCase()) ? source.extension : '.jpg';
  const destination = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  await source.copy(destination); // SDK 57: copy() is async
  return destination.uri;
}
export async function removePhoto(uri: string) {
  const directory = new Directory(Paths.document, 'pet-photos');
  if (!uri.startsWith(`${directory.uri.replace(/\/$/, '')}/`)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
