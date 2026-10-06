import { careDate } from '@/domain/care-date';

const now = new Date(2026, 9, 6, 18, 42);

describe('careDate', () => {
  it('uses the current time for today', () => {
    expect(careDate('today', now)).toEqual(now);
  });

  it('uses the same time yesterday', () => {
    expect(careDate('yesterday', now)).toEqual(new Date(2026, 9, 5, 18, 42));
  });

  it('places a picked past day at noon', () => {
    expect(careDate(new Date(2026, 8, 20, 3, 0), now)).toEqual(new Date(2026, 8, 20, 12, 0));
  });

  it('uses the current time when the picked day is today', () => {
    expect(careDate(new Date(2026, 9, 6, 0, 0), now)).toEqual(now);
  });

  it('never returns a future date', () => {
    expect(careDate(new Date(2026, 9, 9), now)).toEqual(now);
  });
});
