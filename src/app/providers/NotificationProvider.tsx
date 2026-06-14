import React, { useEffect } from 'react';
import Constants from 'expo-constants';
import { useAuthStore } from '../../features/auth/store/authStore';
import {
  registerForPushNotifications,
  setupNotificationListeners,
} from '../../services/firebase/messaging';

const isExpoGo = __DEV__ && Constants.appOwnership === 'expo';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Selector: only subscribe to uid — prevents re-renders from any other auth state change
  const uid = useAuthStore(state => state.user?.uid ?? null);

  useEffect(() => {
    if (isExpoGo || !uid) return;

    registerForPushNotifications(uid).catch(console.error);

    const cleanup = setupNotificationListeners(
      (notification) => {
        if (__DEV__) console.log('[FCM] Foreground:', notification.request.content.body);
      },
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (__DEV__) console.log('[FCM] Tapped:', data);
      },
    );

    return cleanup;
  }, [uid]);

  return <>{children}</>;
};
