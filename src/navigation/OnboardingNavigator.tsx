import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../features/onboarding/screens/WelcomeScreen';
import { LocationScreen } from '../features/onboarding/screens/LocationScreen';
import { GoalScreen } from '../features/onboarding/screens/GoalScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Location" component={LocationScreen} />
    <Stack.Screen name="Goal" component={GoalScreen} />
  </Stack.Navigator>
);
