import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { QueryProvider } from './providers/QueryProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { RootNavigator } from '../navigation/RootNavigator';
import { ErrorBoundary } from '../shared/components/feedback/ErrorBoundary';
import { logger } from '../shared/utils/logger';

SplashScreen.preventAutoHideAsync();
logger.installGlobalHandlers();

export const RootApp: React.FC = () => {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    Font.loadAsync({
      'Nunito-Regular': require('../../assets/fonts/Nunito-Regular.ttf'),
      'Nunito-SemiBold': require('../../assets/fonts/Nunito-SemiBold.ttf'),
      'Nunito-Bold': require('../../assets/fonts/Nunito-Bold.ttf'),
      'Nunito-ExtraBold': require('../../assets/fonts/Nunito-ExtraBold.ttf'),
    })
      .then(() => {
        setFontsLoaded(true);
        logger.app.launched();
      })
      .catch(() => {
        logger.app.warn('Font loading failed — using system font fallback');
        setFontsLoaded(true);
      });
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryProvider>
            <NavigationContainer>
              <NotificationProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </NotificationProvider>
            </NavigationContainer>
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
