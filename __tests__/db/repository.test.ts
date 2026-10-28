import { migrate, migrations, SCHEMA_VERSION } from '@/db/migrations';
import {
  deleteLog,
  deleteNote,
  deletePhotoRow,
  getMeta,
  insertLog,
  insertPhoto,
  loadState,
  replaceAll,
  saveNote,
  saveSettings,
  savePlant,
  setMeta,
  setPrimaryPhoto,
} from '@/db/repository';
import type { SqlDb } from '@/db/types';
import type { CareLog, Plant, PlantNote, PlantPhoto } from '@/domain/types';

import { openTestDb } from '../helpers/node-sqlite';

const plant = (over: Partial<Plant> = {}): Plant => ({
  id: 'p1',
  catalogId: 'monstera-deliciosa',
  name: 'Monique',
  species: null,
  location: 'Salon',
  photoPath: 'photos/p1.jpg',
  waterEveryDays: null,
  waterObserved: false,
  notes: null,
  createdAt: '2026-06-01T08:00:00.000Z',
  adoptedAt: '2025-03-14T12:00:00.000Z',
  archived: false,
  archivedAt: null,
  ...over,
});

const log = (over: Partial<CareLog> = {}): CareLog => ({
  id: 'l1',
  plantId: 'p1',
  type: 'water',
  doneAt: '2026-06-02T08:00:00.000Z',
  note: null,
  ...over,
});

const photo = (over: Partial<PlantPhoto> = {}): PlantPhoto => ({
  id: 'ph1',
  plantId: 'p1',
  path: 'photos/p1-1.jpg',
  takenAt: '2026-09-03T10:00:00.000Z',
  isPrimary: false,
  ...over,
});

let db: SqlDb;

beforeEach(async () => {
  db = openTestDb();
  await migrate(db);
});

describe('migrate', () => {
  it('sets the schema version', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    expect(row?.user_version).toBe(SCHEMA_VERSION);
  });

  it('is idempotent', async () => {
    await expect(migrate(db)).resolves.toBeUndefined();
  });

  it('backfills the adoption date with the creation date', async () => {
    const old = openTestDb();
    await old.execAsync(`${migrations[0]} PRAGMA user_version = 1;`);
    await old.runAsync(
      `INSERT INTO plants (id, catalog_id, name, created_at) VALUES ('p1', 'monstera-deliciosa', 'Monique', ?)`,
      ['2026-06-01T08:00:00.000Z'],
    );
    await migrate(old);
    const { plants } = await loadState(old);
    expect(plants[0].adoptedAt).toBe('2026-06-01T08:00:00.000Z');
  });
});

const note = (over: Partial<PlantNote> = {}): PlantNote => ({
  id: 'n1',
  plantId: 'p1',
  body: 'Nouvelle feuille',
  notedAt: '2026-09-03T10:00:00.000Z',
  ...over,
});

describe('photos migration', () => {
  it('turns the existing plant photo into its first, primary photo', async () => {
    const old = openTestDb();
    await old.execAsync(`${migrations.slice(0, 4).join('\n')} PRAGMA user_version = 4;`);
    await old.runAsync(
      `INSERT INTO plants (id, catalog_id, name, photo_path, created_at) VALUES ('p1', 'monstera-deliciosa', 'Monique', 'photos/p1.jpg', ?)`,
      ['2026-06-01T08:00:00.000Z'],
    );
    await old.runAsync(
      `INSERT INTO plants (id, catalog_id, name, created_at) VALUES ('p2', 'monstera-deliciosa', 'Sans photo', ?)`,
      ['2026-06-01T08:00:00.000Z'],
    );
    await migrate(old);
    const { photos } = await loadState(old);
    expect(photos).toEqual([
      {
        id: 'first-p1',
        plantId: 'p1',
        path: 'photos/p1.jpg',
        takenAt: '2026-06-01T08:00:00.000Z',
        isPrimary: true,
      },
    ]);
  });
});

