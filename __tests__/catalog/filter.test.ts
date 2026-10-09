import { categoryCounts, filterCatalog } from '@/catalog/filter';
import type { CatalogPlant } from '@/catalog/schema';

const plant = (over: Partial<CatalogPlant>): CatalogPlant => ({
  id: 'x',
  status: 'active',
  data_status: 'draft',
  latin_name: 'X',
  synonyms: [],
  common_names_fr: ['X'],
  common_names_en: [],
  family: 'F',
  category: 'foliage',
  light: 'bright_indirect',
  water_every_days_summer: 7,
  water_every_days_winter: 14,
  water_notes_fr: '',
  humidity: 'medium',
  temp_min_c: 15,
  temp_max_c: 25,
  soil_fr: '',
  fertilize_fr: '',
  fertilize_every_days: null,
  repot_every_years: null,
  pet_toxic: 'unknown',
  pet_toxic_note_fr: null,
  difficulty: 'medium',
  tips_fr: '',
  problems: [],
  sources: [],
  photos: [],
  ...over,
});

const plants = [
  plant({ id: 'pothos', common_names_fr: ['Pothos'], difficulty: 'easy', light: 'low' }),
  plant({ id: 'aloe', common_names_fr: ['Aloe'], category: 'succulent', pet_toxic: 'yes' }),
  plant({ id: 'orchid', common_names_fr: ['Orchidée'], category: 'flowering', pet_toxic: 'no' }),
  plant({ id: 'old', category: 'succulent', status: 'retired' }),
];

const ids = (list: CatalogPlant[]) => list.map((p) => p.id);
const none = { query: '', category: null, easy: false, lowLight: false, petSafe: false };

describe('filterCatalog', () => {
  it('returns every active plant without criteria', () => {
    expect(ids(filterCatalog(plants, none))).toEqual(['pothos', 'aloe', 'orchid']);
  });

  it('keeps one category', () => {
    expect(ids(filterCatalog(plants, { ...none, category: 'succulent' }))).toEqual(['aloe']);
  });

  it('combines the category with the other filters and the search', () => {
    expect(ids(filterCatalog(plants, { ...none, category: 'flowering', petSafe: true }))).toEqual([
      'orchid',
    ]);
    expect(
      ids(filterCatalog(plants, { ...none, query: 'pot', easy: true, lowLight: true })),
    ).toEqual(['pothos']);
    expect(filterCatalog(plants, { ...none, category: 'succulent', petSafe: true })).toEqual([]);
  });
});

describe('categoryCounts', () => {
  it('counts active plants per category, skipping empty ones', () => {
    expect(categoryCounts(plants)).toEqual([
      ['foliage', 1],
      ['succulent', 1],
      ['flowering', 1],
    ]);
  });
});
