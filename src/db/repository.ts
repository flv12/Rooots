import type { CareLog, CareType, Plant } from '@/domain/types';

import type { SqlDb } from './types';

export type Settings = { remindersEnabled: boolean; reminderHour: number; reminderMinute: number };

export const defaultSettings: Settings = {
  remindersEnabled: true,
  reminderHour: 9,
  reminderMinute: 0,
};

export type AppData = { plants: Plant[]; logs: CareLog[]; settings: Settings };

type PlantRow = {
  id: string;
  catalog_id: string | null;
  name: string;
  species: string | null;
  location: string | null;
  photo_path: string | null;
  water_every_days: number | null;
  notes: string | null;
  created_at: string;
  adopted_at: string | null;
  archived: number;
};

type LogRow = {
  id: string;
  plant_id: string;
  type: CareType;
  done_at: string;
  note: string | null;
};

const toPlant = (r: PlantRow): Plant => ({
  id: r.id,
  catalogId: r.catalog_id,
  name: r.name,
  species: r.species,
  location: r.location,
  photoPath: r.photo_path,
  waterEveryDays: r.water_every_days,
  notes: r.notes,
  createdAt: r.created_at,
  adoptedAt: r.adopted_at ?? r.created_at,
  archived: r.archived === 1,
});

const toLog = (r: LogRow): CareLog => ({
  id: r.id,
  plantId: r.plant_id,
  type: r.type,
  doneAt: r.done_at,
  note: r.note,
});

export async function loadState(db: SqlDb): Promise<AppData> {
  const plants = await db.getAllAsync<PlantRow>('SELECT * FROM plants ORDER BY created_at', []);
  const logs = await db.getAllAsync<LogRow>('SELECT * FROM care_logs ORDER BY done_at', []);
  const settingRows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
    [],
  );
  const stored = Object.fromEntries(
    settingRows.filter((r) => r.key in defaultSettings).map((r) => [r.key, JSON.parse(r.value)]),
  );
  return {
    plants: plants.map(toPlant),
    logs: logs.map(toLog),
    settings: { ...defaultSettings, ...stored },
  };
}

export async function savePlant(db: SqlDb, p: Plant): Promise<void> {
  await db.runAsync(
    `INSERT INTO plants
       (id, catalog_id, name, species, location, photo_path, water_every_days, notes, created_at, adopted_at, archived)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       catalog_id = excluded.catalog_id, name = excluded.name, species = excluded.species,
       location = excluded.location, photo_path = excluded.photo_path,
       water_every_days = excluded.water_every_days, notes = excluded.notes,
       adopted_at = excluded.adopted_at, archived = excluded.archived`,
    [
      p.id,
      p.catalogId,
      p.name,
      p.species,
      p.location,
      p.photoPath,
      p.waterEveryDays,
      p.notes,
      p.createdAt,
      p.adoptedAt,
      p.archived ? 1 : 0,
    ],
  );
}

export async function insertLog(db: SqlDb, l: CareLog): Promise<void> {
  await db.runAsync(
    'INSERT INTO care_logs (id, plant_id, type, done_at, note) VALUES (?, ?, ?, ?, ?)',
    [l.id, l.plantId, l.type, l.doneAt, l.note],
  );
}

export async function deleteLog(db: SqlDb, id: string): Promise<void> {
  await db.runAsync('DELETE FROM care_logs WHERE id = ?', [id]);
}

export async function saveSettings(db: SqlDb, settings: Settings): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(settings)) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, JSON.stringify(value)],
      );
    }
  });
}

/** Wipes plants and logs (not settings) and inserts the given data. */
export async function replaceAll(
  db: SqlDb,
  data: { plants: Plant[]; logs: CareLog[] },
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM care_logs; DELETE FROM plants;');
    for (const p of data.plants) await savePlant(db, p);
    for (const l of data.logs) await insertLog(db, l);
  });
}

/** Internal flags (not user settings), stored alongside settings with a `meta:` prefix. */
export async function getMeta(db: SqlDb, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [`meta:${key}`],
  );
  return row?.value ?? null;
}

export async function setMeta(db: SqlDb, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [`meta:${key}`, value],
  );
}
