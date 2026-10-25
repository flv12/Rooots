import { effectiveWaterInterval, observedWaterRhythm } from '@/domain/watering';

// Day `n` after 1 June 2026, in the morning.
const d = (n: number) => new Date(2026, 5, 1 + n, 9);

describe('observedWaterRhythm', () => {
  it('is the median gap between waterings', () => {
    expect(observedWaterRhythm([d(0), d(7), d(14), d(21)], d(25))).toEqual({ days: 7, gaps: 3 });
  });

  it('needs at least 3 gaps', () => {
    expect(observedWaterRhythm([d(0), d(7), d(14)], d(20))).toBeNull();
    expect(observedWaterRhythm([], d(20))).toBeNull();
  });

  it('is not thrown off by a single long gap (holiday, forgotten log)', () => {
    expect(observedWaterRhythm([d(0), d(7), d(14), d(21), d(51)], d(55))).toEqual({
      days: 7,
      gaps: 4,
    });
  });

  it('does not depend on the order of the dates', () => {
    expect(observedWaterRhythm([d(21), d(0), d(14), d(7)], d(25))?.days).toBe(7);
  });

  it('ignores gaps under 2 days (double entries)', () => {
    expect(observedWaterRhythm([d(0), d(1), d(8), d(15)], d(20))).toBeNull();
    expect(observedWaterRhythm([d(0), d(1), d(8), d(15), d(22)], d(25))).toEqual({
      days: 7,
      gaps: 3,
    });
  });

  it('only looks at the last 90 days', () => {
    const old = [d(0), d(14), d(28), d(42)];
    expect(observedWaterRhythm(old, d(200))).toBeNull();
    expect(observedWaterRhythm([...old, d(150), d(157), d(164), d(171)], d(200))?.days).toBe(7);
  });

  it('rounds to a whole number of days', () => {
    expect(observedWaterRhythm([d(0), d(7), d(15), d(22), d(30)], d(35))?.days).toBe(8);
  });
});

describe('effectiveWaterInterval with an observed rhythm', () => {
  const catalog = { waterEveryDaysSummer: 14, waterEveryDaysWinter: 21 };
  const date = new Date(2026, 5, 15);
  const observed = { days: 8, gaps: 4 };

  it('uses the observed rhythm when the plant follows it', () => {
    expect(
      effectiveWaterInterval(
        { waterEveryDays: null, waterObserved: true },
        catalog,
        date,
        observed,
      ),
    ).toEqual({ days: 8, source: 'observed' });
  });

  it('beats a fixed value when the plant follows the observed rhythm', () => {
    expect(
      effectiveWaterInterval({ waterEveryDays: 5, waterObserved: true }, catalog, date, observed)
        .days,
    ).toBe(8);
  });

  it('falls back to the other settings while there is not enough data', () => {
    expect(
      effectiveWaterInterval({ waterEveryDays: null, waterObserved: true }, catalog, date, null),
    ).toEqual({ days: 14, source: 'catalog' });
    expect(
      effectiveWaterInterval({ waterEveryDays: 5, waterObserved: true }, catalog, date, null),
    ).toEqual({ days: 5, source: 'override' });
  });

  it('ignores the observed rhythm when the plant does not follow it', () => {
    expect(
      effectiveWaterInterval(
        { waterEveryDays: null, waterObserved: false },
        catalog,
        date,
        observed,
      ).source,
    ).toBe('catalog');
  });
});
