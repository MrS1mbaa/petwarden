import { openDatabaseAsync, type SQLiteBindParams, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle, type SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import { migration1 } from './migrations/0001';
import { migration2 } from './migrations/0002';
import { migration3 } from './migrations/0003';

type Database = SqliteRemoteDatabase<typeof schema>;
type Connection = { db: Database; sqlite: SQLiteDatabase };
let opening: Promise<Connection> | null = null;
let queue: Promise<unknown> = Promise.resolve();
function openConnection(): Promise<Connection> {
  if (!opening) {
    opening = (async () => {
      const sqlite = await openDatabaseAsync('petwarden.db');
      try {
        await sqlite.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
        const version = await sqlite.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
        if ((version?.user_version ?? 0) > 3) throw new Error('Baza je iz novije verzije aplikacije.');
        if ((version?.user_version ?? 0) < 1) {
          await sqlite.withTransactionAsync(async () => { await sqlite.execAsync(migration1); });
        }
        if ((version?.user_version ?? 0) < 2) {
          await sqlite.withTransactionAsync(async () => { await sqlite.execAsync(migration2); });
        }
        if ((version?.user_version ?? 0) < 3) {
          // Table rebuild: foreign keys must be off or DROP TABLE would cascade-delete every pet's records.
          await sqlite.execAsync('PRAGMA foreign_keys = OFF;');
          try { await sqlite.withTransactionAsync(async () => { await sqlite.execAsync(migration3); }); } finally { await sqlite.execAsync('PRAGMA foreign_keys = ON;'); }
        }
        // Official async Drizzle adapter, backed by the same local Expo SQLite connection.
        // No sync queries / SharedArrayBuffer requirement on browser previews.
        const db = drizzle(async (query, params, method) => {
          const statement = await sqlite.prepareAsync(query);
          try {
            const result = await statement.executeForRawResultAsync<unknown[]>(params as SQLiteBindParams);
            const rows = await result.getAllAsync();
            return { rows: method === 'get' ? rows[0] : rows };
          } finally { await statement.finalizeAsync(); }
        }, { schema });
        return { db, sqlite };
      } catch (error) {
        await sqlite.closeAsync().catch(() => {});
        throw error;
      }
    })().catch(error => { opening = null; throw error; });
  }
  return opening;
}

// ponytail: one local connection; serialize repositories so async transactions cannot
// absorb unrelated reads/writes. Use separate connections only if throughput needs it.
export function withDatabase<T>(work: (db: Database) => Promise<T>): Promise<T> {
  const result = queue.then(async () => work((await openConnection()).db));
  queue = result.then(() => undefined, () => undefined);
  return result;
}
export function withTransaction<T>(work: (db: Database) => Promise<T>): Promise<T> {
  return withDatabase(async db => {
    const { sqlite } = await openConnection();
    let result: T | undefined;
    await sqlite.withTransactionAsync(async () => { result = await work(db); });
    return result as T;
  });
}
