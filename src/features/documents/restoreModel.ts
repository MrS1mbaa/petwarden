import { isSpecies } from '../../db/species.ts';
import { copy } from '../../lib/copy.ts';
import { maxBackupBytes, validateDataUri } from './model.ts';
type Row = Record<string, unknown>;
const tables = ['pets', 'careTasks', 'taskLogs', 'weights', 'vaccines', 'vetVisits', 'medications', 'documents', 'moods', 'healthNotes'] as const;
// Trust boundary: the file comes from outside, so check shape, asset references and size before any write.
export function parseBackup(text: string) {
  let file: any;
  try { file = JSON.parse(text); } catch { throw new Error(copy.profileSettings.importInvalid); }
  if (!['petwarden', 'moj-ljubimac'].includes(file?.format) || file.formatVersion !== 1 || !(file.databaseVersion <= 3) || typeof file.data !== 'object' || file.data === null || typeof file.assets !== 'object' || file.assets === null) throw new Error(copy.profileSettings.importInvalid);
  const data = {} as Record<(typeof tables)[number], Row[]>;
  for (const table of tables) {
    const rows = file.data[table];
    if (!Array.isArray(rows) || rows.some(row => typeof row !== 'object' || row === null || !Number.isInteger(row.id ?? row.petId))) throw new Error(copy.profileSettings.importInvalid);
    data[table] = rows;
  }
  if (data.pets.some(pet => !isSpecies(pet.species)) || data.careTasks.some(task => !['meal', 'walk', 'other'].includes(task.type as string))) throw new Error(copy.profileSettings.importInvalid);
  const assets = file.assets as Record<string, string>;
  let total = 0;
  for (const value of Object.values(assets)) { total += validateDataUri(value).bytes; if (total > maxBackupBytes) throw new Error(copy.profileSettings.importInvalid); }
  const refs = [...data.pets.map(pet => pet.photoUri).filter(Boolean), ...data.documents.map(doc => doc.uri)];
  if (refs.some(ref => typeof ref !== 'string' || !(ref in assets))) throw new Error(copy.profileSettings.importInvalid);
  return { data, assets };
}
