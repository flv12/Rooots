import type { CatalogWatering } from '@/domain/watering';

import raw from '../../assets/catalog/catalog.json';
import { catalogPhotos } from './photos.generated';
import { catalogFileSchema, type CatalogPlant } from './schema';

const parsed = catalogFileSchema.parse(raw);

export const catalogPlants: CatalogPlant[] = parsed.plants;

const byId = new Map(catalogPlants.map((p) => [p.id, p]));

export function getCatalogPlant(id: string): CatalogPlant | undefined {
  return byId.get(id);
}

export function catalogWatering(id: string): CatalogWatering | undefined {
  const p = byId.get(id);
  return p
    ? {
        waterEveryDaysSummer: p.water_every_days_summer,
        waterEveryDaysWinter: p.water_every_days_winter,
      }
    : undefined;
}

export function catalogDisplayName(p: CatalogPlant): string {
  return p.common_names_fr[0] ?? p.latin_name;
}

export function catalogPhotoSources(id: string): number[] {
  return catalogPhotos[id] ?? [];
}

export type { CatalogPlant } from './schema';
