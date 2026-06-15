import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, LogBox, Dimensions } from 'react-native';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_600SemiBold_Italic,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from './src/app/providers/QueryProvider';
import { NotificationProvider } from './src/app/providers/NotificationProvider';
import { ErrorBoundary } from './src/shared/components/feedback/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AnimatedSplash } from './src/shared/components/motion/AnimatedSplash';
import { RootAtmosphere, setAtmosphereForRoute, getActiveRouteName } from './src/shared/components/motion/RootAtmosphere';
import { JourneyVine, setVineForRoute } from './src/shared/components/motion/JourneyVine';
import { logger } from './src/shared/utils/logger';

const WINDOW_HEIGHT = Dimensions.get('window').height;
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

// Transparent background + card so the single RootAtmosphere shows through every
// screen — the world never repaints/resets on navigation.
const NAV_THEME = {
  dark: false,
  colors: {
    background: 'transparent',
    card: 'transparent',
    text: '#F0FDF4',
    border: 'rgba(255,255,255,0.07)',
    primary: '#4ADE80',
    notification: '#4ADE80',
  },
} as const;

// Drive atmosphere depth + journey vine from the active route on every navigation.
const handleNavState = (state: Parameters<typeof getActiveRouteName>[0]) => {
  const name = getActiveRouteName(state);
  setAtmosphereForRoute(name);
  setVineForRoute(name);
};

// Isolated so that splashDone state changes in App never cascade into the nav tree.
// DevOverlay lives INSIDE NavigationContainer so its navigation hooks have context.
const NavTree: React.FC = memo(() => (
  <NavigationContainer theme={NAV_THEME} onStateChange={handleNavState}>
    <NotificationProvider>
      <StatusBar style="dark" />
      <RootNavigator />
      {DevOverlay ? <DevOverlay /> : null}
    </NotificationProvider>
  </NavigationContainer>
));
NavTree.displayName = 'NavTree';

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
      'Jakarta-Regular':        PlusJakartaSans_400Regular,
      'Jakarta-Italic':         PlusJakartaSans_400Regular_Italic,
      'Jakarta-SemiBold':       PlusJakartaSans_600SemiBold,
      'Jakarta-SemiBoldItalic': PlusJakartaSans_600SemiBold_Italic,
      'Jakarta-Bold':           PlusJakartaSans_700Bold,
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
      <View style={{ flex: 1, backgroundColor: '#F7F4EC', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#5E7F61" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, height: WINDOW_HEIGHT }}>
      <SafeAreaProvider>
        <ErrorBoundary screenName="App root">
          <QueryProvider>
            {/* One continuous world: atmosphere persists behind the transparent navigator */}
            <View style={{ flex: 1 }}>
              <RootAtmosphere />
              <NavTree />
              {/* The journey thread: grows through signup → onboarding, blooms at home */}
              <JourneyVine />
            </View>
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
      {/* Outside NavTree: splashDone toggle never re-renders the navigation tree */}
      {!splashDone && <AnimatedSplash onDone={handleSplashDone} />}
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
