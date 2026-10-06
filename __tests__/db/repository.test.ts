import { migrate, SCHEMA_VERSION } from '@/db/migrations';
import {
  deleteLog,
  getMeta,
  insertLog,
  loadState,
  replaceAll,
  saveSettings,
  savePlant,
  setMeta,
} from '@/db/repository';
import type { SqlDb } from '@/db/types';
import type { CareLog, Plant } from '@/domain/types';

import { openTestDb } from '../helpers/node-sqlite';

const plant = (over: Partial<Plant> = {}): Plant => ({
  id: 'p1',
  catalogId: 'monstera-deliciosa',
  name: 'Monique',
  species: null,
  location: 'Salon',
  photoPath: 'photos/p1.jpg',
  waterEveryDays: null,
  notes: null,
  createdAt: '2026-06-01T08:00:00.000Z',
  archived: false,
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
});

describe('repository', () => {
  it('starts empty with default settings', async () => {
    const state = await loadState(db);
    expect(state.plants).toEqual([]);
    expect(state.logs).toEqual([]);
    expect(state.settings).toEqual({ remindersEnabled: true, reminderHour: 9, reminderMinute: 0 });
  });

  it('round-trips a plant, including booleans and nulls', async () => {
    await savePlant(db, plant({ archived: true }));
    const { plants } = await loadState(db);
    expect(plants).toEqual([plant({ archived: true })]);
  });

  it('updates an existing plant on save', async () => {
    await savePlant(db, plant());
    await savePlant(db, plant({ name: 'Momo', waterEveryDays: 5 }));
    const { plants } = await loadState(db);
    expect(plants).toEqual([plant({ name: 'Momo', waterEveryDays: 5 })]);
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

  it('round-trips settings', async () => {
    const settings = { remindersEnabled: false, reminderHour: 7, reminderMinute: 30 };
    await saveSettings(db, settings);
    expect((await loadState(db)).settings).toEqual(settings);
  });

  it('replaces all plants and logs at once, keeping settings', async () => {
    await saveSettings(db, { remindersEnabled: false, reminderHour: 7, reminderMinute: 30 });
    await savePlant(db, plant());
    await insertLog(db, log());
    await replaceAll(db, {
      plants: [plant({ id: 'p2' })],
      logs: [log({ id: 'l9', plantId: 'p2' })],
    });
    const state = await loadState(db);
    expect(state.plants.map((p) => p.id)).toEqual(['p2']);
    expect(state.logs.map((l) => l.id)).toEqual(['l9']);
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
