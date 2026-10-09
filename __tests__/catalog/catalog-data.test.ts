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

  // Plants that grow and flower in winter and rest in summer: watered more in winter.
  const WINTER_GROWERS = ['cyclamen-persicum'];

  it('never waters less often in summer than in winter, except winter growers', () => {
    const bad = data.plants.filter(
      (p) =>
        !WINTER_GROWERS.includes(p.id) && p.water_every_days_summer > p.water_every_days_winter,
    );
    expect(bad.map((p) => p.id)).toEqual([]);
  });

  it('waters winter growers more in winter', () => {
    for (const id of WINTER_GROWERS) {
      const p = data.plants.find((x) => x.id === id);
      expect(p && p.water_every_days_winter < p.water_every_days_summer).toBe(true);
    }
  });

  it('has a toxicity source page for every known toxicity value', () => {
    const bad = data.plants.filter(
      (p) =>
        p.pet_toxic !== 'unknown' &&
        !p.sources.some((s) => 'url' in s && /aspca\.org/.test(String(s.url))),
    );
    expect(bad.map((p) => p.id)).toEqual([]);
  });

  it('includes the ~100 plants of the source list', () => {
    expect(data.plants.length).toBeGreaterThanOrEqual(100);
  });
});
