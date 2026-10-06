import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';

export const REMINDER_HORIZON_DAYS = 14;

export type ReminderSettings = {
  remindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
};

export type PlannedReminder =
  { kind: 'recap'; date: Date; names: string[] } | { kind: 'stale'; date: Date; names: [] };

/**
 * One recap notification per day for the next 14 days, listing the plants due (or still
 * overdue) that day, then a last notice asking to open the app so the plan can be refreshed.
 * Notification content is frozen when scheduled, hence precomputing each day.
 */
export function planReminders(
  plants: { name: string; nextWatering: Date }[],
  now: Date,
  settings: ReminderSettings,
): PlannedReminder[] {
  if (!settings.remindersEnabled || plants.length === 0) return [];

  const sorted = [...plants].sort((a, b) => a.nextWatering.getTime() - b.nextWatering.getTime());
  const timeOn = (day: Date) =>
    setMinutes(setHours(startOfDay(day), settings.reminderHour), settings.reminderMinute);

  const plan: PlannedReminder[] = [];
  for (let i = 0; i < REMINDER_HORIZON_DAYS; i++) {
    const date = timeOn(addDays(now, i));
    if (date <= now) continue;
    const dayStart = startOfDay(date);
    const names = sorted.filter((p) => startOfDay(p.nextWatering) <= dayStart).map((p) => p.name);
    if (names.length > 0) plan.push({ kind: 'recap', date, names });
  }
  plan.push({ kind: 'stale', date: timeOn(addDays(now, REMINDER_HORIZON_DAYS)), names: [] });
  return plan;
}
