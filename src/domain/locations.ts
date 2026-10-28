import type { Plant } from './types';

export type PlantLocation = { key: string; label: string; count: number };

/** Case and surrounding spaces do not matter: « Salon » and « salon » are the same place. */
export const locationKey = (location: string): string => location.trim().toLowerCase();

/** Locations that hold at least one active plant, alphabetical. Plants without a location are ignored. */
export function plantLocations(plants: Plant[]): PlantLocation[] {
  const byKey = new Map<string, PlantLocation>();
  for (const { location, archived } of plants) {
    const label = location?.trim();
    if (!label || archived) continue;
    const key = locationKey(label);
    const known = byKey.get(key);
    if (known) known.count += 1;
    else byKey.set(key, { key, label, count: 1 });
  }
  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

/** Keeps the plants in the checked locations; with nothing checked, keeps everything. */
export function filterByLocations<T extends { plant: Plant }>(
  items: T[],
  checked: ReadonlySet<string>,
): T[] {
  if (checked.size === 0) return items;
  return items.filter(({ plant }) => plant.location && checked.has(locationKey(plant.location)));
}
