import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatScreen } from '../features/ai-doctor/screens/ChatScreen';
import { fadeTransition } from './transitions';
import type { ChatStackParamList } from './types';

const Stack = createStackNavigator<ChatStackParamList>();

// Nested screen is `ChatHome` (not `Chat`) so it doesn't collide with the
// `Chat` tab name — avoids React Navigation's duplicate-route warning.
export const ChatNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
    <Stack.Screen name="ChatHome" component={ChatScreen} />
  </Stack.Navigator>
);
