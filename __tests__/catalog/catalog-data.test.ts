import { catalogFileSchema } from '@/catalog/schema';

import data from '../../assets/catalog/catalog.json';

describe('bundled catalog', () => {
  const parsed = catalogFileSchema.safeParse(data);

  it('matches the schema', () => {
    expect(parsed.error?.issues ?? []).toEqual([]);
  });

  it('has unique ids', () => {
    const ids = data.plants.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never waters less often in summer than in winter', () => {
    const bad = data.plants.filter((p) => p.water_every_days_summer > p.water_every_days_winter);
    expect(bad.map((p) => p.id)).toEqual([]);
  });

  it('has a source for every known toxicity value', () => {
    const bad = data.plants.filter(
      (p) => p.pet_toxic !== 'unknown' && !p.sources.some((s) => s.name.includes('ASPCA')),
    );
    expect(bad.map((p) => p.id)).toEqual([]);
  });
});
