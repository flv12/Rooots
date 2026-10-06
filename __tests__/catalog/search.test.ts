import { normalizeText, searchCatalog } from '@/catalog/search';
import type { CatalogPlant } from '@/catalog/schema';

const base: Omit<CatalogPlant, 'id' | 'latin_name' | 'common_names_fr' | 'common_names_en'> = {
  status: 'active',
  family: 'X',
  light: 'medium',
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
  difficulty: 'easy',
  tips_fr: '',
  problems: [],
  data_status: 'draft',
  sources: [],
  photos: [],
};

const plants: CatalogPlant[] = [
  {
    ...base,
    id: 'monstera-deliciosa',
    latin_name: 'Monstera deliciosa',
    common_names_fr: ['Monstera'],
    common_names_en: ['Swiss cheese plant'],
  },
  {
    ...base,
    id: 'chlorophytum-comosum',
    latin_name: 'Chlorophytum comosum',
    common_names_fr: ['Plante araignée', 'Phalangère'],
    common_names_en: ['Spider plant'],
  },
  {
    ...base,
    id: 'old-plant',
    status: 'retired',
    latin_name: 'Oldus plantus',
    common_names_fr: ['Ancienne'],
    common_names_en: [],
  },
];

const ids = (list: CatalogPlant[]) => list.map((p) => p.id);

describe('normalizeText', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeText('  Phalangère ÉTÉ ')).toBe('phalangere ete');
  });
});

describe('searchCatalog', () => {
  it('returns every active plant for an empty query', () => {
    expect(ids(searchCatalog(plants, ''))).toEqual(['monstera-deliciosa', 'chlorophytum-comosum']);
  });

  it('matches French names regardless of accents and case', () => {
    expect(ids(searchCatalog(plants, 'ARAIGNEE'))).toEqual(['chlorophytum-comosum']);
  });

  it('matches English names', () => {
    expect(ids(searchCatalog(plants, 'swiss'))).toEqual(['monstera-deliciosa']);
  });

  it('matches latin names', () => {
    expect(ids(searchCatalog(plants, 'comosum'))).toEqual(['chlorophytum-comosum']);
  });

  it('never returns retired plants', () => {
    expect(searchCatalog(plants, 'ancienne')).toEqual([]);
  });
});
