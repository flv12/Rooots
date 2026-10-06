import type { CareLog, CareType, Plant } from './types';
import {
  effectiveWaterInterval,
  nextWateringDate,
  wateringStatus,
  type CatalogWatering,
  type WaterInterval,
  type WateringStatus,
} from './watering';

export type PlantView = {
  plant: Plant;
  lastWatered: Date | null;
  interval: WaterInterval;
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
  const nextWatering = nextWateringDate(
    { waterEveryDays: plant.waterEveryDays, createdAt },
    lastWatered,
    catalog,
  );
  return {
    plant,
    lastWatered,
    interval: effectiveWaterInterval(plant, catalog, lastWatered ?? createdAt),
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
