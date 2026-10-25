// Browser previews persist the image bytes with SQLite rather than temporary blob URLs.
import { validateDataUri } from '../documents/model';
export async function persistPhoto(uri: string): Promise<string> {
  if (uri.startsWith('data:image/')) { validateDataUri(uri); return uri; }
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Fotografija nije dostupna');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/') || blob.size > 12 * 1024 * 1024) throw new Error('Fotografija nije podržana');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Fotografija nije učitana'));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
export async function removePhoto(_uri: string) { /* Bytes disappear with the owning database row. */ }
