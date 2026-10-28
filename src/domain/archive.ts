import type { Plant } from './types';

/** Archived plants, most recently archived first; those archived before the date was recorded come last. */
export function archivedPlants(plants: Plant[]): Plant[] {
  return plants
    .filter((p) => p.archived)
    .sort((a, b) => {
      if (a.archivedAt && b.archivedAt) return b.archivedAt.localeCompare(a.archivedAt);
      if (a.archivedAt) return -1;
      if (b.archivedAt) return 1;
      return a.name.localeCompare(b.name, 'fr');
    });
}
