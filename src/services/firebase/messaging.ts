import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotifications = async (uid: string): Promise<string | null> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Expo push token (works with Firebase FCM via Expo's push gateway)
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Persist to user doc for server-side FCM sends
  await updateDoc(doc(db, `users/${uid}`), { fcmToken: token });

  return token;
};

export const setupNotificationListeners = (
  onForeground: (notification: Notifications.Notification) => void,
  onTap: (response: Notifications.NotificationResponse) => void
) => {
  const foregroundSub = Notifications.addNotificationReceivedListener(onForeground);
  const tapSub = Notifications.addNotificationResponseReceivedListener(onTap);
  return () => {
    foregroundSub.remove();
    tapSub.remove();
  };
};
