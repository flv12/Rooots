// Deep imports on purpose: the package entry point runs a push-token auto-registration side
// effect that throws in Expo Go on Android ("push notifications removed in SDK 53"), even
// though local notifications still work there. We only need local notifications.
import { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';

import type { PlannedReminder } from '@/domain/reminders';
import { fr } from '@/i18n/fr';

export const REMINDER_CHANNEL_ID = 'watering-reminders';

let handlerSet = false;

/** Show reminders as banners even when the app is in the foreground. */
function setupNotificationHandler() {
  if (handlerSet) return;
  handlerSet = true;
  setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let channelReady: boolean | null = null;

/**
 * Creates our dedicated channel. Not available in Expo Go (channel management is not exposed
 * there), in which case notifications go to Expo Go's default channel.
 */
async function ensureChannel(): Promise<boolean> {
  if (channelReady !== null) return channelReady;
  try {
    await setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Rappels d’arrosage',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
    });
    channelReady = true;
  } catch {
    channelReady = false;
  }
  return channelReady;
}

export async function ensurePermission(): Promise<boolean> {
  setupNotificationHandler();
  await ensureChannel();
  const current = await getPermissionsAsync();
  if (current.granted) return true;
  const asked = await requestPermissionsAsync();
  return asked.granted;
}

const contentFor = (r: PlannedReminder) =>
  r.kind === 'stale'
    ? { title: fr.reminder.staleTitle, body: fr.reminder.staleBody }
    : { title: fr.reminder.recapTitle(r.names.length), body: fr.reminder.recapBody(r.names) };

/** Sends today's recap a few seconds from now (Settings › Tester le rappel). Never sent empty. */
export async function sendTestReminder(names: string[], delaySeconds = 5): Promise<boolean> {
  if (names.length === 0) return false;
  if (!(await ensurePermission())) return false;
  const channel = (await ensureChannel()) ? { channelId: REMINDER_CHANNEL_ID } : {};
  await scheduleNotificationAsync({
    content: contentFor({ kind: 'recap', date: new Date(), names }),
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      ...channel,
    },
  });
  return true;
}

/**
 * Replaces every scheduled reminder with the given plan. Never prompts for permission:
 * if it is not granted yet, nothing is scheduled.
 */
export async function syncReminders(plan: PlannedReminder[]): Promise<void> {
  if (!(await getPermissionsAsync()).granted) return;
  setupNotificationHandler();
  const channel = (await ensureChannel()) ? { channelId: REMINDER_CHANNEL_ID } : {};
  await cancelAllScheduledNotificationsAsync();
  for (const r of plan) {
    await scheduleNotificationAsync({
      content: contentFor(r),
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: r.date, ...channel },
    });
  }
}
