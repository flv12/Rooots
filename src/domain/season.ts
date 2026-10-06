export type Season = 'summer' | 'winter';

/** Northern hemisphere, fixed months: April–September is summer, October–March is winter. */
export function seasonOf(date: Date): Season {
  const month = date.getMonth();
  return month >= 3 && month <= 8 ? 'summer' : 'winter';
}
