import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../features/auth/store/authStore';
import {
  registerForPushNotifications,
  setupNotificationListeners,
} from '../../services/firebase/messaging';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.uid) return;

    registerForPushNotifications(user.uid).catch(console.error);

    const cleanup = setupNotificationListeners(
      (notification) => {
        // Foreground notification — optionally show in-app toast here
        console.log('[FCM] Foreground:', notification.request.content.body);
      },
      (response) => {
        // User tapped a notification — handle deep link
        const data = response.notification.request.content.data as Record<string, string>;
        console.log('[FCM] Tapped:', data);
        // navigation.navigate handled in RootNavigator via linking config
      }
    );

    return cleanup;
  }, [user?.uid]);

  return <>{children}</>;
};
