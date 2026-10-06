type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null = null;

/**
 * Loaded lazily: in Expo Go on Android, importing expo-notifications logs a red error about
 * remote push (unsupported there) even though local notifications still work.
 */
function load(): NotificationsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy load, see above
  cached ??= require('expo-notifications') as NotificationsModule;
  return cached;
}

export const REMINDER_CHANNEL_ID = 'watering-reminders';

let handlerSet = false;

/** Show reminders as banners even when the app is in the foreground. */
function setupNotificationHandler(Notifications: NotificationsModule) {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
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
  const Notifications = load();
  setupNotificationHandler(Notifications);
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Rappels d’arrosage',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
  });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Demo: sends the daily recap a few seconds from now. */
export async function sendTestReminder(names: string[], delaySeconds = 5): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  const Notifications = load();
  const body =
    names.length === 0
      ? 'Rien à arroser aujourd’hui, profitez-en 🌿'
      : `${names.slice(0, 4).join(', ')}${names.length > 4 ? '…' : ''}`;
  await Notifications.scheduleNotificationAsync({
    content: {
      title:
        names.length === 0
          ? 'Tout le monde a bu'
          : `💧 ${names.length} ${names.length > 1 ? 'plantes' : 'plante'} à arroser`,
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
  return true;
}
