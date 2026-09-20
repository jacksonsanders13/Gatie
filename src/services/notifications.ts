import * as Notifications from 'expo-notifications';

/**
 * Apple blocks app extensions from launching apps, so the shield posts a notification instead:
 * tapping it opens Gatie on the reflection screen. That makes notification permission part of the
 * core flow, not a nicety.
 */

/** Marks the notifications the shield sends, so a tap can be told apart from any other. */
export const UNLOCK_NOTIFICATION_TAG = 'gatie-unlock';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

const isUnlockTap = (data: unknown) => (data as { tag?: string } | undefined)?.tag === UNLOCK_NOTIFICATION_TAG;

/** Fires when the user taps a shield notification, including one that cold-started the app. */
export function onUnlockNotificationTap(handler: () => void): () => void {
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response && isUnlockTap(response.notification.request.content.data)) handler();
    })
    .catch(() => {});

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (isUnlockTap(response.notification.request.content.data)) handler();
  });

  return () => subscription.remove();
}
