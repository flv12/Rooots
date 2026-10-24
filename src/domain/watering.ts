import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import { seasonOf } from './season';

export const DEFAULT_WATER_INTERVAL_DAYS = 7;

export type CatalogWatering = {
  waterEveryDaysSummer: number;
  waterEveryDaysWinter: number;
};

export type WaterIntervalSource = 'observed' | 'override' | 'catalog' | 'fallback';

export type WaterInterval = { days: number; source: WaterIntervalSource };

export type WateringStatusKind = 'overdue' | 'today' | 'upcoming';

/** `days` is the calendar-day distance from today (negative when overdue). */
export type WateringStatus = { kind: WateringStatusKind; days: number };

/** Rhythm measured on the plant's own history: `days` is the median gap over `gaps` gaps. */
export type ObservedRhythm = { days: number; gaps: number };

/** Only recent waterings count: the plant's needs change with the seasons and the place. */
export const OBSERVED_WINDOW_DAYS = 90;
export const OBSERVED_MIN_GAPS = 3;
/** Two waterings less than this apart are one watering entered twice. */
const OBSERVED_MIN_GAP_DAYS = 2;

/**
 * Median number of days between waterings over the last 90 days, or null while there are fewer
 * than 3 usable gaps. The median shrugs off a holiday or a forgotten watering logged late.
 */
export function observedWaterRhythm(wateredAt: Date[], today: Date): ObservedRhythm | null {
  const days = wateredAt.map((d) => startOfDay(d)).sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < days.length; i++) {
    if (differenceInCalendarDays(today, days[i]) > OBSERVED_WINDOW_DAYS) continue;
    const gap = differenceInCalendarDays(days[i], days[i - 1]);
    if (gap >= OBSERVED_MIN_GAP_DAYS) gaps.push(gap);
  }
  if (gaps.length < OBSERVED_MIN_GAPS) return null;
  gaps.sort((a, b) => a - b);
  const mid = gaps.length >> 1;
  const median = gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
  return { days: Math.round(median), gaps: gaps.length };
}

export function effectiveWaterInterval(
  plant: { waterEveryDays: number | null; waterObserved?: boolean },
  catalog: CatalogWatering | null | undefined,
  date: Date,
  observed?: ObservedRhythm | null,
): WaterInterval {
  if (plant.waterObserved && observed) {
    return { days: observed.days, source: 'observed' };
  }
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
  plant: { waterEveryDays: number | null; waterObserved?: boolean; createdAt: Date },
  lastWateredAt: Date | null,
  catalog: CatalogWatering | null | undefined,
  observed?: ObservedRhythm | null,
): Date {
  const base = lastWateredAt ?? plant.createdAt;
  const interval = effectiveWaterInterval(plant, catalog, base, observed);
  return addDays(startOfDay(base), interval.days);
}

export function wateringStatus(next: Date, today: Date): WateringStatus {
  const days = differenceInCalendarDays(next, today);
  if (days < 0) return { kind: 'overdue', days };
  if (days === 0) return { kind: 'today', days };
  return { kind: 'upcoming', days };
}
