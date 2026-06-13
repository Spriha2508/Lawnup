import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatScreen } from '../features/ai-doctor/screens/ChatScreen';
import { fadeTransition } from './transitions';
import type { ChatStackParamList } from './types';

const Stack = createStackNavigator<ChatStackParamList>();

// Only `Chat` is wired today; `ChatHistory` is declared in types for the
// upcoming full AI-Doctor build but has no screen yet — intentionally omitted.
export const ChatNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);
