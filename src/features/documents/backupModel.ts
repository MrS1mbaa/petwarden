import type { BackupSnapshot } from '../../db/repositories/backup';
import { copy } from '../../lib/copy.ts';
import { maxBackupBytes } from './model.ts';
export type BackupPlan = { head: Record<string, unknown>; references: Map<string, string> };
export type AssetData = { mime: string; base64: string };
// Swaps file URIs for portable `asset:N` references and enforces the size limit from file sizes alone,
// so nothing is read into memory yet. A file shared by a pet photo and a document is embedded once.
export async function backupPlan(snapshot: BackupSnapshot, sizeOf: (uri: string) => Promise<number>): Promise<BackupPlan> {
  const references = new Map<string, string>();
  let total = 0;
  const embed = async (uri: string) => {
    const known = references.get(uri); if (known) return known;
    total += await sizeOf(uri);
    if (total > maxBackupBytes) throw new Error(copy.profileSettings.exportLimit);
    const reference = `asset:${references.size + 1}`; references.set(uri, reference); return reference;
  };
  const pets = [];
  for (const pet of snapshot.pets) pets.push({ ...pet, photoUri: pet.photoUri ? await embed(pet.photoUri) : null });
  const documents = [];
  for (const record of snapshot.documents) documents.push({ ...record, uri: await embed(record.uri) });
  return { head: { format: 'petwarden', formatVersion: 1, databaseVersion: 3, exportedAt: new Date().toISOString(), data: { ...snapshot, pets, documents } }, references };
}
// Emits the backup JSON in pieces, one asset at a time, so peak memory is one file instead of the whole backup.
export async function writeBackup(plan: BackupPlan, read: (uri: string) => Promise<AssetData>, write: (chunk: string) => void) {
  write(JSON.stringify(plan.head).slice(0, -1) + ',"assets":{');
  let first = true;
  for (const [uri, reference] of plan.references) {
    const { mime, base64 } = await read(uri);
    write(`${first ? '' : ','}${JSON.stringify(reference)}:"data:${mime};base64,`);
    write(base64);
    write('"');
    first = false;
  }
  write('}}');
}
