// Deep imports on purpose: the package entry point runs a push-token auto-registration side
// effect that throws in Expo Go on Android ("push notifications removed in SDK 53"), even
// though local notifications still work there. We only need local notifications.
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';

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

/** Android needs a channel before the permission prompt can appear. */
export async function ensurePermission(): Promise<boolean> {
  setupNotificationHandler();
  await setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Rappels d’arrosage',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
  });
  const current = await getPermissionsAsync();
  if (current.granted) return true;
  const asked = await requestPermissionsAsync();
  return asked.granted;
}

/** Demo: sends the daily recap a few seconds from now. */
export async function sendTestReminder(names: string[], delaySeconds = 5): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  const count = names.length;
  await scheduleNotificationAsync({
    content: {
      title:
        count === 0
          ? 'Tout le monde a bu'
          : `💧 ${count} ${count > 1 ? 'plantes' : 'plante'} à arroser`,
      body:
        count === 0
          ? 'Rien à arroser aujourd’hui, profitez-en 🌿'
          : `${names.slice(0, 4).join(', ')}${count > 4 ? '…' : ''}`,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
  return true;
}
