import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { speciesList } from './species';

export const pets = sqliteTable('pets', {
  id: integer('id').primaryKey({ autoIncrement: true }), name: text('name').notNull(),
  species: text('species', { enum: speciesList }).notNull(), breed: text('breed').notNull(),
  birthDate: text('birth_date'), photoUri: text('photo_uri'), createdAt: text('created_at').notNull(),
});
const petId = () => integer('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' });
export const careTasks = sqliteTable('care_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }), petId: petId(),
  type: text('type', { enum: ['meal', 'walk', 'other'] }).notNull(), title: text('title').notNull(),
  time: text('time').notNull(), repeatRule: text('repeat_rule').notNull(), active: integer('active', { mode: 'boolean' }).notNull().default(true),
});
export const taskLogs = sqliteTable('task_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }), taskId: integer('task_id').notNull().references(() => careTasks.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), doneAt: text('done_at').notNull(),
}, table => [uniqueIndex('task_logs_task_date').on(table.taskId, table.date)]);
export const weights = sqliteTable('weights', {
  id: integer('id').primaryKey({ autoIncrement: true }), petId: petId(), valueKg: real('value_kg').notNull(), date: text('date').notNull(),
});
export const vaccines = sqliteTable('vaccines', {
  id: integer('id').primaryKey({ autoIncrement: true }), petId: petId(), name: text('name').notNull(),
  givenAt: text('given_at'), nextDueAt: text('next_due_at'), notes: text('notes').notNull().default(''),
});
export const vetVisits = sqliteTable('vet_visits', {
  id: integer('id').primaryKey({ autoIncrement: true }), petId: petId(), date: text('date').notNull(),
  clinic: text('clinic').notNull(), reason: text('reason').notNull(), notes: text('notes').notNull().default(''),
});
export const medications = sqliteTable('medications', {
  id: integer('id').primaryKey({ autoIncrement: true }), petId: petId(), name: text('name').notNull(),
  dose: text('dose').notNull(), schedule: text('schedule').notNull(), startDate: text('start_date').notNull(), endDate: text('end_date'),
});
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }), petId: petId(), title: text('title').notNull(), uri: text('uri').notNull(), createdAt: text('created_at').notNull(),
});
export const moods = sqliteTable('moods', {
  id: integer('id').primaryKey({ autoIncrement: true }), petId: petId(), mood: text('mood').notNull(), date: text('date').notNull(),
}, table => [uniqueIndex('moods_pet_date').on(table.petId, table.date)]);
export const settings = sqliteTable('settings', { key: text('key').primaryKey(), value: text('value').notNull() });
export const petHealthNotes = sqliteTable('pet_health_notes', { petId: integer('pet_id').primaryKey().notNull().references(() => pets.id, { onDelete: 'cascade' }), allergies: text('allergies').notNull().default(''), notes: text('notes').notNull().default('') });

export type Pet = typeof pets.$inferSelect;
export type { Species } from './species';
