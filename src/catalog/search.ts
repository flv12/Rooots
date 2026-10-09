import type { CatalogPlant } from './schema';

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function haystack(plant: CatalogPlant): string {
  return normalizeText(
    [plant.latin_name, ...plant.synonyms, ...plant.common_names_fr, ...plant.common_names_en].join(
      ' | ',
    ),
  );
}

export function searchCatalog(plants: CatalogPlant[], query: string): CatalogPlant[] {
  const q = normalizeText(query);
  return plants.filter((p) => p.status === 'active' && (q === '' || haystack(p).includes(q)));
}
