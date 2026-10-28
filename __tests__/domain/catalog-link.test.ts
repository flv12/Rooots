import { linkConflicts, linkPatch, unlinkPatch } from '@/domain/catalog-link';

const monstera = {
  latin_name: 'Monstera deliciosa',
  synonyms: [],
  common_names_fr: ['Monstera', 'Plante gruyère'],
  common_names_en: ['Swiss cheese plant'],
  water_every_days_summer: 7,
  water_every_days_winter: 14,
};

const plant = (over: Partial<Parameters<typeof linkConflicts>[0]> = {}) => ({
  species: null,
  waterEveryDays: null,
  waterObserved: false,
  ...over,
});

describe('linkConflicts', () => {
  it('has none for a plant without own data', () => {
    expect(linkConflicts(plant(), monstera)).toEqual({ frequency: null, species: null });
  });

  it('flags a fixed watering frequency', () => {
    expect(linkConflicts(plant({ waterEveryDays: 10 }), monstera).frequency).toBe(10);
  });

  it('does not flag the observed rhythm: it is kept whatever the sheet', () => {
    expect(
      linkConflicts(plant({ waterEveryDays: 10, waterObserved: true }), monstera).frequency,
    ).toBeNull();
  });

  it('flags a hand-typed species that is not a name of the catalog plant', () => {
    expect(linkConflicts(plant({ species: 'Ficus lyrata' }), monstera).species).toBe(
      'Ficus lyrata',
    );
  });

  it('accepts the same species written another way (accents, case, common name)', () => {
    expect(linkConflicts(plant({ species: ' monstera DELICIOSA ' }), monstera).species).toBeNull();
    expect(linkConflicts(plant({ species: 'Plante gruyère' }), monstera).species).toBeNull();
    expect(linkConflicts(plant({ species: 'plante gruyere' }), monstera).species).toBeNull();
  });

  it('ignores a blank species', () => {
    expect(linkConflicts(plant({ species: '  ' }), monstera).species).toBeNull();
  });
});

describe('linkPatch', () => {
  const mine = plant({ species: 'Ficus lyrata', waterEveryDays: 10 });
  const conflicts = linkConflicts(mine, monstera);

  it('keeps my values when asked', () => {
    expect(
      linkPatch(mine, 'monstera-deliciosa', conflicts, { frequency: 'mine', species: 'mine' }),
    ).toEqual({
      catalogId: 'monstera-deliciosa',
      species: 'Ficus lyrata',
      waterEveryDays: 10,
      waterObserved: false,
    });
  });

  it('takes the catalog values when asked', () => {
    expect(
      linkPatch(mine, 'monstera-deliciosa', conflicts, {
        frequency: 'catalog',
        species: 'catalog',
      }),
    ).toEqual({
      catalogId: 'monstera-deliciosa',
      species: null,
      waterEveryDays: null,
      waterObserved: false,
    });
  });

  it('changes nothing else when there was no conflict', () => {
    const clean = plant({ waterObserved: true, waterEveryDays: 9 });
    const none = linkConflicts(clean, monstera);
    expect(linkPatch(clean, 'x', none, { frequency: 'catalog', species: 'catalog' })).toEqual({
      catalogId: 'x',
      species: null,
      waterEveryDays: 9,
      waterObserved: true,
    });
  });
});

describe('unlinkPatch', () => {
  it('keeps the fixed frequency and the typed species', () => {
    expect(
      unlinkPatch(plant({ species: 'Ficus', waterEveryDays: 10 }), monstera, new Date(2026, 6, 1)),
    ).toEqual({ catalogId: null, species: 'Ficus', waterEveryDays: 10 });
  });

  it('freezes the current season value for a plant that followed the seasons', () => {
    expect(unlinkPatch(plant(), monstera, new Date(2026, 6, 1))).toEqual({
      catalogId: null,
      species: 'Monstera deliciosa',
      waterEveryDays: 7,
    });
    expect(unlinkPatch(plant(), monstera, new Date(2026, 0, 15)).waterEveryDays).toBe(14);
  });

  it('falls back to 7 days when the sheet cannot be found', () => {
    expect(unlinkPatch(plant(), undefined, new Date(2026, 6, 1))).toEqual({
      catalogId: null,
      species: null,
      waterEveryDays: 7,
    });
  });
});
