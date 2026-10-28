import { normalizeText } from '@/catalog/search';
import type { CatalogPlant } from '@/catalog/schema';

import { seasonOf } from './season';
import type { Plant } from './types';

type LinkPlant = Pick<Plant, 'species' | 'waterEveryDays' | 'waterObserved'>;
type LinkCatalog = Pick<
  CatalogPlant,
  | 'latin_name'
  | 'synonyms'
  | 'common_names_fr'
  | 'common_names_en'
  | 'water_every_days_summer'
  | 'water_every_days_winter'
>;

/** Which side wins when the plant already has a value and the catalog sheet would replace it. */
export type Choice = 'mine' | 'catalog';

export type LinkConflicts = {
  /** The fixed number of days the plant is watered every, if it has one. */
  frequency: number | null;
  /** The species the user typed by hand, if it is not simply a name of the catalog plant. */
  species: string | null;
};

export type LinkChoices = { frequency: Choice; species: Choice };

/** What linking would overwrite. Photos, notes, care and the nickname are never touched. */
export function linkConflicts(plant: LinkPlant, catalog: LinkCatalog): LinkConflicts {
  const fixed = plant.waterEveryDays != null && !plant.waterObserved;
  const typed = plant.species?.trim() ?? '';
  const names = [
    catalog.latin_name,
    ...catalog.synonyms,
    ...catalog.common_names_fr,
    ...catalog.common_names_en,
  ].map(normalizeText);
  return {
    frequency: fixed ? plant.waterEveryDays : null,
    species: typed && !names.includes(normalizeText(typed)) ? typed : null,
  };
}

/** Fields to save to link the plant to a catalog sheet, given the user's choices. */
export function linkPatch(
  plant: LinkPlant,
  catalogId: string,
  conflicts: LinkConflicts,
  choices: LinkChoices,
): Pick<Plant, 'catalogId' | 'species' | 'waterEveryDays' | 'waterObserved'> {
  const followCatalog = conflicts.frequency != null && choices.frequency === 'catalog';
  const dropSpecies = conflicts.species != null && choices.species === 'catalog';
  return {
    catalogId,
    species: dropSpecies ? null : plant.species,
    waterEveryDays: followCatalog ? null : plant.waterEveryDays,
    waterObserved: followCatalog ? false : plant.waterObserved,
  };
}

/**
 * Fields to save to remove the link, keeping everything the plant had. A manual plant must have
 * a watering frequency, so a plant following the seasons keeps today's catalog value.
 */
export function unlinkPatch(
  plant: LinkPlant,
  catalog: LinkCatalog | undefined,
  today: Date,
): { catalogId: null; species: string | null; waterEveryDays: number } {
  const seasonal = catalog
    ? seasonOf(today) === 'summer'
      ? catalog.water_every_days_summer
      : catalog.water_every_days_winter
    : null;
  return {
    catalogId: null,
    species: plant.species?.trim() || catalog?.latin_name || null,
    // Same cautious default as the catalog fallback when nothing else is known.
    waterEveryDays: plant.waterEveryDays ?? seasonal ?? 7,
  };
}
