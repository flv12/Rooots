import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { planReminders } from '@/domain/reminders';
import { usePlantsStore } from '@/store/plants-store';
import { usePlantViews } from '@/store/use-plant-views';

import { syncReminders } from './index';

const DEBOUNCE_MS = 800;

/** Keeps scheduled notifications in line with the data: after each change and on app resume. */
export function useReminderSync() {
  const views = usePlantViews();
  const { settings } = usePlantsStore();
  const latest = useRef({ views, settings });

  useEffect(() => {
    latest.current = { views, settings };
  }, [views, settings]);

  useEffect(() => {
    const run = () => {
      const { views: v, settings: s } = latest.current;
      const plan = planReminders(
        v.map((x) => ({ name: x.plant.name, nextWatering: x.nextWatering })),
        new Date(),
        s,
      );
      syncReminders(plan).catch((e: unknown) => console.warn('[reminders] sync failed', e));
    };
    const timer = setTimeout(run, DEBOUNCE_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [views, settings]);
}
