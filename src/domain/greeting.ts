export type GreetingSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type GreetingMood = 'neutral' | 'allWatered' | 'overdue';

export type GreetingPhrases = Record<GreetingSlot, readonly string[]> &
  Record<Exclude<GreetingMood, 'neutral'>, readonly string[]>;

/** Morning 5–11h, afternoon 11–18h, evening 18–22h, night 22–5h (local time). */
export function greetingSlot(date: Date): GreetingSlot {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

export function greetingMood(counts: {
  plantCount: number;
  dueCount: number;
  overdueCount: number;
}): GreetingMood {
  if (counts.overdueCount > 0) return 'overdue';
  if (counts.plantCount > 0 && counts.dueCount === 0) return 'allWatered';
  return 'neutral';
}

/**
 * Picks one greeting among the time-slot variants, plus the mood variants when the mood
 * is not neutral. `random` is a number in [0, 1), injectable for tests.
 */
export function pickGreeting(
  phrases: GreetingPhrases,
  date: Date,
  mood: GreetingMood,
  random: number,
): string {
  const pool = [...phrases[greetingSlot(date)], ...(mood === 'neutral' ? [] : phrases[mood])];
  const index = Math.min(Math.floor(random * pool.length), pool.length - 1);
  return pool[Math.max(index, 0)] ?? '';
}
