import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Do not initialize notifications in Expo Go — getExpoPushTokenAsync requires
// a standalone or dev-client build with configured credentials.
const isExpoGo = __DEV__ && Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldShowBanner: true,
      shouldShowList:   true,
      shouldPlaySound:  true,
      shouldSetBadge:   false,
    }),
  });
}

export const registerForPushNotifications = async (uid: string): Promise<string | null> => {
  if (isExpoGo) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  await updateDoc(doc(db, `users/${uid}`), { fcmToken: token });

  return token;
};

export const setupNotificationListeners = (
  onForeground: (notification: Notifications.Notification) => void,
  onTap: (response: Notifications.NotificationResponse) => void,
) => {
  if (isExpoGo) return () => {};

  const foregroundSub = Notifications.addNotificationReceivedListener(onForeground);
  const tapSub        = Notifications.addNotificationResponseReceivedListener(onTap);
  return () => {
    foregroundSub.remove();
    tapSub.remove();
  };
};
