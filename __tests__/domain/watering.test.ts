import {
  DEFAULT_WATER_INTERVAL_DAYS,
  effectiveWaterInterval,
  nextWateringDate,
  wateringStatus,
} from '@/domain/watering';

const monstera = { waterEveryDaysSummer: 7, waterEveryDaysWinter: 14 };
const summerDay = new Date(2026, 5, 15, 10);
const winterDay = new Date(2026, 11, 15, 10);

describe('effectiveWaterInterval', () => {
  it('uses the personal override when set', () => {
    expect(effectiveWaterInterval({ waterEveryDays: 3 }, monstera, summerDay)).toEqual({
      days: 3,
      source: 'override',
    });
  });

  it('uses the catalog summer value in summer', () => {
    expect(effectiveWaterInterval({ waterEveryDays: null }, monstera, summerDay)).toEqual({
      days: 7,
      source: 'catalog',
    });
  });

  it('uses the catalog winter value in winter', () => {
    expect(effectiveWaterInterval({ waterEveryDays: null }, monstera, winterDay)).toEqual({
      days: 14,
      source: 'catalog',
    });
  });

  it('falls back to a cautious default when neither override nor catalog exist', () => {
    expect(effectiveWaterInterval({ waterEveryDays: null }, null, summerDay)).toEqual({
      days: DEFAULT_WATER_INTERVAL_DAYS,
      source: 'fallback',
    });
  });
});

describe('nextWateringDate', () => {
  const createdAt = new Date(2026, 5, 1, 18, 30);

  it('counts from creation day when the plant was never watered', () => {
    const next = nextWateringDate({ waterEveryDays: null, createdAt }, null, monstera);
    expect(next).toEqual(new Date(2026, 5, 8));
  });

  it('counts from the last watering day, ignoring time of day', () => {
    const lastWateredAt = new Date(2026, 5, 10, 23, 45);
    const next = nextWateringDate({ waterEveryDays: null, createdAt }, lastWateredAt, monstera);
    expect(next).toEqual(new Date(2026, 5, 17));
  });

  it('uses the season of the last watering (September → summer interval)', () => {
    const lastWateredAt = new Date(2026, 8, 28, 9);
    const next = nextWateringDate({ waterEveryDays: null, createdAt }, lastWateredAt, monstera);
    expect(next).toEqual(new Date(2026, 9, 5));
  });

  it('uses the season of the last watering (March → winter interval)', () => {
    const lastWateredAt = new Date(2026, 2, 25, 9);
    const next = nextWateringDate({ waterEveryDays: null, createdAt }, lastWateredAt, monstera);
    expect(next).toEqual(new Date(2026, 3, 8));
  });

  it('is not shifted by the spring DST change', () => {
    // Europe/Paris switches to summer time on 2026-03-29.
    const lastWateredAt = new Date(2026, 2, 28, 0, 30);
    const next = nextWateringDate({ waterEveryDays: 2, createdAt }, lastWateredAt, null);
    expect(next).toEqual(new Date(2026, 2, 30));
  });

  it('is not shifted by the autumn DST change', () => {
    // Europe/Paris switches back to winter time on 2026-10-25.
    const lastWateredAt = new Date(2026, 9, 24, 23, 30);
    const next = nextWateringDate({ waterEveryDays: 2, createdAt }, lastWateredAt, null);
    expect(next).toEqual(new Date(2026, 9, 26));
  });

  it('uses the manual interval for a plant without catalog entry', () => {
    const next = nextWateringDate({ waterEveryDays: 5, createdAt }, null, null);
    expect(next).toEqual(new Date(2026, 5, 6));
  });
});

describe('wateringStatus', () => {
  const today = new Date(2026, 5, 15, 14);

  it('is overdue when the next watering is before today', () => {
    expect(wateringStatus(new Date(2026, 5, 13), today)).toEqual({ kind: 'overdue', days: -2 });
  });

  it('is today when the next watering is today', () => {
    expect(wateringStatus(new Date(2026, 5, 15), today)).toEqual({ kind: 'today', days: 0 });
  });

  it('is upcoming when the next watering is after today', () => {
    expect(wateringStatus(new Date(2026, 5, 18), today)).toEqual({ kind: 'upcoming', days: 3 });
  });
});