describe('repository', () => {
  it('starts empty with default settings', async () => {
    const state = await loadState(db);
    expect(state.plants).toEqual([]);
    expect(state.logs).toEqual([]);
    expect(state.settings).toEqual({ remindersEnabled: true, reminderHour: 9, reminderMinute: 0 });
  });

  it('round-trips a plant, including booleans and nulls', async () => {
    await savePlant(db, plant({ archived: true, archivedAt: '2026-09-30T18:00:00.000Z' }));
    const { plants } = await loadState(db);
    expect(plants).toEqual([plant({ archived: true, archivedAt: '2026-09-30T18:00:00.000Z' })]);
  });

  it('updates an existing plant on save', async () => {
    await savePlant(db, plant());
    await savePlant(db, plant({ name: 'Momo', waterEveryDays: 5, waterObserved: true }));
    const { plants } = await loadState(db);
    expect(plants).toEqual([plant({ name: 'Momo', waterEveryDays: 5, waterObserved: true })]);
  });

  it('rejects a manual plant without watering frequency', async () => {
    await expect(savePlant(db, plant({ catalogId: null, waterEveryDays: null }))).rejects.toThrow();
  });

  it('stores and deletes care logs', async () => {
    await savePlant(db, plant());
    await insertLog(db, log());
    await insertLog(db, log({ id: 'l2', type: 'fertilize' }));
    await deleteLog(db, 'l1');
    const { logs } = await loadState(db);
    expect(logs).toEqual([log({ id: 'l2', type: 'fertilize' })]);
  });

  it('stores photos, switches the primary one and deletes', async () => {
    await savePlant(db, plant());
    await insertPhoto(db, photo({ isPrimary: true }));
    await insertPhoto(db, photo({ id: 'ph2', takenAt: '2026-09-28T10:00:00.000Z' }));
    await setPrimaryPhoto(db, 'p1', 'ph2');
    let { photos } = await loadState(db);
    expect(photos.map((p) => [p.id, p.isPrimary])).toEqual([
      ['ph1', false],
      ['ph2', true],
    ]);
    await deletePhotoRow(db, 'ph2');
    await setPrimaryPhoto(db, 'p1', 'ph1');
    photos = (await loadState(db)).photos;
    expect(photos.map((p) => [p.id, p.isPrimary])).toEqual([['ph1', true]]);
  });

  it('stores, edits and deletes notes', async () => {
    await savePlant(db, plant());
    await saveNote(db, note());
    await saveNote(
      db,
      note({ id: 'n2', body: 'Feuilles jaunies', notedAt: '2026-09-10T10:00:00.000Z' }),
    );
    await saveNote(db, note({ body: 'Deux nouvelles feuilles' }));
    await deleteNote(db, 'n2');
    expect((await loadState(db)).notes).toEqual([note({ body: 'Deux nouvelles feuilles' })]);
  });

  it('deletes notes with their plant', async () => {
    await savePlant(db, plant());
    await saveNote(db, note());
    await db.runAsync('DELETE FROM plants WHERE id = ?', ['p1']);
    expect((await loadState(db)).notes).toEqual([]);
  });

  it('deletes photos with their plant', async () => {
    await savePlant(db, plant());
    await insertPhoto(db, photo());
    await db.runAsync('DELETE FROM plants WHERE id = ?', ['p1']);
    expect((await loadState(db)).photos).toEqual([]);
  });

  it('round-trips settings', async () => {
    const settings = { remindersEnabled: false, reminderHour: 7, reminderMinute: 30 };
    await saveSettings(db, settings);
    expect((await loadState(db)).settings).toEqual(settings);
  });

  it('replaces all plants and logs at once, keeping settings', async () => {
    await saveSettings(db, { remindersEnabled: false, reminderHour: 7, reminderMinute: 30 });
    await savePlant(db, plant());
    await insertLog(db, log());
    await insertPhoto(db, photo());
    await saveNote(db, note());
    await replaceAll(db, {
      plants: [plant({ id: 'p2' })],
      logs: [log({ id: 'l9', plantId: 'p2' })],
    });
    const state = await loadState(db);
    expect(state.plants.map((p) => p.id)).toEqual(['p2']);
    expect(state.logs.map((l) => l.id)).toEqual(['l9']);
    expect(state.photos).toEqual([]);
    expect(state.notes).toEqual([]);
    expect(state.settings.reminderHour).toBe(7);
  });
});

describe('meta flags', () => {
  it('are stored without leaking into settings', async () => {
    expect(await getMeta(db, 'seeded')).toBeNull();
    await setMeta(db, 'seeded', '1');
    expect(await getMeta(db, 'seeded')).toBe('1');
    expect(Object.keys((await loadState(db)).settings)).toEqual([
      'remindersEnabled',
      'reminderHour',
      'reminderMinute',
    ]);
  });
});
