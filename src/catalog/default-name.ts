import type { CatalogPlant } from './schema';

/** Name used when the user leaves the nickname empty: the usual French name, never the latin one if avoidable. */
export function defaultPlantName(
  catalog: Pick<CatalogPlant, 'common_names_fr' | 'latin_name'> | undefined,
  species: string | null,
): string {
  if (catalog) return catalog.common_names_fr[0] ?? catalog.latin_name;
  return species?.trim() || 'Ma plante';
}
