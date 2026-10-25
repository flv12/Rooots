import type { CareLog, CareType, Plant } from './types';
import {
  effectiveWaterInterval,
  nextWateringDate,
  observedWaterRhythm,
  wateringStatus,
  type CatalogWatering,
  type ObservedRhythm,
  type WaterInterval,
  type WateringStatus,
} from './watering';

export type PlantView = {
  plant: Plant;
  lastWatered: Date | null;
  interval: WaterInterval;
  /** Measured on the care history whatever the mode, so switching mode loses nothing. */
  observed: ObservedRhythm | null;
  nextWatering: Date;
  status: WateringStatus;
};

export function lastCareDate(logs: CareLog[], plantId: string, type: CareType): Date | null {
  let latest: Date | null = null;
  for (const l of logs) {
    if (l.plantId !== plantId || l.type !== type) continue;
    const d = new Date(l.doneAt);
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

export function buildPlantView(
  plant: Plant,
  logs: CareLog[],
  catalogFor: (catalogId: string) => CatalogWatering | undefined,
  today: Date,
): PlantView {
  const catalog = plant.catalogId ? catalogFor(plant.catalogId) : undefined;
  const lastWatered = lastCareDate(logs, plant.id, 'water');
  const createdAt = new Date(plant.createdAt);
  const observed = observedWaterRhythm(
    logs.filter((l) => l.plantId === plant.id && l.type === 'water').map((l) => new Date(l.doneAt)),
    today,
  );
  const settings = { waterEveryDays: plant.waterEveryDays, waterObserved: plant.waterObserved };
  const nextWatering = nextWateringDate({ ...settings, createdAt }, lastWatered, catalog, observed);
  return {
    plant,
    lastWatered,
    interval: effectiveWaterInterval(settings, catalog, lastWatered ?? createdAt, observed),
    observed,
    nextWatering,
    status: wateringStatus(nextWatering, today),
  };
}

export function buildPlantViews(
  plants: Plant[],
  logs: CareLog[],
  catalogFor: (catalogId: string) => CatalogWatering | undefined,
  today: Date,
): PlantView[] {
  return plants
    .filter((p) => !p.archived)
    .map((p) => buildPlantView(p, logs, catalogFor, today))
    .sort((a, b) => a.nextWatering.getTime() - b.nextWatering.getTime());
}
