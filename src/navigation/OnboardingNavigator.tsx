import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen }    from '../features/onboarding/screens/WelcomeScreen';
import { LocationScreen }   from '../features/onboarding/screens/LocationScreen';
import { PlaceTypeScreen }  from '../features/onboarding/screens/PlaceTypeScreen';
import { SkillLevelScreen } from '../features/onboarding/screens/SkillLevelScreen';
import { fadeTransition } from './transitions';
import { theme } from '@constants/designSystem';
import type { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

// Calm 250ms content cross-fade — the world stays still; only content changes.
export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      cardStyle: { backgroundColor: theme.color.canvas },
      ...fadeTransition,
    }}
  >
    <Stack.Screen name="Welcome"    component={WelcomeScreen}    />
    <Stack.Screen name="Location"   component={LocationScreen}   />
    <Stack.Screen name="PlaceType"  component={PlaceTypeScreen}  />
    <Stack.Screen name="SkillLevel" component={SkillLevelScreen} />
  </Stack.Navigator>
);
