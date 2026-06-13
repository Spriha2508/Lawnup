import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ScanLandingScreen } from '../features/scan/screens/ScanLandingScreen';
import { CameraScreen } from '../features/scan/screens/CameraScreen';
import { ProcessingScreen } from '../features/scan/screens/ProcessingScreen';
import { ScanResultScreen } from '../features/scan/screens/ScanResultScreen';
import { NicknameScreen } from '../features/scan/screens/NicknameScreen';
import { colors } from '../constants/colors';
import { fadeTransition } from './transitions';
import type { ScanStackParamList } from './types';

const Stack = createStackNavigator<ScanStackParamList>();

// The capture → processing → result chain cross-fades (250ms) so it reads as one
// continuous cinematic sequence rather than separate sliding pages.
export const ScanNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
      headerTitleStyle: { fontFamily: 'Nunito-Bold' },
      ...fadeTransition,
    }}
  >
    <Stack.Screen name="ScanLanding" component={ScanLandingScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Camera" component={CameraScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Processing" component={ProcessingScreen} options={{ headerShown: false, gestureEnabled: false }} />
    <Stack.Screen name="ScanResult" component={ScanResultScreen} options={{ headerShown: false, gestureEnabled: false }} />
    <Stack.Screen name="Nickname" component={NicknameScreen} options={{ title: '', headerTransparent: true }} />
  </Stack.Navigator>
);
