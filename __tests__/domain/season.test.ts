import { seasonOf } from '@/domain/season';

describe('seasonOf', () => {
  it('treats April to September as summer', () => {
    expect(seasonOf(new Date(2026, 3, 1))).toBe('summer');
    expect(seasonOf(new Date(2026, 8, 30, 23, 59))).toBe('summer');
  });

  it('treats October to March as winter', () => {
    expect(seasonOf(new Date(2026, 9, 1))).toBe('winter');
    expect(seasonOf(new Date(2026, 0, 15))).toBe('winter');
    expect(seasonOf(new Date(2026, 2, 31, 23, 59))).toBe('winter');
  });
});
