// Numbered, immutable migration. The SQLite connection applies it atomically.
export const migration1 = `
CREATE TABLE pets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 40), species TEXT NOT NULL CHECK(species IN ('dog','cat','other')), breed TEXT NOT NULL, birth_date TEXT, photo_uri TEXT, created_at TEXT NOT NULL);
CREATE TABLE care_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK(type IN ('meal','walk','other')), title TEXT NOT NULL, time TEXT NOT NULL, repeat_rule TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)));
CREATE INDEX care_tasks_pet ON care_tasks(pet_id);
CREATE TABLE task_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES care_tasks(id) ON DELETE CASCADE, date TEXT NOT NULL, done_at TEXT NOT NULL);
CREATE UNIQUE INDEX task_logs_task_date ON task_logs(task_id,date);
CREATE TABLE weights (id INTEGER PRIMARY KEY AUTOINCREMENT, pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE, value_kg REAL NOT NULL CHECK(value_kg > 0 AND value_kg <= 500), date TEXT NOT NULL);
CREATE INDEX weights_pet_date ON weights(pet_id,date);
CREATE TABLE vaccines (id INTEGER PRIMARY KEY AUTOINCREMENT, pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE, name TEXT NOT NULL, given_at TEXT, next_due_at TEXT, notes TEXT NOT NULL DEFAULT '');
CREATE INDEX vaccines_pet ON vaccines(pet_id);
CREATE TABLE vet_visits (id INTEGER PRIMARY KEY AUTOINCREMENT, pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE, date TEXT NOT NULL, clinic TEXT NOT NULL, reason TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '');
CREATE INDEX vet_visits_pet ON vet_visits(pet_id);
CREATE TABLE medications (id INTEGER PRIMARY KEY AUTOINCREMENT, pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE, name TEXT NOT NULL, dose TEXT NOT NULL, schedule TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT);
CREATE INDEX medications_pet ON medications(pet_id);
CREATE TABLE documents (id INTEGER PRIMARY KEY AUTOINCREMENT, pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE, title TEXT NOT NULL, uri TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX documents_pet ON documents(pet_id);
CREATE TABLE moods (id INTEGER PRIMARY KEY AUTOINCREMENT, pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE, mood TEXT NOT NULL, date TEXT NOT NULL);
CREATE UNIQUE INDEX moods_pet_date ON moods(pet_id,date);
CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
PRAGMA user_version = 1;
`;
