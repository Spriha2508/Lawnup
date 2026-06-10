import 'react-native-gesture-handler';
import './global.css';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, LogBox, Dimensions } from 'react-native';

const WINDOW_HEIGHT = Dimensions.get('window').height;
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from './src/app/providers/QueryProvider';
import { NotificationProvider } from './src/app/providers/NotificationProvider';
import { ErrorBoundary } from './src/shared/components/feedback/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AnimatedSplash } from './src/shared/components/motion/AnimatedSplash';
import { logger } from './src/shared/utils/logger';
// DevOverlay is imported lazily so it is only bundled in __DEV__ builds
const DevOverlay = __DEV__
  ? require('./src/shared/components/feedback/DevOverlay').DevOverlay
  : null;

// Install global JS crash + unhandled-promise handlers before anything renders.
// Errors will appear in Metro as [BUNDLE_CRASH] / [RUNTIME_ERROR] / [UNHANDLED_PROMISE].
logger.installGlobalHandlers();

LogBox.ignoreLogs([
  '@firebase/firestore',
  'AsyncStorage has been extracted',
  'expo-notifications',
  'ExponentNotifications',
]);

SplashScreen.preventAutoHideAsync().catch(() => {});

const NAV_THEME = {
  dark: false,
  colors: {
    background: '#F5F1E8',
    card: '#F5F1E8',
    text: '#111111',
    border: '#DDD4C7',
    primary: '#6F943E',
    notification: '#6F943E',
  },
} as const;

// Isolated so that splashDone state changes in App never cascade into the nav tree.
// DevOverlay lives INSIDE NavigationContainer so its navigation hooks have context.
const NavTree: React.FC = memo(() => (
  <NavigationContainer theme={NAV_THEME}>
    <NotificationProvider>
      <StatusBar style="dark" />
      <RootNavigator />
      {DevOverlay ? <DevOverlay /> : null}
    </NotificationProvider>
  </NavigationContainer>
));

function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setFontsLoaded(true);
      try { await SplashScreen.hideAsync(); } catch {}
    }, 5000);

    Font.loadAsync({
      'Nunito-Regular':           require('./assets/fonts/Nunito-Regular.ttf'),
      'Nunito-SemiBold':          require('./assets/fonts/Nunito-SemiBold.ttf'),
      'Nunito-Bold':              require('./assets/fonts/Nunito-Bold.ttf'),
      'Nunito-ExtraBold':         require('./assets/fonts/Nunito-ExtraBold.ttf'),
      'Cormorant-Regular':        CormorantGaramond_400Regular,
      'Cormorant-Italic':         CormorantGaramond_400Regular_Italic,
      'Cormorant-SemiBold':       CormorantGaramond_600SemiBold,
      'Cormorant-SemiBoldItalic': CormorantGaramond_600SemiBold_Italic,
      'Cormorant-Bold':           CormorantGaramond_700Bold,
    })
      .catch(() => {})
      .finally(async () => {
        clearTimeout(timeout);
        setFontsLoaded(true);
        try { await SplashScreen.hideAsync(); } catch {}
      });

    return () => clearTimeout(timeout);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F1E8', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6F943E" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, height: WINDOW_HEIGHT }}>
      <SafeAreaProvider>
        <ErrorBoundary screenName="App root">
          <QueryProvider>
            <NavTree />
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
      {/* Outside NavTree: splashDone toggle never re-renders the navigation tree */}
      {!splashDone && <AnimatedSplash onDone={handleSplashDone} />}
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
