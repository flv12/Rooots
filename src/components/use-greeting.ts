import { useState } from 'react';

import { pickGreeting, type GreetingMood } from '@/domain/greeting';
import { fr } from '@/i18n/fr';

/** Drawn once per app launch so the greeting does not change on re-renders or remounts. */
const launchRandom = Math.random();

/** Greeting for the home title, picked once on first render (time slot and mood frozen). */
export function useGreeting(mood: GreetingMood): string {
  const [greeting] = useState(() =>
    pickGreeting(fr.home.greetings, new Date(), mood, launchRandom),
  );
  return greeting;
}
