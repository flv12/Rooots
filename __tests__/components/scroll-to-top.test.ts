import { easeInOutCubic, scrollDuration } from '@/components/scroll-to-top';

describe('scrollDuration', () => {
  it('grows with the distance', () => {
    expect(scrollDuration(3000)).toBeGreaterThan(scrollDuration(1000));
  });

  it('stays between a short and a long bound', () => {
    expect(scrollDuration(10)).toBe(450);
    expect(scrollDuration(100000)).toBe(1000);
  });
});

describe('easeInOutCubic', () => {
  it('starts slow, is half-way at the middle, ends slow', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);
  });
});
