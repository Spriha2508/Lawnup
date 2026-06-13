import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { PaywallScreen } from '../features/subscription/screens/PaywallScreen';
import { RemindersScreen } from '../features/reminders/screens/RemindersScreen';
import { AddReminderScreen } from '../features/reminders/screens/AddReminderScreen';
import { fadeTransition } from './transitions';
import type { ProfileStackParamList } from './types';

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Reminders" component={RemindersScreen} />
    <Stack.Screen name="AddReminder" component={AddReminderScreen} />
    <Stack.Screen
      name="Paywall"
      component={PaywallScreen}
      options={{ presentation: 'modal', gestureEnabled: true }}
    />
  </Stack.Navigator>
);
