import { filterByLocations, locationKey, plantLocations } from '@/domain/locations';
import type { Plant } from '@/domain/types';

const plant = (id: string, location: string | null, archived = false): Plant => ({
  id,
  catalogId: 'monstera-deliciosa',
  name: id,
  species: null,
  location,
  photoPath: null,
  waterEveryDays: null,
  waterObserved: false,
  notes: null,
  createdAt: '2026-06-01T08:00:00.000Z',
  adoptedAt: '2026-06-01T08:00:00.000Z',
  archived,
  archivedAt: null,
});

const plants = [
  plant('a', 'Salon'),
  plant('b', ' salon '),
  plant('c', 'Cuisine'),
  plant('d', null),
  plant('e', ''),
  plant('f', 'Bureau', true),
];

describe('plantLocations', () => {
  it('lists the places that hold active plants, merged and alphabetical', () => {
    expect(plantLocations(plants)).toEqual([
      { key: 'cuisine', label: 'Cuisine', count: 1 },
      { key: 'salon', label: 'Salon', count: 2 },
    ]);
  });

  it('is empty when no plant has a location', () => {
    expect(plantLocations([plant('a', null)])).toEqual([]);
  });
});

describe('filterByLocations', () => {
  const items = plants.map((p) => ({ plant: p }));

  it('keeps everything when nothing is checked', () => {
    expect(filterByLocations(items, new Set())).toBe(items);
  });

  it('keeps only plants in the checked places', () => {
    const ids = (checked: string[]) =>
      filterByLocations(items, new Set(checked)).map((i) => i.plant.id);
    expect(ids(['salon'])).toEqual(['a', 'b']);
    expect(ids(['salon', 'cuisine'])).toEqual(['a', 'b', 'c']);
  });

  it('hides plants without a location once a place is checked', () => {
    expect(filterByLocations(items, new Set(['cuisine'])).map((i) => i.plant.id)).toEqual(['c']);
  });
});

describe('locationKey', () => {
  it('ignores case and surrounding spaces', () => {
    expect(locationKey('  Salle de Bain ')).toBe('salle de bain');
  });
});
