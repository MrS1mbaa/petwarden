export const migration2 = `
CREATE TABLE pet_health_notes (
  pet_id INTEGER PRIMARY KEY NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  allergies TEXT NOT NULL DEFAULT '' CHECK(length(allergies) <= 1000),
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 2000)
);
PRAGMA user_version = 2;
`;
