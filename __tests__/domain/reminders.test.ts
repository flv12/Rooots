import { planReminders, REMINDER_HORIZON_DAYS } from '@/domain/reminders';

const at = (day: number, hour = 0, minute = 0) => new Date(2026, 5, day, hour, minute);
const settings = { remindersEnabled: true, reminderHour: 9, reminderMinute: 0 };

describe('planReminders', () => {
  it('plans nothing when reminders are disabled', () => {
    const plants = [{ name: 'A', nextWatering: at(10) }];
    expect(planReminders(plants, at(10, 8), { ...settings, remindersEnabled: false })).toEqual([]);
  });

  it('plans nothing without plants', () => {
    expect(planReminders([], at(10, 8), settings)).toEqual([]);
  });

  it('includes today when the reminder time is still ahead', () => {
    const plan = planReminders([{ name: 'A', nextWatering: at(10) }], at(10, 8), settings);
    expect(plan[0]).toMatchObject({ date: at(10, 9), names: ['A'] });
  });

  it('skips today when the reminder time has passed', () => {
    const plan = planReminders([{ name: 'A', nextWatering: at(10) }], at(10, 10), settings);
    expect(plan[0].date).toEqual(at(11, 9));
  });

  it('starts on the due day and repeats every day until watered', () => {
    const plan = planReminders([{ name: 'A', nextWatering: at(12) }], at(10, 8), settings);
    const recaps = plan.filter((r) => r.kind === 'recap');
    expect(recaps[0].date).toEqual(at(12, 9));
    expect(recaps).toHaveLength(REMINDER_HORIZON_DAYS - 2);
  });

  it('lists plants due that day, most overdue first', () => {
    const plants = [
      { name: 'Later', nextWatering: at(11) },
      { name: 'Overdue', nextWatering: at(8) },
      { name: 'Future', nextWatering: at(20) },
    ];
    const plan = planReminders(plants, at(10, 8), settings);
    expect(plan[0].names).toEqual(['Overdue']);
    expect(plan[1].names).toEqual(['Overdue', 'Later']);
  });

  it('ends with a notice asking to open the app', () => {
    const plan = planReminders([{ name: 'A', nextWatering: at(30) }], at(10, 8), settings);
    expect(plan.at(-1)).toMatchObject({ kind: 'stale', date: at(10 + REMINDER_HORIZON_DAYS, 9) });
  });

  it('uses the configured time', () => {
    const plan = planReminders([{ name: 'A', nextWatering: at(10) }], at(10, 6), {
      ...settings,
      reminderHour: 7,
      reminderMinute: 45,
    });
    expect(plan[0].date).toEqual(at(10, 7, 45));
  });
});
