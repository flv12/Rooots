import type { SqlDb } from './types';

/** Each entry upgrades the schema by one version. Never edit a shipped migration: append. */
export const migrations: string[] = [
  `
  CREATE TABLE plants (
    id TEXT PRIMARY KEY NOT NULL,
    catalog_id TEXT,
    name TEXT NOT NULL,
    species TEXT,
    location TEXT,
    photo_path TEXT,
    water_every_days INTEGER CHECK (water_every_days IS NULL OR water_every_days > 0),
    notes TEXT,
    created_at TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    CHECK (catalog_id IS NOT NULL OR water_every_days IS NOT NULL)
  );
  CREATE TABLE care_logs (
    id TEXT PRIMARY KEY NOT NULL,
    plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('water', 'fertilize', 'repot', 'prune', 'other')),
    done_at TEXT NOT NULL,
    note TEXT
  );
  CREATE INDEX care_logs_by_plant ON care_logs (plant_id, type, done_at);
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  // Adoption date, editable by the user; existing plants were adopted the day they were added.
  `
  ALTER TABLE plants ADD COLUMN adopted_at TEXT;
  UPDATE plants SET adopted_at = created_at;
  `,
  // When the plant was archived; unknown (NULL) for plants archived before this version.
  `
  ALTER TABLE plants ADD COLUMN archived_at TEXT;
  `,
  // Follow the watering rhythm measured on the care history instead of the catalog or a fixed one.
  `
  ALTER TABLE plants ADD COLUMN water_observed INTEGER NOT NULL DEFAULT 0;
  `,
  // Several photos per plant. plants.photo_path stays as a copy of the primary photo's path.
  // The photo each plant already had becomes its first, primary photo.
  `
  CREATE TABLE plant_photos (
    id TEXT PRIMARY KEY NOT NULL,
    plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    photo_path TEXT NOT NULL,
    taken_at TEXT NOT NULL,
    is_primary INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX plant_photos_by_plant ON plant_photos (plant_id, taken_at);
  INSERT INTO plant_photos (id, plant_id, photo_path, taken_at, is_primary)
    SELECT 'first-' || id, id, photo_path, created_at, 1 FROM plants WHERE photo_path IS NOT NULL;
  `,
  // Dated notes about a plant (« feuilles jaunies », « nouvelle feuille »), apart from care logs.
  `
  CREATE TABLE plant_notes (
    id TEXT PRIMARY KEY NOT NULL,
    plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    noted_at TEXT NOT NULL
  );
  CREATE INDEX plant_notes_by_plant ON plant_notes (plant_id, noted_at);
  `,
];

export const SCHEMA_VERSION = migrations.length;

export async function migrate(db: SqlDb): Promise<void> {
  // Per-connection settings, must run outside a transaction.
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  let version = row?.user_version ?? 0;
  while (version < SCHEMA_VERSION) {
    const sql = migrations[version];
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
