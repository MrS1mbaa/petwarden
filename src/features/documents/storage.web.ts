import { validateAsset, validateDataUri, mimeForName } from './model';
import { writeBackup, type BackupPlan } from './backupModel';
export async function assetDataUri(uri: string) {
  if (uri.startsWith('data:')) { validateDataUri(uri); return uri; }
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Fajl nije dostupan.');
  const blob = await response.blob(); validateAsset(blob.type, blob.size);
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Fajl nije učitan.')); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
}
export async function persistDocument(uri: string, name: string, mime?: string) {
  const data = await assetDataUri(uri), info = validateDataUri(data);
  if ((mime || mimeForName(name)) !== info.mime) throw new Error('Tip fajla nije podržan.');
  return data;
}
export async function removeDocumentFile(_uri: string) {}
export async function restoreAsset(dataUri: string, _folder: string) { validateDataUri(dataUri); return dataUri; }
export async function readText(uri: string) { return (await fetch(uri)).text(); }
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export async function openDocument(uri: string) { const data = await assetDataUri(uri); const response = await fetch(data); const mime = validateDataUri(data).mime; download(await response.blob(), `petwarden-document.${mime === 'application/pdf' ? 'pdf' : mime.split('/')[1]}`); }
export async function assetSize(uri: string) { return validateDataUri(await assetDataUri(uri)).bytes; }
export async function exportBackupFile(plan: BackupPlan, name: string) {
  const parts: string[] = [];
  await writeBackup(plan, async uri => { const data = await assetDataUri(uri); return { mime: validateDataUri(data).mime, base64: data.slice(data.indexOf(',') + 1) }; }, chunk => { parts.push(chunk); });
  download(new Blob(parts, { type: 'application/json' }), name);
}
export function clearTransientFiles() {}
