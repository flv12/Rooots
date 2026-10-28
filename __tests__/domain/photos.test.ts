import {
  daysBetween,
  groupByMonth,
  photosOf,
  primaryOf,
  withoutPhoto,
  withPrimary,
} from '@/domain/photos';
import type { PlantPhoto } from '@/domain/types';

const photo = (id: string, takenAt: string, over: Partial<PlantPhoto> = {}): PlantPhoto => ({
  id,
  plantId: 'p1',
  path: `photos/${id}.jpg`,
  takenAt,
  isPrimary: false,
  ...over,
});

const a = photo('a', '2026-06-05T10:00:00.000Z');
const b = photo('b', '2026-09-03T10:00:00.000Z', { isPrimary: true });
const c = photo('c', '2026-09-28T10:00:00.000Z');
const other = photo('x', '2026-10-01T10:00:00.000Z', { plantId: 'p2', isPrimary: true });

describe('photosOf / primaryOf', () => {
  it('lists one plant photos, most recent first', () => {
    expect(photosOf([a, b, c, other], 'p1').map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('finds the primary photo of the right plant', () => {
    expect(primaryOf([a, b, c, other], 'p1')?.id).toBe('b');
    expect(primaryOf([a, c], 'p1')).toBeUndefined();
  });
});

describe('withPrimary', () => {
  it('moves the primary flag without touching other plants', () => {
    const next = withPrimary([a, b, c, other], 'c');
    expect(next.filter((p) => p.isPrimary).map((p) => p.id)).toEqual(['c', 'x']);
  });

  it('ignores an unknown id', () => {
    const photos = [a, b];
    expect(withPrimary(photos, 'nope')).toBe(photos);
  });
});

describe('withoutPhoto', () => {
  it('removes a non-primary photo and keeps the primary', () => {
    const next = withoutPhoto([a, b, c], 'a');
    expect(next.map((p) => p.id)).toEqual(['b', 'c']);
    expect(primaryOf(next, 'p1')?.id).toBe('b');
  });

  it('makes the most recent remaining photo primary when the primary is removed', () => {
    const next = withoutPhoto([a, b, c, other], 'b');
    expect(next.map((p) => p.id)).toEqual(['a', 'c', 'x']);
    expect(primaryOf(next, 'p1')?.id).toBe('c');
    expect(primaryOf(next, 'p2')?.id).toBe('x');
  });

  it('leaves the plant without primary when its last photo is removed', () => {
    const next = withoutPhoto([b, other], 'b');
    expect(primaryOf(next, 'p1')).toBeUndefined();
    expect(next).toHaveLength(1);
  });
});

describe('groupByMonth', () => {
  it('groups by calendar month, most recent first', () => {
    const months = groupByMonth([a, b, c]);
    expect(months.map((m) => m.key)).toEqual(['2026-09', '2026-06']);
    expect(months[0].photos.map((p) => p.id)).toEqual(['c', 'b']);
    expect(months[0].label).toBe('septembre 2026');
  });

  it('returns nothing for no photos', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('daysBetween', () => {
  it('counts calendar days', () => {
    expect(daysBetween(b, c)).toBe(25);
  });
});
