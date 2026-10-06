import { buildPlantViews, lastCareDate } from '@/domain/plant-views';
import type { CareLog, Plant } from '@/domain/types';

const plant = (over: Partial<Plant>): Plant => ({
  id: 'p',
  catalogId: null,
  name: 'Plante',
  species: null,
  location: null,
  photoPath: null,
  waterEveryDays: 7,
  notes: null,
  createdAt: new Date(2026, 5, 1, 10).toISOString(),
  archived: false,
  ...over,
});

const log = (plantId: string, type: CareLog['type'], day: number): CareLog => ({
  id: `${plantId}-${type}-${day}`,
  plantId,
  type,
  doneAt: new Date(2026, 5, day, 9).toISOString(),
  note: null,
});

const today = new Date(2026, 5, 15, 12);
const noCatalog = () => undefined;

describe('lastCareDate', () => {
  it('returns the most recent log of the given type only', () => {
    const logs = [log('a', 'water', 3), log('a', 'water', 10), log('a', 'fertilize', 12)];
    expect(lastCareDate(logs, 'a', 'water')).toEqual(new Date(2026, 5, 10, 9));
  });

  it('returns null when there is no log of that type', () => {
    expect(lastCareDate([log('a', 'fertilize', 2)], 'a', 'water')).toBeNull();
  });
});

describe('buildPlantViews', () => {
  it('sorts plants by next watering date, overdue first', () => {
    const plants = [
      plant({ id: 'later', waterEveryDays: 10 }),
      plant({ id: 'overdue', waterEveryDays: 3 }),
      plant({ id: 'today', waterEveryDays: 5 }),
    ];
    const logs = [
      log('later', 'water', 14),
      log('overdue', 'water', 10),
      log('today', 'water', 10),
    ];
    const views = buildPlantViews(plants, logs, noCatalog, today);
    expect(views.map((v) => [v.plant.id, v.status.kind])).toEqual([
      ['overdue', 'overdue'],
      ['today', 'today'],
      ['later', 'upcoming'],
    ]);
  });

  it('excludes archived plants', () => {
    const views = buildPlantViews([plant({ archived: true })], [], noCatalog, today);
    expect(views).toEqual([]);
  });

  it('uses catalog intervals when the plant has no override', () => {
    const catalog = () => ({ waterEveryDaysSummer: 4, waterEveryDaysWinter: 8 });
    const views = buildPlantViews(
      [plant({ catalogId: 'x', waterEveryDays: null })],
      [log('p', 'water', 12)],
      catalog,
      today,
    );
    expect(views[0].nextWatering).toEqual(new Date(2026, 5, 16));
    expect(views[0].interval).toEqual({ days: 4, source: 'catalog' });
  });
});
