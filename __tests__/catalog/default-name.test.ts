import { defaultPlantName } from '@/catalog/default-name';

describe('defaultPlantName', () => {
  it('uses the common French name of the catalog plant, not the latin one', () => {
    expect(
      defaultPlantName({ common_names_fr: ['Monstera'], latin_name: 'Monstera deliciosa' }, null),
    ).toBe('Monstera');
  });

  it('falls back to the latin name when the catalog has no French name', () => {
    expect(defaultPlantName({ common_names_fr: [], latin_name: 'Phalaenopsis' }, null)).toBe(
      'Phalaenopsis',
    );
  });

  it('uses the typed species for a manual plant', () => {
    expect(defaultPlantName(undefined, '  Basilic ')).toBe('Basilic');
  });

  it('has a generic name when nothing is known', () => {
    expect(defaultPlantName(undefined, '')).toBe('Ma plante');
  });
});
