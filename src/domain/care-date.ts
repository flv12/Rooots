import { isSameDay, setHours, setMinutes, startOfDay, subDays } from 'date-fns';

export type CareDateChoice = 'today' | 'yesterday' | Date;

/**
 * When a care was done. A picked past day is stored at noon (time unknown, and noon keeps it
 * on the right calendar day whatever the DST shift); never in the future.
 */
export function careDate(choice: CareDateChoice, now: Date): Date {
  if (choice === 'today') return now;
  if (choice === 'yesterday') return subDays(now, 1);
  if (isSameDay(choice, now) || choice > now) return now;
  return setMinutes(setHours(startOfDay(choice), 12), 0);
}
