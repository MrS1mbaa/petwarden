import { eq } from 'drizzle-orm';
import { withDatabase } from '../client';
import { settings } from '../schema';

export async function readSetting(key: string) {
  return withDatabase(async db => (await db.select().from(settings).where(eq(settings.key, key)).get())?.value ?? null);
}
export async function writeSetting(key: string, value: string) {
  await withDatabase(db => db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } }).run());
}
