import { greetingMood, greetingSlot, pickGreeting, type GreetingPhrases } from '@/domain/greeting';
import { fr } from '@/i18n/fr';

const at = (hours: number, minutes = 0) => new Date(2026, 9, 6, hours, minutes);

const phrases: GreetingPhrases = {
  morning: ['m0', 'm1', 'm2'],
  afternoon: ['a0', 'a1'],
  evening: ['e0', 'e1'],
  night: ['n0', 'n1'],
  allWatered: ['w0'],
  overdue: ['o0', 'o1'],
};

describe('greetingSlot', () => {
  it.each([
    [5, 0, 'morning'],
    [10, 59, 'morning'],
    [11, 0, 'afternoon'],
    [17, 59, 'afternoon'],
    [18, 0, 'evening'],
    [21, 59, 'evening'],
    [22, 0, 'night'],
    [0, 0, 'night'],
    [4, 59, 'night'],
  ] as const)('maps %i:%i to %s', (h, m, slot) => {
    expect(greetingSlot(at(h, m))).toBe(slot);
  });
});

describe('greetingMood', () => {
  it('is neutral without plants', () => {
    expect(greetingMood({ plantCount: 0, dueCount: 0, overdueCount: 0 })).toBe('neutral');
  });

  it('is allWatered when plants exist and nothing is due', () => {
    expect(greetingMood({ plantCount: 3, dueCount: 0, overdueCount: 0 })).toBe('allWatered');
  });

  it('is neutral when plants are due today but none overdue', () => {
    expect(greetingMood({ plantCount: 3, dueCount: 2, overdueCount: 0 })).toBe('neutral');
  });

  it('is overdue when at least one plant is overdue', () => {
    expect(greetingMood({ plantCount: 3, dueCount: 2, overdueCount: 1 })).toBe('overdue');
  });
});

describe('pickGreeting', () => {
  it('picks deterministically within the slot with the injected random', () => {
    expect(pickGreeting(phrases, at(8), 'neutral', 0)).toBe('m0');
    expect(pickGreeting(phrases, at(8), 'neutral', 0.5)).toBe('m1');
    expect(pickGreeting(phrases, at(8), 'neutral', 0.999)).toBe('m2');
    expect(pickGreeting(phrases, at(14), 'neutral', 0.7)).toBe('a1');
    expect(pickGreeting(phrases, at(23), 'neutral', 0.1)).toBe('n0');
  });

  it('mixes mood variants after the slot variants', () => {
    // pool: e0, e1, o0, o1
    expect(pickGreeting(phrases, at(19), 'overdue', 0)).toBe('e0');
    expect(pickGreeting(phrases, at(19), 'overdue', 0.5)).toBe('o0');
    expect(pickGreeting(phrases, at(19), 'overdue', 0.99)).toBe('o1');
    // pool: a0, a1, w0
    expect(pickGreeting(phrases, at(12), 'allWatered', 0.9)).toBe('w0');
  });

  it('stays in range when random is exactly 1', () => {
    expect(pickGreeting(phrases, at(8), 'neutral', 1)).toBe('m2');
  });
});

describe('fr.home.greetings', () => {
  const all = Object.values(fr.home.greetings).flat();

  it('has several variants per time slot', () => {
    for (const slot of ['morning', 'afternoon', 'evening', 'night'] as const) {
      expect(fr.home.greetings[slot].length).toBeGreaterThanOrEqual(5);
    }
  });

  it('keeps every greeting short enough for the display title', () => {
    for (const g of all) expect(g.length).toBeLessThanOrEqual(28);
  });

  it('uses typographic apostrophes', () => {
    for (const g of all) expect(g).not.toContain("'");
  });
});
