import { repeatDelay, REPEAT } from '@/components/repeat-delay';

describe('repeatDelay', () => {
  it('starts with the initial delay', () => {
    expect(repeatDelay(0)).toBe(REPEAT.initialMs);
  });

  it('shrinks exponentially with each repeat', () => {
    expect(repeatDelay(1)).toBeCloseTo(REPEAT.initialMs * REPEAT.factor);
    expect(repeatDelay(3)).toBeCloseTo(REPEAT.initialMs * REPEAT.factor ** 3);
  });

  it('never goes below the minimum delay', () => {
    expect(repeatDelay(200)).toBe(REPEAT.minMs);
  });
});
