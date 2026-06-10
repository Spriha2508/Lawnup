import React from 'react';
import {
  createStackNavigator,
  type StackCardInterpolationProps,
} from '@react-navigation/stack';
import { ScanLandingScreen } from '../features/scan/screens/ScanLandingScreen';
import { CameraScreen } from '../features/scan/screens/CameraScreen';
import { ProcessingScreen } from '../features/scan/screens/ProcessingScreen';
import { ScanResultScreen } from '../features/scan/screens/ScanResultScreen';
import { NicknameScreen } from '../features/scan/screens/NicknameScreen';
import { colors } from '../constants/colors';
import type { ScanStackParamList } from './types';

const Stack = createStackNavigator<ScanStackParamList>();

// Cross-fade for the capture → processing → result chain. Processing's backdrop
// is the captured photo (blurred), so fading between these screens feels
// continuous and intentional rather than sliding in as separate pages.
const fadeCard = ({ current }: StackCardInterpolationProps) => ({
  cardStyle: { opacity: current.progress },
});

export const ScanNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
      headerTitleStyle: { fontFamily: 'Nunito-Bold' },
    }}
  >
    <Stack.Screen name="ScanLanding" component={ScanLandingScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Camera" component={CameraScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="Processing"
      component={ProcessingScreen}
      options={{ headerShown: false, cardStyleInterpolator: fadeCard, gestureEnabled: false }}
    />
    <Stack.Screen
      name="ScanResult"
      component={ScanResultScreen}
      options={{ headerShown: false, cardStyleInterpolator: fadeCard, gestureEnabled: false }}
    />
    <Stack.Screen name="Nickname" component={NicknameScreen} options={{ title: '', headerTransparent: true }} />
  </Stack.Navigator>
);
