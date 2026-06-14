import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { EditProfileScreen } from '../features/profile/screens/EditProfileScreen';
import { SettingsScreen } from '../features/profile/screens/SettingsScreen';
import { ScanHistoryScreen } from '../features/profile/screens/ScanHistoryScreen';
import { HelpSupportScreen } from '../features/profile/screens/HelpSupportScreen';
import { RemindersScreen } from '../features/reminders/screens/RemindersScreen';
import { AddReminderScreen } from '../features/reminders/screens/AddReminderScreen';
import { fadeTransition } from './transitions';
import type { ProfileStackParamList } from './types';

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
    <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} />
    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <Stack.Screen name="Reminders" component={RemindersScreen} />
    <Stack.Screen name="AddReminder" component={AddReminderScreen} />
  </Stack.Navigator>
);
