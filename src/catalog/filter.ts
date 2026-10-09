import type { Category, CatalogPlant } from './schema';
import { searchCatalog } from './search';

export type CatalogFilters = {
  query: string;
  category: Category | null;
  easy: boolean;
  lowLight: boolean;
  petSafe: boolean;
};

/** Display order of the categories in the catalog. */
export const CATEGORY_ORDER: Category[] = [
  'foliage',
  'succulent',
  'flowering',
  'palm',
  'fern',
  'carnivorous',
  'edible',
];

export function filterCatalog(plants: CatalogPlant[], f: CatalogFilters): CatalogPlant[] {
  return searchCatalog(plants, f.query).filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.easy || p.difficulty === 'easy') &&
      (!f.lowLight || p.light === 'low' || p.light === 'medium') &&
      (!f.petSafe || p.pet_toxic === 'no'),
  );
}

/** Active plants per category, in display order, without empty categories. */
export function categoryCounts(plants: CatalogPlant[]): [Category, number][] {
  const counts = new Map<Category, number>();
  for (const p of plants) {
    if (p.status === 'active') counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return CATEGORY_ORDER.filter((c) => counts.has(c)).map((c) => [c, counts.get(c) ?? 0]);
}
