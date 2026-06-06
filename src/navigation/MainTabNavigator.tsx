import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ScanNavigator } from './ScanNavigator';
import { PlantsNavigator } from './PlantsNavigator';
import { ChatScreen } from '../features/ai-doctor/screens/ChatScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { colors } from '../constants/colors';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) => (
  <View className="items-center justify-center">
    <Text style={{ fontSize: 22 }}>{emoji}</Text>
    <Text
      className="text-xs mt-0.5"
      style={{ color: focused ? colors.primary : colors.textSecondary, fontFamily: 'Nunito-SemiBold' }}
    >
      {label}
    </Text>
  </View>
);

export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        height: 72,
        paddingBottom: 8,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home" emoji="🏠" focused={focused} /> }}
    />
    <Tab.Screen
      name="Scan"
      component={ScanNavigator}
      options={{ tabBarIcon: ({ focused }) => <TabIcon label="Scan" emoji="🔍" focused={focused} /> }}
    />
    <Tab.Screen
      name="Plants"
      component={PlantsNavigator}
      options={{ tabBarIcon: ({ focused }) => <TabIcon label="My Plants" emoji="🌿" focused={focused} /> }}
    />
    <Tab.Screen
      name="AiDoctor"
      component={ChatScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon label="AI Doc" emoji="🤖" focused={focused} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon label="Profile" emoji="👤" focused={focused} /> }}
    />
  </Tab.Navigator>
);
