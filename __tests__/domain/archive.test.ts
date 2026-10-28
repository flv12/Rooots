import { archivedPlants } from '@/domain/archive';
import type { Plant } from '@/domain/types';

const plant = (id: string, archived: boolean, archivedAt: string | null = null): Plant => ({
  id,
  catalogId: null,
  name: id,
  species: null,
  location: null,
  photoPath: null,
  waterEveryDays: 7,
  waterObserved: false,
  notes: null,
  createdAt: '2026-06-01T08:00:00.000Z',
  adoptedAt: '2026-06-01T08:00:00.000Z',
  archived,
  archivedAt,
});

describe('archivedPlants', () => {
  it('keeps only archived plants, most recently archived first, unknown dates last', () => {
    const plants = [
      plant('active', false),
      plant('old', true, '2026-08-01T10:00:00.000Z'),
      plant('unknown-b', true),
      plant('recent', true, '2026-10-01T10:00:00.000Z'),
      plant('unknown-a', true),
    ];
    expect(archivedPlants(plants).map((p) => p.id)).toEqual([
      'recent',
      'old',
      'unknown-a',
      'unknown-b',
    ]);
  });

  it('is empty when nothing is archived', () => {
    expect(archivedPlants([plant('a', false)])).toEqual([]);
  });
});
