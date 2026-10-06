import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import { seasonOf } from './season';

export const DEFAULT_WATER_INTERVAL_DAYS = 7;

export type CatalogWatering = {
  waterEveryDaysSummer: number;
  waterEveryDaysWinter: number;
};

export type WaterIntervalSource = 'override' | 'catalog' | 'fallback';

export type WaterInterval = { days: number; source: WaterIntervalSource };

export type WateringStatusKind = 'overdue' | 'today' | 'upcoming';

/** `days` is the calendar-day distance from today (negative when overdue). */
export type WateringStatus = { kind: WateringStatusKind; days: number };

export function effectiveWaterInterval(
  plant: { waterEveryDays: number | null },
  catalog: CatalogWatering | null | undefined,
  date: Date,
): WaterInterval {
  if (plant.waterEveryDays != null) {
    return { days: plant.waterEveryDays, source: 'override' };
  }
  if (catalog) {
    const days =
      seasonOf(date) === 'summer' ? catalog.waterEveryDaysSummer : catalog.waterEveryDaysWinter;
    return { days, source: 'catalog' };
  }
  return { days: DEFAULT_WATER_INTERVAL_DAYS, source: 'fallback' };
}

export function nextWateringDate(
  plant: { waterEveryDays: number | null; createdAt: Date },
  lastWateredAt: Date | null,
  catalog: CatalogWatering | null | undefined,
): Date {
  const base = lastWateredAt ?? plant.createdAt;
  const interval = effectiveWaterInterval(plant, catalog, base);
  return addDays(startOfDay(base), interval.days);
}

export function wateringStatus(next: Date, today: Date): WateringStatus {
  const days = differenceInCalendarDays(next, today);
  if (days < 0) return { kind: 'overdue', days };
  if (days === 0) return { kind: 'today', days };
  return { kind: 'upcoming', days };
}
