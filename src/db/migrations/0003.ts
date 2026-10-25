// Widens pets.species from dog/cat/other to the full species list. SQLite cannot alter a CHECK, so the
// table is rebuilt; the connection must have foreign_keys OFF while this runs (see client.ts).
export const migration3 = `
CREATE TABLE pets_new (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 40), species TEXT NOT NULL CHECK(species IN ('dog','cat','rabbit','hamster','guinea_pig','bird','reptile','fish','other')), breed TEXT NOT NULL, birth_date TEXT, photo_uri TEXT, created_at TEXT NOT NULL);
INSERT INTO pets_new (id,name,species,breed,birth_date,photo_uri,created_at) SELECT id,name,species,breed,birth_date,photo_uri,created_at FROM pets;
DROP TABLE pets;
ALTER TABLE pets_new RENAME TO pets;
PRAGMA user_version = 3;
`;
